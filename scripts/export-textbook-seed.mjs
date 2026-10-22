#!/usr/bin/env node
/**
 * Re-export `seed/textbook_seed.sql.gz` from a populated local D1 database.
 *
 * Use this after importing a different textbook edition, or to regenerate the seed
 * from your own database. Content tables only: the FTS5 index is rebuilt from its
 * external content table at the end of the file, which keeps the seed small.
 *
 * Usage: node scripts/export-textbook-seed.mjs [--db <path>] [--out <path>]
 */
import { createReadStream, createWriteStream, mkdirSync, readdirSync, statSync } from "node:fs";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function defaultDatabase() {
  const dir = join(ROOT, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  const candidates = readdirSync(dir)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => join(dir, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (!candidates.length) throw new Error(`no database found under ${dir}`);
  return candidates[0];
}

const DB_PATH = arg("--db", defaultDatabase());
const SQL_OUT = arg("--out", join(ROOT, "seed", "textbook_seed.sql"));
const GZ_OUT = `${SQL_OUT}.gz`;

/** Ordered so foreign references resolve on insert. */
const TABLES = [
  "textbook_book",
  "textbook_part",
  "textbook_chapter",
  "textbook_section",
  "textbook_section_index",
  "textbook_block",
  "question_murtagh_chapter_map",
  "question_textbook_link",
];

/** Tables created outside `drizzle/`, so the seed must carry their DDL. */
const SELF_DDL = ["question_murtagh_chapter_map"];

const db = new DatabaseSync(DB_PATH, { readOnly: true });

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString("hex")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function ddlFor(table) {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(table);
  if (!row?.sql) return `-- missing DDL for ${table}\n`;
  const tableSql = String(row.sql).replace(/^CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
  const indexSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL")
    .all(table)
    .map((entry) =>
      `${String(entry.sql)
        .replace(/^CREATE UNIQUE INDEX\s+/i, "CREATE UNIQUE INDEX IF NOT EXISTS ")
        .replace(/^CREATE INDEX\s+/i, "CREATE INDEX IF NOT EXISTS ")};`,
    )
    .join("\n");
  return `${tableSql};\n${indexSql}\n`;
}

function* generate() {
  yield "-- AMC Study OS textbook seed\n-- Generated from a local D1 database.\n-- Import order: DDL for tables outside drizzle/, then data, then FTS rebuild.\nPRAGMA defer_foreign_keys = ON;\n\n";
  for (const table of SELF_DDL) {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (exists) yield ddlFor(table);
  }
  yield "\n";
  for (const table of TABLES) {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (!exists) {
      yield `-- skipped (missing): ${table}\n`;
      continue;
    }
    const columns = db.prepare(`PRAGMA table_info("${table}")`).all().map((column) => column.name);
    const rows = db.prepare(`SELECT * FROM "${table}"`).all();
    yield `-- ${table}: ${rows.length} rows\n`;
    const columnList = columns.map((name) => `"${name}"`).join(", ");
    for (const row of rows) {
      const values = columns.map((name) => quote(row[name])).join(", ");
      yield `INSERT INTO "${table}" (${columnList}) VALUES (${values});\n`;
    }
    yield "\n";
  }
  yield "-- rebuild the FTS5 external-content index\nINSERT INTO textbook_section_fts(textbook_section_fts) VALUES('rebuild');\n";
}

mkdirSync(dirname(SQL_OUT), { recursive: true });
const out = createWriteStream(SQL_OUT);
for (const chunk of generate()) {
  if (!out.write(chunk)) await new Promise((done) => out.once("drain", done));
}
await new Promise((done) => out.end(done));

await pipeline(createReadStream(SQL_OUT), createGzip({ level: 9 }), createWriteStream(GZ_OUT));

db.close();
console.log(`wrote ${SQL_OUT}`);
console.log(`wrote ${GZ_OUT}`);
