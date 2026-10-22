/**
 * Textbook reader data layer — contract only, no UI.
 *
 * Scope for now (mirrors section 14 of the Murtagh import spec):
 *   getBook / getTOC / getChapter / getSection / getBlocks / searchText /
 *   getAsset / getSourcePage
 *
 * Design notes that matter for the later full-book run
 * ---------------------------------------------------
 * - The module is *pure*: it never touches fs/network. Callers hand in an
 *   already-parsed `TextbookBundle`. That keeps the same code usable from a
 *   Cloudflare Worker (bundle built from D1) and from local tooling (bundle read
 *   off disk) without a second implementation.
 * - The textbook hierarchy is SOURCE hierarchy (book -> part -> chapter ->
 *   section -> subsection). It is deliberately NOT mapped onto the AMC canonical
 *   taxonomy; crosswalk is a separate, later concern.
 * - Full-text search is expressed as an interface, not as SQLite calls, so the
 *   local SQLite FTS5 index (`index/textbook.sqlite`) and a future D1 FTS index
 *   are interchangeable behind `TextbookSearch`.
 */

export type TextbookBlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "table"
  | "figure"
  | "caption"
  | "box"
  | "equation"
  | "discarded";

/** bbox in the parser's native normalised space (0..1000 on both axes). */
export type BboxNorm = readonly [number, number, number, number];
/** bbox in the page raster's own pixels. */
export type BboxPx = readonly [number, number, number, number];
/** bbox in the original PDF's point space (72/inch). */
export type BboxPt = readonly [number, number, number, number];

export interface TextbookBlock {
  block_id: string;
  book_id: string;
  chapter_id: string;
  chapter_title: string;
  section_id: string;
  subsection_id: string | null;
  block_type: TextbookBlockType;
  content: string;

  /** provenance — every block must carry both, see acceptance axis F */
  pdf_page: number;
  printed_page_if_detectable: number | null;
  printed_page_source: string;

  bbox_norm_1000: BboxNorm;
  bbox_raster_px: BboxPx;
  bbox_pdf_pt: BboxPt;
  page_raster_px: readonly [number | null, number | null];
  page_size_pt: readonly [number, number];

  reading_order: number;
  source_parser: string;
  confidence_if_available: number | null;
  confidence_note?: string;

  heading_level?: number;
  figure_id?: string;
  figure_asset?: string;
  caption?: string;
  table_id?: string;
  table_html?: string;
  table_text?: string;
  table_caption?: string;
  table_footnote?: string;
  table_complex?: boolean;
  table_stats?: { rows: number; spans: number; col_counts: number[]; uneven_columns: boolean };
  table_raw_crop?: string;
  mineru_crop?: string;
  crop_error?: string;
}

export interface TocNode {
  id: string;
  level: number;
  kind: "front_matter" | "part" | "chapter" | "back_matter" | "section" | "subsection";
  number: number | null;
  title: string;
  parent_id: string;
  children: TocNode[];
  printed_page_start: number | null;
  pdf_page_start: number | null;
  page_source?: string;
}

export interface TocDocument {
  book_id: string;
  hierarchy_source: string;
  printed_page_offset: number;
  counts: Record<string, number>;
  nodes: TocNode[];
}

export interface TextbookBook {
  book_id: string;
  title: string;
  scope: "PILOT" | "FULL";
  page_index_offset: string;
  source_parser: string;
  block_count: number;
  block_type_counts: Record<string, number>;
  figures: number;
  tables: number;
  /** written by the assembler's book.json; optional so a pilot bundle stays valid */
  chapters?: number;
  sections?: number;
  source_pdf_pages?: number;
  generated?: string;
}

export interface TextbookBundle {
  book: TextbookBook;
  toc: TocDocument;
  blocks: readonly TextbookBlock[];
}

/* ------------------------------------------------------------------ */
/* search                                                             */
/* ------------------------------------------------------------------ */

export interface SearchHit {
  book: string;
  chapter_id: string;
  chapter_title: string;
  section_id: string;
  /** section heading text, so a result can show section, not just its id */
  section_title?: string;
  snippet: string;
  block_id: string;
  pdf_page: number;
  printed_page: number | null;
  /** evidence quality, so a caller can rank textbook passages for a question */
  score: number;
}

export interface SearchOptions {
  limit?: number;
  chapterId?: string;
  blockTypes?: readonly TextbookBlockType[];
}

