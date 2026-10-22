/**
 * Textbook source — the ONLY place the reader touches textbook data.
 *
 * It reads the assembled artifacts IN PLACE:
 *
 *   textbooks/murtagh_gp_9e/structured/{book,toc,parts,chapters,sections,figures,tables}.json
 *   textbooks/murtagh_gp_9e/structured/blocks.jsonl
 *   textbooks/murtagh_gp_9e/index/textbook.sqlite        <- the FTS5 index
 *   textbooks/murtagh_gp_9e/chapters/<slug>/assets/...   <- figure + table crops
 *
 * There is deliberately NO second textbook database: full-text search runs against the
 * same `index/textbook.sqlite` the assembler built, read through `node:sqlite`, and the
 * blocks come from the assembled `blocks.jsonl`. Nothing here re-parses, re-OCRs or
 * rewrites the textbook.
 *
 * Annotations, bookmarks and reading state are a different concern and live in their own
 * small store (`index/reader_store.sqlite`) — user data, not textbook content.
 *
 * Server-only: it uses node:fs and node:sqlite. Route handlers that import it must set
 * `export const runtime = "nodejs"`.
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  BundleReader,
  type SearchHit,
  type SearchOptions,
  type TextbookBlock,
  type TextbookBook,
  type TextbookBundle,
  type TextbookSearch,
  type TocDocument,
} from "./textbook-reader";

// The assembled corpus is large (3.9 GB).  It is resolved by probe rather than
// by a single hard-coded path, so the reader keeps working whether the corpus
// lives inside the project, in the external data root it was moved to in order
// to keep the deployable tree under the publisher's upload limit, or anywhere
// else named by TEXTBOOK_MURTAGH_ROOT.
function resolveBookRoot(): string {
  const candidates = [
    process.env.TEXTBOOK_MURTAGH_ROOT,
    String.raw`C:\AMC_Study_OS_data\textbooks\murtagh_gp_9e`,
    String.raw`C:\AMC_Study_OS\textbooks\murtagh_gp_9e`,
    path.join(process.cwd(), "textbooks", "murtagh_gp_9e"),
  ].filter((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0);
  for (const candidate of candidates) {
    try {
      // `chapters` plus the structured state file together identify a complete
      // corpus; the in-project directory is only a metadata remnant after the
      // corpus body was moved out to keep the deployable tree small.
      if (fs.existsSync(path.join(candidate, "chapters")) && fs.existsSync(path.join(candidate, "structured", "FULL_BOOK_STATE.json"))) {
        return candidate;
      }
    } catch {
      // An unreadable candidate is simply skipped; the next one is probed.
    }
  }
  return candidates[1] ?? candidates[0] ?? "textbooks/murtagh_gp_9e";
}

export const BOOK_ROOT = resolveBookRoot();

const STRUCT = path.join(BOOK_ROOT, "structured");
const INDEX_DB = path.join(BOOK_ROOT, "index", "textbook.sqlite");
const READER_DB = path.join(BOOK_ROOT, "index", "reader_store.sqlite");
const PAGE_DIR = path.join(BOOK_ROOT, "index", "reader_pages");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function readJsonl(file: string): TextbookBlock[] {
  const out: TextbookBlock[] = [];
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    if (line.trim()) out.push(JSON.parse(line) as TextbookBlock);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* bundle (cached per process)                                        */
/* ------------------------------------------------------------------ */

let cachedReader: BundleReader | null = null;
let cachedBundle: TextbookBundle | null = null;

export function getBundle(): TextbookBundle {
  if (cachedBundle) return cachedBundle;
  const book = readJson<TextbookBook>(path.join(STRUCT, "book.json"));
  const toc = readJson<TocDocument>(path.join(STRUCT, "toc.json"));
  const blocks = readJsonl(path.join(STRUCT, "blocks.jsonl"));
  cachedBundle = { book, toc, blocks };
  return cachedBundle;
}

export function getReader(): BundleReader {
  if (!cachedReader) cachedReader = new BundleReader(getBundle());
  return cachedReader;
}

