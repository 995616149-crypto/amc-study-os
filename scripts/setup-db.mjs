#!/usr/bin/env node
/**
 * Provision the local D1 database from the migrations in `drizzle/` and the
 * textbook seed in `seed/`.
 *
 * The dev server creates the SQLite file on first start, so the supported order is:
 *
 *   1. pnpm install
 *   2. npm run dev        (start once, then stop — this creates .wrangler/state)
 *   3. node scripts/setup-db.mjs
 *   4. npm run dev
 *
 * Re-running is safe: each migration is recorded in `d1_migrations`, and the
 * textbook seed is skipped when rows are already present.
 *
 * Usage: node scripts/setup-db.mjs [--force]
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const D1_STATE_DIR = join(ROOT, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
const DRIZZLE_DIR = join(ROOT, "drizzle");
const WRANGLER_CONFIG = join(ROOT, "dist", "server", "wrangler.json");
const FORCE = process.argv.includes("--force");

function listDatabases() {
  if (!existsSync(D1_STATE_DIR)) return [];
  return readdirSync(D1_STATE_DIR)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => join(D1_STATE_DIR, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
}

/**
 * Wrangler owns the D1 registration inside `.wrangler/state`; a bare SQLite file
 * dropped in that directory is not picked up. Provisioning therefore goes through
 * Wrangler, which creates and registers the database in one step.
 */
function provisionWithWrangler() {
  if (!existsSync(WRANGLER_CONFIG)) {
    console.log("no build output found — building first (this takes about a minute)");
    const build = spawnSync(process.execPath, [join(ROOT, "scripts", "run-framework.mjs"), "build"], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    if (build.status !== 0 || !existsSync(WRANGLER_CONFIG)) {
      console.error("build failed; run `npm run build` manually and re-run this script.");
      process.exit(1);
    }
  }
  console.log("initialising the local D1 database via Wrangler");
  const result = spawnSync(
    process.execPath,
    [
      "--import", "./scripts/sites-env.mjs",
      "./node_modules/wrangler/bin/wrangler.js", "d1", "execute", "DB",
      "--local", "--persist-to", ".wrangler/state",
      "--config", "dist/server/wrangler.json",
      "--command", "select 1",
    ],
    { cwd: ROOT, stdio: "pipe", env: { ...process.env, NODE_OPTIONS: "" } },
  );
  if (result.status !== 0) {
    console.error(String(result.stderr ?? "").slice(0, 1200));
    console.error("could not create the local D1 database.");
    process.exit(1);
  }
}

let dbPath = listDatabases()[0] ?? null;
if (!dbPath) {
  provisionWithWrangler();
  dbPath = listDatabases()[0] ?? null;
}
if (!dbPath) {
  console.error("Wrangler reported success but no database file appeared under .wrangler/state.");
  process.exit(1);
}

console.log(`database: ${dbPath}`);
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = OFF");

/**
 * Drizzle emits one statement per `--> statement-breakpoint` marker. Splitting on
 * `;` would corrupt the import: question stems and explanations are string literals
 * that legitimately contain semicolons.
 */
function statementsOf(sql) {
  return sql
    .split(/-->\s*statement-breakpoint\s*/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

db.exec(`CREATE TABLE IF NOT EXISTS d1_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
)`);
const applied = new Set(db.prepare("SELECT name FROM d1_migrations").all().map((row) => row.name));

const files = readdirSync(DRIZZLE_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort();
console.log(`migrations: ${files.length} file(s), ${applied.size} already recorded`);

let ran = 0;
for (const file of files) {
  if (applied.has(file) && !FORCE) continue;
  const sql = readFileSync(join(DRIZZLE_DIR, file), "utf8");
  let pending = 0;
  for (const statement of statementsOf(sql)) {
    try {
      db.exec(statement);
      pending += 1;
    } catch (error) {
      // Idempotent DDL and repeated seed rows are expected on a --force re-run.
      if (!/already exists|UNIQUE constraint failed|duplicate column/i.test(String(error))) {
        console.error(`FAILED in ${file}: ${error}`);
        process.exit(1);
      }
    }
  }
  db.prepare("INSERT OR REPLACE INTO d1_migrations (name) VALUES (?)").run(file);
  ran += 1;
  console.log(`  applied ${file} (${pending} statements)`);
}

const SEEDS = [
  // Always applied: it is idempotent (INSERT OR REPLACE on primary keys) and it is
  // what brings the bank up to the full question count, on top of the subset that
  // the drizzle data migrations already inserted.
  { path: join(ROOT, "seed", "question_bank_seed.sql.gz"), table: "questions", label: "question bank", always: true },
  { path: join(ROOT, "seed", "textbook_seed.sql.gz"), table: "textbook_block", label: "textbook", always: false },
];

for (const seed of SEEDS) {
  if (!existsSync(seed.path)) {
    console.log(`${seed.label}: seed file missing, skipped`);
    continue;
  }
  const existing = db.prepare(`SELECT count(*) AS n FROM ${seed.table}`).get().n;
  if (!seed.always && existing > 0 && !FORCE) {
    console.log(`${seed.label}: skipped (${existing} rows already present)`);
    continue;
  }
  console.log(`${seed.label}: importing (this takes a moment)`);
  const sql = gunzipSync(readFileSync(seed.path)).toString("utf8");
  db.exec("BEGIN");
  try {
    db.exec(sql);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error(`FAILED while importing ${seed.label}: ${error}`);
    process.exit(1);
  }
  console.log(`${seed.label}: ${db.prepare(`SELECT count(*) AS n FROM ${seed.table}`).get().n} rows`);
}

const counts = ["questions", "question_options", "textbook_block", "knowledge_nodes"]
  .map((table) => {
    try {
      return `${table}=${db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n}`;
    } catch {
      return `${table}=?`;
    }
  })
  .join("  ");

db.close();
console.log(`done (${ran} migration(s) applied): ${counts}`);
