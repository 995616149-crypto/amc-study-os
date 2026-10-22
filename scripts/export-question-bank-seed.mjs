#!/usr/bin/env node
/**
 * Export the full question bank from a populated local D1 database.
 *
 * The `drizzle/` data migrations carry an earlier, smaller bank. This seed adds the
 * rest and overwrites any row that also exists there, so applying it after the
 * migrations always converges on one complete content set. It uses
 * `INSERT OR REPLACE` keyed on each table's primary key, which makes it idempotent.
 *
 * Usage: node scripts/export-question-bank-seed.mjs [--db <path>] [--out <path>]
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
const SQL_OUT = arg("--out", join(ROOT, "seed", "question_bank_seed.sql"));
const GZ_OUT = `${SQL_OUT}.gz`;

/**
 * Content tables only. Learner state (attempts, notes, review state, FSRS, sessions,
 * stats, caches) is deliberately excluded: it is not content, and shipping it would
 * publish someone's study record.
 */
const TABLES = [
  "sources",
  "knowledge_chapters",
  "knowledge_nodes",
  "canonical_chapters",
  "canonical_sections",
  "canonical_subtopics",
  "questions",
  "question_options",
  "canonical_records",
  "canonical_question_learning_map",
  "canonical_learning_candidates",
  "question_node_links",
  "question_concept_map",
  "emidici_duplicate_mark",
  "source_answer_recovery",
  "current_answer_versions",
  "feature_flags",
  "guidance_source_metadata",
  "node_evidence",
  "data_hygiene_migrations",
];

const db = new DatabaseSync(DB_PATH, { readOnly: true });
mkdirSync(dirname(SQL_OUT), { recursive: true });

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString("hex")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function* generate() {
  yield "-- AMC Study OS question bank seed\n-- Generated from a local D1 database. Idempotent: INSERT OR REPLACE on primary keys.\nPRAGMA defer_foreign_keys = ON;\n\n";
  for (const table of TABLES) {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (!exists) {
      yield `-- skipped (missing): ${table}\n`;
      continue;
    }
    const columns = db.prepare(`PRAGMA table_info("${table}")`).all();
    const names = columns.map((column) => column.name);
    const hasPk = columns.some((column) => column.pk > 0);
    const verb = hasPk ? "INSERT OR REPLACE" : "INSERT";
    const rows = db.prepare(`SELECT * FROM "${table}"`).all();
    yield `-- ${table}: ${rows.length} rows\n`;
    const columnList = names.map((name) => `"${name}"`).join(", ");
    for (const row of rows) {
      const values = names.map((name) => quote(row[name])).join(", ");
      yield `${verb} INTO "${table}" (${columnList}) VALUES (${values});\n`;
    }
    yield "\n";
  }
}

const out = createWriteStream(SQL_OUT);
for (const chunk of generate()) {
  if (!out.write(chunk)) await new Promise((done) => out.once("drain", done));
}
await new Promise((done) => out.end(done));

await pipeline(createReadStream(SQL_OUT), createGzip({ level: 9 }), createWriteStream(GZ_OUT));

db.close();
console.log(`wrote ${SQL_OUT}`);
console.log(`wrote ${GZ_OUT}`);
