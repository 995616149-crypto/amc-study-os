/**
 * Build the deployable Murtagh 9e section index inside the authoritative local D1.
 *
 * Source of truth is the assembler output that already exists (131 validated units,
 * 8420 sections, 35521 blocks).  Nothing is re-OCRed, re-parsed or re-extracted, and
 * no PDF is read: the block table of the assembler's SQLite is aggregated per
 * section, one row per section.
 *
 * The corpus itself lives outside the publishable tree (the deployment has a 2 GiB
 * upload limit), so this script reads it from the external data root and writes only
 * the compact index into the database that ships.
 *
 * Usage:
 *   node tools/release/build_textbook_fts.mjs            # report what would be built
 *   node tools/release/build_textbook_fts.mjs --apply
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, globSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const INDEX_VERSION = "murtagh-9e-section-fts-v1";

const EXTERNAL_ROOTS = [
  "C:\\AMC_Study_OS_data\\moved_bulk\\textbooks\\murtagh_gp_9e",
  resolve(ROOT, "textbooks", "murtagh_gp_9e"),
];

/** Longest section text kept in the index; keeps the DB (and the upload) bounded. */
const MAX_SECTION_CHARS = 6_000;
const MIN_SECTION_CHARS = 40;

function authoritativeDb() {
  const candidates = globSync(".wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite", { cwd: ROOT })
    .filter((path) => !path.includes("metadata"));
  if (!candidates.length) throw new Error("authoritative DB not found");
  return resolve(ROOT, candidates[0]);
}

function findTextbook() {
  for (const base of EXTERNAL_ROOTS) {
    const blocks = resolve(base, "index", "textbook.sqlite");
    if (existsSync(blocks)) return { base, blocks };
  }
  throw new Error("assembler textbook.sqlite not found in any known location");
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function main() {
  const apply = process.argv.includes("--apply");
  const { base, blocks } = findTextbook();
  const source = new DatabaseSync(blocks, { readOnly: true });

  // Aggregate blocks per section, preserving reading order and page span.
  const rows = source.prepare(`
    SELECT section_id,
           MIN(chapter_id)    AS chapter_id,
           MIN(chapter_title) AS chapter_title,
           MIN(part_title)    AS part_title,
           MIN(section_title) AS section_title,
           MIN(pdf_page)      AS page_start,
           MAX(pdf_page)      AS page_end,
           MIN(printed_page)  AS printed_page_start,
           COUNT(*)           AS block_count,
           GROUP_CONCAT(text, ' ') AS text
    FROM blocks
    WHERE section_id IS NOT NULL AND section_id <> ''
    GROUP BY section_id
  `).all();
  source.close();

  const prepared = [];
  for (const row of rows) {
    const text = clean(row.text);
    if (!row.section_id || text.length < MIN_SECTION_CHARS) continue;
    prepared.push({
      section_id: String(row.section_id),
      stable_source_id: String(row.section_id).replace(/^section:/, "murtagh-gp-9e:"),
      part_title: clean(row.part_title) || null,
      chapter_id: row.chapter_id ? String(row.chapter_id) : null,
      chapter_title: clean(row.chapter_title) || null,
      section_title: clean(row.section_title) || null,
      page_start: row.page_start ?? null,
      page_end: row.page_end ?? null,
      printed_page_start: Number.isFinite(row.printed_page_start) ? row.printed_page_start : null,
      block_count: Number(row.block_count ?? 0),
      text: text.slice(0, MAX_SECTION_CHARS),
    });
  }

  const summary = {
    source: blocks.replace(/\\/g, "/"),
    sections_total: rows.length,
    sections_indexable: prepared.length,
    skipped_short: rows.length - prepared.length,
    total_chars: prepared.reduce((sum, row) => sum + row.text.length, 0),
    index_version: INDEX_VERSION,
    applied: apply,
  };

  if (!apply) {
    console.log(JSON.stringify({ ...summary, dry_run: true, sample: prepared.slice(0, 2) }, null, 2));
    return;
  }

  const sqlite = new DatabaseSync(authoritativeDb());
  sqlite.exec("BEGIN");
  sqlite.exec("DELETE FROM textbook_section_fts");
  sqlite.exec("DELETE FROM textbook_section_index");
  const insert = sqlite.prepare(`INSERT INTO textbook_section_index
    (section_id, stable_source_id, part_title, chapter_id, chapter_title, section_title,
     page_start, page_end, printed_page_start, block_count, text)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  for (const row of prepared) {
    insert.run(row.section_id, row.stable_source_id, row.part_title, row.chapter_id, row.chapter_title,
      row.section_title, row.page_start, row.page_end, row.printed_page_start, row.block_count, row.text);
  }
  // Rebuild the external-content FTS from its content table.
  sqlite.exec("INSERT INTO textbook_section_fts (textbook_section_fts) VALUES ('rebuild')");
  sqlite.exec("COMMIT");

  const indexed = sqlite.prepare("SELECT COUNT(*) AS n FROM textbook_section_index").get().n;
  const ftsRows = sqlite.prepare("SELECT COUNT(*) AS n FROM textbook_section_fts").get().n;
  const probe = sqlite.prepare(`SELECT s.section_id, s.chapter_title, s.section_title, s.page_start,
      snippet(textbook_section_fts, 2, '[', ']', '…', 12) AS snip, bm25(textbook_section_fts) AS score
    FROM textbook_section_fts JOIN textbook_section_index s ON s.rowid = textbook_section_fts.rowid
    WHERE textbook_section_fts MATCH ? ORDER BY bm25(textbook_section_fts) LIMIT 3`).all("tachycardia OR palpitations");
  sqlite.close();

  console.log(JSON.stringify({ ...summary, indexed_sections: indexed, fts_rows: ftsRows, probe }, null, 2));
}

main();