export function bookStats() {
  const { book, blocks } = getBundle();
  const flaggedTables = blocks.filter((b) => (b as any).manual_review_status).length;
  const noImageRegion = blocks.filter((b) => (b as any).figure_asset_unavailable).length;
  return {
    book,
    blocks: blocks.length,
    chapters: book.chapters ?? 0,
    sections: book.sections ?? 0,
    figures: book.figures,
    tables: book.tables,
    flaggedTables,
    noImageRegion,
    generated: book.generated ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* asset URLs                                                         */
/* ------------------------------------------------------------------ */

/** Book-relative path -> a URL the browser can load. Never exposes an absolute path. */
export function assetUrl(rel: string | undefined | null): string | null {
  if (!rel) return null;
  return `/api/textbook/asset?p=${encodeURIComponent(rel)}`;
}

/** Resolve a book-relative path, refusing anything outside the book root. */
export function resolveWithinBook(rel: string): string | null {
  const norm = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  if (norm.includes("..") || path.isAbsolute(norm)) return null;
  const full = path.resolve(BOOK_ROOT, norm);
  const root = path.resolve(BOOK_ROOT);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

/* ------------------------------------------------------------------ */
/* full-text search over the assembled FTS5 index                     */
/* ------------------------------------------------------------------ */

function ftsQuery(q: string): string {
  const trimmed = q.trim();
  if (!trimmed) return "";
  // a multi-word query is a phrase, so "atrial fibrillation" cannot match the two words
  // scattered across a page; single words stay bare so porter stemming applies
  if (/\s/.test(trimmed) && !trimmed.startsWith('"')) return `"${trimmed.replace(/"/g, "")}"`;
  return trimmed;
}

let searchDb: DatabaseSync | null = null;

function db(): DatabaseSync {
  if (!searchDb) {
    searchDb = new DatabaseSync(INDEX_DB, { readOnly: true });
  }
  return searchDb;
}

export class SqliteTextbookSearch implements TextbookSearch {
  async searchText(query: string, opts: SearchOptions = {}): Promise<SearchHit[]> {
    const match = ftsQuery(query);
    if (!match) return [];
    const limit = Math.max(1, Math.min(opts.limit ?? 20, 100));
    let rows: any[];
    try {
      rows = db()
        .prepare(
          `SELECT chapter_id, chapter_title, section_title, section_id,
                  pdf_page, printed_page, block_id,
                  snippet(blocks_fts, 3, '[[', ']]', ' … ', 16) AS snip,
                  bm25(blocks_fts) AS rank
             FROM blocks_fts
            WHERE blocks_fts MATCH ?
            ORDER BY rank
            LIMIT ?`,
        )
        .all(match, limit) as any[];
    } catch {
      return [];
    }
    return rows.map((r: any) => ({
      book: "book:murtagh-gp-9e",
      chapter_id: String(r.chapter_id ?? ""),
      chapter_title: String(r.chapter_title ?? ""),
      section_id: String(r.section_id ?? ""),
      section_title: String(r.section_title ?? ""),
      snippet: String(r.snip ?? "").replace(/\s+/g, " ").trim(),
      block_id: String(r.block_id ?? ""),
      pdf_page: Number(r.pdf_page ?? 0),
      printed_page: r.printed_page == null ? null : Number(r.printed_page),
      score: Number(r.rank ?? 0),
    }));
  }
}

let cachedSearch: SqliteTextbookSearch | null = null;
export function getSearch(): TextbookSearch {
  if (!cachedSearch) cachedSearch = new SqliteTextbookSearch();
  return cachedSearch;
}

/* ------------------------------------------------------------------ */
/* sections of one chapter (the left panel's third level)             */
/* ------------------------------------------------------------------ */

interface SectionRow {
  id: string;
  chapter_id: string;
  title: string;
  level?: number;
  pdf_page_start?: number | null;
  printed_page_start?: number | null;
}

let cachedSections: SectionRow[] | null = null;

export function sectionsForChapter(chapterId: string): SectionRow[] {
  if (!cachedSections) {
    const doc = readJson<{ sections: SectionRow[] }>(path.join(STRUCT, "sections.json"));
    cachedSections = doc.sections ?? [];
  }
  return cachedSections.filter((s: SectionRow) => s.chapter_id === chapterId);
}

/* ------------------------------------------------------------------ */
/* the unit list the reader can actually open                          */
/* ------------------------------------------------------------------ */

/**
 * `toc.json` is a FLAT node list (155 nodes with `parent_id`, no nested children), and 13
 * of its front-matter entries are TOC lines rather than readable units. `chapters.json` is
 * the authoritative list of the 131 units that have committed blocks, so the contents
 * panel is built from that and grouped by `part_id`.
 */
export interface ReaderUnit {
  id: string; number: number | null; title: string; part_id: string | null;
  part_title: string; printed_page_start: number | null; pdf_page_start: number | null;
  blocks: number | null; figures: number | null; tables: number | null;
}

interface ChapterRow extends Omit<ReaderUnit, "id"> {
  chapter_id: string;
}

export function unitsForClient() {
  const doc = readJson<{ chapters: ChapterRow[] }>(path.join(STRUCT, "chapters.json"));
  return (doc.chapters ?? []).map((c) => ({
    id: c.chapter_id,
    number: c.number ?? null,
    title: c.title,
    part_id: c.part_id ?? null,
    part_title: c.part_title ?? "",
    printed_page_start: c.printed_page_start ?? null,
    pdf_page_start: c.pdf_page_start ?? null,
    blocks: c.blocks ?? null,
    figures: c.figures ?? null,
    tables: c.tables ?? null,
  }));
}

export function partsForClient() {
  const { toc } = getBundle();
  return toc.nodes
    .filter((n) => n.kind === "part")
    .map((p) => ({ id: p.id, number: p.number ?? null, title: p.title,
                   printed_page_start: p.printed_page_start ?? null }));
}

/* ------------------------------------------------------------------ */
/* original source page (on demand, cached)                           */
/* ------------------------------------------------------------------ */

/**
 * "View original page" needs the source page the parser actually read. The chapter runs
 * released their page rasters, so one page is extracted on demand from the source PDF
 * (a byte copy of its embedded JPEG — not OCR, not a re-parse) and cached under
 * index/reader_pages. It is only ever used to check provenance, never as the body text.
 */
export function sourcePagePath(pdfPage: number): string | null {
  if (!Number.isFinite(pdfPage) || pdfPage < 1) return null;
  const name = String(pdfPage).padStart(4, "0");
  for (const ext of ["jpeg", "jpg", "png"]) {
    const p = path.join(PAGE_DIR, `p${name}.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function sourcePageDir(): string {
  return PAGE_DIR;
}

/* ------------------------------------------------------------------ */
/* reader store: annotations, bookmarks, reading state                */
/* ------------------------------------------------------------------ */

let store: DatabaseSync | null = null;

export function readerStore(): DatabaseSync {
  if (store) return store;
  fs.mkdirSync(path.dirname(READER_DB), { recursive: true });
  store = new DatabaseSync(READER_DB);
  store.exec(`
    CREATE TABLE IF NOT EXISTS annotations(
      annotation_id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL, block_id TEXT NOT NULL,
      selected_text TEXT NOT NULL, text_prefix TEXT NOT NULL DEFAULT '',
      text_suffix TEXT NOT NULL DEFAULT '',
      start_offset INTEGER NOT NULL, end_offset INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT '#ffe066', note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_ann_block ON annotations(block_id);
    CREATE TABLE IF NOT EXISTS bookmarks(
      bookmark_id TEXT PRIMARY KEY, book_id TEXT NOT NULL, block_id TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_bm_block ON bookmarks(block_id);
    CREATE TABLE IF NOT EXISTS reading_state(
      reader TEXT PRIMARY KEY, last_book TEXT, last_chapter TEXT, last_section TEXT,
      last_block TEXT, scroll_position REAL NOT NULL DEFAULT 0, last_read_at TEXT NOT NULL);
  `);
  return store;
}