export interface TextbookSearch {
  searchText(query: string, opts?: SearchOptions): Promise<SearchHit[]>;
}

/** Snippet centred on the first query term, with the term left intact. */
export function makeSnippet(text: string, query: string, width = 220): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= width) return flat;
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const lower = flat.toLowerCase();
  let at = -1;
  for (const t of terms) {
    at = lower.indexOf(t);
    if (at >= 0) break;
  }
  if (at < 0) return flat.slice(0, width) + "…";
  const start = Math.max(0, at - Math.floor(width / 3));
  const end = Math.min(flat.length, start + width);
  return (start > 0 ? "…" : "") + flat.slice(start, end) + (end < flat.length ? "…" : "");
}

/** Merge per-chapter title text into a hit's searchable body: titles matter for recall. */
export function searchableText(b: TextbookBlock): string {
  const bits = [b.chapter_title, b.content];
  if (b.table_caption) bits.push(b.table_caption);
  if (b.caption) bits.push(b.caption);
  return bits.filter(Boolean).join(" \n ");
}

/* ------------------------------------------------------------------ */
/* reader                                                             */
/* ------------------------------------------------------------------ */

export interface SourcePageRef {
  book_id: string;
  pdf_page: number;
  printed_page: number | null;
  /** the raster to display, and the lossless native crop of any one block */
  page_asset_hint: string;
  block_bboxes: Array<{ block_id: string; bbox_raster_px: BboxPx }>;
}

export interface TextbookReader {
  getBook(): TextbookBook;
  getTOC(): TocDocument;
  getChapter(chapterId: string): { node: TocNode | null; blocks: TextbookBlock[] };
  getSection(sectionId: string): TextbookBlock[];
  getBlocks(filter: { chapterId?: string; sectionId?: string; pdfPage?: number }): TextbookBlock[];
  getAsset(assetRef: string): { ref: string; kind: "figure" | "table-crop" } | null;
  getSourcePage(pdfPage: number): SourcePageRef | null;
  /** jump target for an external caller (a question, a note, a highlight) */
  resolveJump(args: { blockId?: string; pdfPage?: number; printedPage?: number }):
    | { chapter_id: string; pdf_page: number; block_id: string | null }
    | null;
}

export class BundleReader implements TextbookReader {
  private readonly byChapter = new Map<string, TextbookBlock[]>();
  private readonly bySection = new Map<string, TextbookBlock[]>();
  private readonly byPage = new Map<number, TextbookBlock[]>();
  private readonly byBlock = new Map<string, TextbookBlock>();
  private readonly nodes = new Map<string, TocNode>();

  constructor(private readonly bundle: TextbookBundle) {
    const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
      const cur = m.get(k);
      if (cur) cur.push(v);
      else m.set(k, [v]);
    };
    for (const b of bundle.blocks) {
      this.byBlock.set(b.block_id, b);
      push(this.byChapter, b.chapter_id, b);
      push(this.bySection, b.section_id, b);
      push(this.byPage, b.pdf_page, b);
    }
    const walk = (n: TocNode) => {
      this.nodes.set(n.id, n);
      for (const c of n.children) walk(c);
    };
    for (const n of bundle.toc.nodes) walk(n);
  }

  getBook() { return this.bundle.book; }
  getTOC() { return this.bundle.toc; }

  getChapter(chapterId: string) {
    return { node: this.nodes.get(chapterId) ?? null, blocks: this.byChapter.get(chapterId) ?? [] };
  }
  getSection(sectionId: string) { return this.bySection.get(sectionId) ?? []; }

  getBlocks(filter: { chapterId?: string; sectionId?: string; pdfPage?: number }) {
    if (filter.sectionId) return this.bySection.get(filter.sectionId) ?? [];
    if (filter.chapterId) return this.byChapter.get(filter.chapterId) ?? [];
    if (typeof filter.pdfPage === "number") return this.byPage.get(filter.pdfPage) ?? [];
    return [...this.bundle.blocks];
  }

  getAsset(assetRef: string) {
    for (const b of this.bundle.blocks) {
      if (b.figure_asset === assetRef) return { ref: assetRef, kind: "figure" as const };
      if (b.table_raw_crop === assetRef) return { ref: assetRef, kind: "table-crop" as const };
    }
    return null;
  }

  getSourcePage(pdfPage: number): SourcePageRef | null {
    const blocks = this.byPage.get(pdfPage);
    if (!blocks?.length) return null;
    const first = blocks[0];
    return {
      book_id: first.book_id,
      pdf_page: pdfPage,
      printed_page: first.printed_page_if_detectable,
      page_asset_hint: `assets/page_crops/p${String(pdfPage).padStart(4, "0")}.jpeg`,
      block_bboxes: blocks.map((b) => ({ block_id: b.block_id, bbox_raster_px: b.bbox_raster_px })),
    };
  }

  resolveJump(args: { blockId?: string; pdfPage?: number; printedPage?: number }):
    | { chapter_id: string; pdf_page: number; block_id: string | null }
    | null {
    if (args.blockId) {
      const b = this.byBlock.get(args.blockId);
      if (b) return { chapter_id: b.chapter_id, pdf_page: b.pdf_page, block_id: b.block_id };
    }
    if (typeof args.pdfPage === "number") {
      const b = this.byPage.get(args.pdfPage)?.[0];
      if (b) return { chapter_id: b.chapter_id, pdf_page: b.pdf_page, block_id: b.block_id };
    }
    if (typeof args.printedPage === "number") {
      const next: { pdfPage: number } = { pdfPage: args.printedPage + 10 };
      return this.resolveJump(next);
    }
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* annotations (spec 17)                                              */
/* ------------------------------------------------------------------ */

export interface Annotation {
  annotation_id: string;
  book_id: string;
  block_id: string;

  selected_text: string;
  text_prefix: string;
  text_suffix: string;
  start_offset: number;
  end_offset: number;

  color: string;
  note: string;
  created_at: string;
  updated_at: string;
}

/**
 * Anchors a highlight to the *inside* of one block, so a chapter can be
 * re-rendered later — after a re-parse — and the highlight is still recoverable.
 * Offsets are into `block.content`, and prefix/suffix make the anchor verifiable
 * when the text shifts.
 */
export function reanchor(a: Annotation, blocks: readonly TextbookBlock[]): boolean {
  const b = blocks.find((x) => x.block_id === a.block_id);
  if (!b) return false;
  const slice = b.content.slice(a.start_offset, a.end_offset);
  if (slice === a.selected_text) return true;
  const idx = b.content.indexOf(a.selected_text);
  if (idx >= 0) {
    a.start_offset = idx;
    a.end_offset = idx + a.selected_text.length;
    return true;
  }
  return false;
}

export function validateAnnotation(a: Annotation): string[] {
  const errs: string[] = [];
  if (!a.annotation_id) errs.push("annotation_id required");
  if (a.start_offset < 0 || a.end_offset <= a.start_offset) errs.push("invalid offsets");
  if (a.note.length === 0 && a.selected_text.length === 0) errs.push("empty annotation");
  if (!/^#[0-9a-f]{3,8}$/i.test(a.color)) errs.push("color must be a hex colour");
  return errs;
}

/* ------------------------------------------------------------------ */
/* reading state (spec 18)                                            */
/* ------------------------------------------------------------------ */

export interface ReadingState {
  last_book: string | null;
  last_chapter: string | null;
  last_section: string | null;
  last_block: string | null;
  scroll_position: number;
  last_read_at: string;
}

export const EMPTY_READING_STATE: ReadingState = {
  last_book: null,
  last_chapter: null,
  last_section: null,
  last_block: null,
  scroll_position: 0,
  last_read_at: "",
};

/* ------------------------------------------------------------------ */
/* question -> textbook evidence (spec 19) — FIELDS RESERVED ONLY     */
/* ------------------------------------------------------------------ */

/**
 * Contract reserved on the question side. Nothing runs in bulk until the full
 * book exists: the intended flow is
 *   question -> retrieve structured blocks -> best evidence block
 *            -> inherit chapter / section / page from that block.
 * Do not map the textbook hierarchy onto the AMC canonical taxonomy here; the
 * chapter/section carried by a link is the SOURCE hierarchy.
 */
export interface TextbookEvidenceLink {
  book_id: string;
  chapter_id: string;
  section_id: string;
  block_id: string;
  pdf_page: number;
  evidence_score: number;
  link_method: "fulltext" | "embedding" | "manual" | "inherited";
}

export interface QuestionTextbookEvidence {
  question_id: string;
  textbook_evidence_links: TextbookEvidenceLink[];
}
