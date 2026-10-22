/**
 * Runtime location of a question inside Murtagh's General Practice, 9th edition.
 *
 * The searchable index lives in the deployed database (see
 * drizzle/0061_textbook_section_index.sql), so nothing here touches the filesystem
 * and no PDF or OCR artefact has to ship.
 *
 * Order of authority:
 *   1. a reviewed, human-approved question -> section link (always wins);
 *   2. a cached runtime result;
 *   3. SQLite FTS5 + bm25() over the section index, optionally re-ranked by the
 *      shared AI provider over a small candidate set.
 *
 * Below the confidence threshold the answer is "not reliably located" — a wrong
 * chapter is worse than no chapter.
 */
import { chatText, parseModelJson } from "./ai-provider";

export const TEXTBOOK_RETRIEVAL_VERSION = "murtagh-9e-v2-semantic-rerank";
/** Legacy rows written by the lexical-only pipeline; re-evaluated on first access. */
export const LEGACY_RETRIEVAL_VERSION = "murtagh-9e-fts-v1";

/** Minimum bm25-derived score for a result to be shown as a reliable location. */
const CONFIDENT_SCORE = 9;
const SHOW_SCORE = 4;
/**
 * How many FTS candidates are handed to the semantic reranker. FTS is a lexical
 * retriever: a high bm25 score means the words match, not that the clinical concept
 * matches (a Raynaud stem scored highly against an interstitial-lung-disease section).
 * It is therefore only a candidate generator; the ranking decision is the reranker's.
 */
const CANDIDATE_LIMIT = 8;

/**
 * VERIFIED_LOCATION  reranker chose a candidate with HIGH confidence
 * POSSIBLE_LOCATION  MEDIUM — shown as "possibly related", never as authoritative
 * UNRESOLVED         NONE/LOW, no candidates, or the reranker could not be used
 */
export type LocationStatus = "VERIFIED_LOCATION" | "POSSIBLE_LOCATION" | "UNRESOLVED";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "with", "on", "is", "are", "was", "were",
  "be", "been", "by", "as", "at", "from", "that", "this", "these", "those", "it", "its", "his", "her",
  "she", "he", "they", "them", "which", "who", "whom", "what", "when", "where", "how", "why", "not",
  "no", "but", "if", "then", "than", "so", "such", "also", "has", "have", "had", "do", "does", "did",
  "would", "could", "should", "may", "might", "must", "can", "will", "patient", "patients", "man",
  "woman", "year", "years", "old", "day", "days", "week", "weeks", "month", "months", "history",
  "present", "presents", "presented", "presents", "following", "most", "likely", "best", "next",
  "appropriate", "which", "one", "single", "choose", "answer", "question", "option", "about", "after",
  "before", "more", "less", "other", "into", "over", "under", "been", "being", "given", "reports",
]);

type D1Like = {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown>; first<T = unknown>(): Promise<T | null>; all<T = unknown>(): Promise<{ results: T[] }> } };
};

export type TextbookCandidate = {
  section_id: string;
  stable_source_id: string;
  chapter_title: string | null;
  section_title: string | null;
  page_start: number | null;
  page_end: number | null;
  printed_page_start: number | null;
  snippet: string;
  score: number;
};

export type TextbookLocation = {
  status: LocationStatus;
  method: "reviewed" | "cached" | "fts" | "fts+ai" | "none";
  section?: TextbookCandidate | null;
  section_id?: string | null;
  confidence: number;
  rationale: string;
  candidates?: TextbookCandidate[];
  fts_top1_score?: number | null;
  fts_margin?: number | null;
};

export type LocateInput = {
  questionId: string;
  stem: string;
  options: string[];
  explanation?: string | null;
};

/** Medical terms worth searching on: length, casing and digits all carry signal. */
export function buildSearchTerms(input: LocateInput, limit = 18): string[] {
  const raw = [input.stem, ...input.options, input.explanation ?? ""].join(" ").replace(/[A-Z]\.\s/g, " ");
  const counts = new Map<string, number>();
  for (const token of raw.split(/[^A-Za-z0-9\-]+/)) {
    const word = token.trim();
    if (word.length < 5 || word.length > 32) continue;
    const lower = word.toLowerCase();
    if (STOP_WORDS.has(lower)) continue;
    if (/^\d+$/.test(lower)) continue;
    counts.set(lower, (counts.get(lower) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => (right[1] - left[1]) || (right[0].length - left[0].length))
    .slice(0, limit)
    .map(([word]) => word);
}

function toMatchQuery(terms: string[]): string | null {
  if (!terms.length) return null;
  // Each term is quoted so a medical token containing "-" cannot break FTS syntax.
  return terms.map((term) => `"${term.replace(/"/g, "")}"`).join(" OR ");
}

function bm25ToScore(bm25: number): number {
  // SQLite FTS5 bm25() is negative and better when more negative.
  return Math.max(0, -Number(bm25 ?? 0));
}

async function ftsCandidates(database: D1Like, terms: string[], limit: number): Promise<TextbookCandidate[]> {
  const query = toMatchQuery(terms);
  if (!query) return [];
  const rows = await database.prepare(`
    SELECT s.section_id, s.stable_source_id, s.chapter_title, s.section_title,
           s.page_start, s.page_end, s.printed_page_start,
           snippet(textbook_section_fts, 2, '', '', ' … ', 14) AS snippet,
           bm25(textbook_section_fts) AS rank
    FROM textbook_section_fts
    JOIN textbook_section_index s ON s.rowid = textbook_section_fts.rowid
    WHERE textbook_section_fts MATCH ?
    ORDER BY bm25(textbook_section_fts)
    LIMIT ?
  `).bind(query, limit).all<any>();
  return (rows.results ?? []).map((row: any) => ({
    section_id: String(row.section_id),
    stable_source_id: String(row.stable_source_id ?? ""),
    chapter_title: row.chapter_title ?? null,
    section_title: row.section_title ?? null,
    page_start: row.page_start ?? null,
    page_end: row.page_end ?? null,
    printed_page_start: row.printed_page_start ?? null,
    snippet: String(row.snippet ?? "").replace(/\s+/g, " ").trim().slice(0, 400),
    score: bm25ToScore(row.rank),
  }));
}

async function readCachedLink(database: D1Like, questionId: string): Promise<{ section_id: string; method: string; score: number | null; confidence: number | null; rationale: string | null } | null> {
  return database.prepare(`SELECT section_id, method, score, confidence, rationale FROM question_textbook_link WHERE question_id=?`)
    .bind(questionId).first<any>() as any;
}

async function loadSection(database: D1Like, sectionId: string): Promise<TextbookCandidate | null> {
  const row = await database.prepare(`SELECT section_id, stable_source_id, chapter_title, section_title, page_start, page_end, printed_page_start, substr(text,1,320) AS snippet
    FROM textbook_section_index WHERE section_id=?`).bind(sectionId).first<any>();
  if (!row) return null;
  return {
    section_id: String(row.section_id),
    stable_source_id: String(row.stable_source_id ?? ""),
    chapter_title: row.chapter_title ?? null,
    section_title: row.section_title ?? null,
    page_start: row.page_start ?? null,
    page_end: row.page_end ?? null,
    printed_page_start: row.printed_page_start ?? null,
    snippet: String(row.snippet ?? "").replace(/\s+/g, " ").trim().slice(0, 300),
    score: 0,
  };
}


/**
 * Semantic rerank over a CLOSED candidate set.
 *
 * The model may only answer with one of the supplied candidate ids or NONE; it can never
 * name a chapter. Two deliberate properties:
 *
 *  * it runs for EVERY question that has no v2 cache — the old "score is high enough,
 *    trust the lexical top-1" shortcut is gone, because that is exactly what produced
 *    Raynaud -> interstitial lung disease;
 *  * it fails closed. A timeout, an HTTP error, unparseable JSON after one retry, or a
 *    NONE/LOW answer all end in UNRESOLVED. Nothing falls back to the lexical top-1 and
 *    calls it verified.
 */
async function rerank(question: string, candidates: TextbookCandidate[]): Promise<{ index: number | null; confidence: "HIGH" | "MEDIUM" | "LOW"; topic: string; reason: string } | null> {
  if (!candidates.length) return null;
  const list = candidates.map((candidate, index) => ({
    candidate_id: `C${index + 1}`,
    chapter: candidate.chapter_title,
    section: candidate.section_title,
    page: candidate.page_start,
    excerpt: candidate.snippet.slice(0, 220),
  }));
  const system = [
    "You place a clinical exam question into the textbook section it is really testing.",
    "You are given a CLOSED list of candidates retrieved by keyword search.",
    "Reply with JSON only:",
    '{"selected_candidate_id":"C1|...|NONE","confidence":"HIGH|MEDIUM|LOW","clinical_topic":"<short>","reason":"<short>"}',
    "selected_candidate_id may ONLY be one of the supplied ids, or NONE.",
    "Never invent a chapter, section or page. Never answer with an id that is not in the list.",
    "Use HIGH only when one candidate directly covers the same clinical decision the question tests.",
    "Use MEDIUM when a candidate is related but not the exact point.",
    "Use NONE with LOW when no candidate covers the tested concept — that is a good answer, not a failure.",
  ].join(" ");
  const user = JSON.stringify({
    question: question.slice(0, 1800),
    candidates: list,
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { text } = await chatText([
        { role: "system", content: system },
        { role: "user", content: user },
      ], { temperature: 0, timeoutMs: 30_000, maxBytes: 300_000 });
      const parsed = parseModelJson(text) as any;
      const rawId = String(parsed?.selected_candidate_id ?? "").trim().toUpperCase();
      const level = String(parsed?.confidence ?? "").trim().toUpperCase();
      const confidence = level === "HIGH" || level === "MEDIUM" || level === "LOW" ? level : "LOW";
      const match = /^C(\d+)$/.exec(rawId);
      const index = match ? Number(match[1]) - 1 : null;
      const chosen = index !== null && index >= 0 && index < candidates.length ? index : null;
      return {
        index: rawId === "NONE" ? null : chosen,
        confidence,
        topic: String(parsed?.clinical_topic ?? "").slice(0, 120),
        reason: String(parsed?.reason ?? "").slice(0, 200),
      };
    } catch {
      // one retry, then abstain — never fall back to the lexical top-1
    }
  }
  return null;
}

function statusFor(confidence: string, chosen: boolean): LocationStatus {
  if (!chosen) return "UNRESOLVED";
  if (confidence === "HIGH") return "VERIFIED_LOCATION";
  if (confidence === "MEDIUM") return "POSSIBLE_LOCATION";
  return "UNRESOLVED";
}

async function writeLink(database: D1Like, questionId: string, sectionId: string | null, status: LocationStatus, confidence: number, rationale: string, topScores: number[]): Promise<void> {
  const now = new Date().toISOString();
  await database.prepare(`INSERT INTO question_textbook_link
      (question_id, section_id, method, score, confidence, retrieval_version, rationale, created_at, verified_at)
    VALUES (?,?,?,?,?,?,?,?,?)
    ON CONFLICT(question_id) DO UPDATE SET section_id=excluded.section_id, method=excluded.method,
      score=excluded.score, confidence=excluded.confidence, retrieval_version=excluded.retrieval_version,
      rationale=excluded.rationale, verified_at=excluded.verified_at`)
    .bind(questionId, sectionId ?? "", `v2:${status}`, topScores[0] ?? 0, confidence, TEXTBOOK_RETRIEVAL_VERSION,
      `${rationale} | top=${topScores.map((value) => value.toFixed(1)).join(",")}`.slice(0, 300), now, now).run();
}

export async function locateTextbookSection(database: D1Like, input: LocateInput): Promise<TextbookLocation> {
  // 1. a reviewed, human-approved mapping outranks everything.
  const reviewed = await database.prepare(`SELECT section_id FROM question_concept_map WHERE question_id=?`)
    .bind(input.questionId).first<{ section_id: string | null }>();
  if (reviewed?.section_id) {
    const section = await loadSection(database, reviewed.section_id);
    if (section) {
      return { status: "VERIFIED_LOCATION", method: "reviewed", section, section_id: reviewed.section_id, confidence: 1, rationale: "已人工审核的章节映射", candidates: [section] };
    }
  }

  // 2. a v2 cache entry. Anything written by the old lexical pipeline is re-evaluated.
  const cached = await readCachedLink(database, input.questionId);
  if (cached?.section_id && cached.method !== "unlocated" && (cached as any).retrieval_version === TEXTBOOK_RETRIEVAL_VERSION) {
    const section = await loadSection(database, cached.section_id);
    const status = (String(cached.method).replace(/^v2:/, "") as LocationStatus) || "POSSIBLE_LOCATION";
    if (section) {
      return { status, method: "cached", section, section_id: cached.section_id, confidence: Number(cached.confidence ?? 0), rationale: cached.rationale ?? "已缓存的重排结果", candidates: [section] };
    }
  }

  // 3. FTS recall — candidates only.
  const terms = buildSearchTerms(input);
  const candidates = await ftsCandidates(database, terms, CANDIDATE_LIMIT);
  if (!candidates.length) {
    return { status: "UNRESOLVED", method: "none", candidates: [], section: null, section_id: null, confidence: 0, rationale: "FTS 未召回任何候选" };
  }
  const topScores = candidates.slice(0, 3).map((candidate) => candidate.score);
  const margin = topScores.length > 1 ? topScores[0] - topScores[1] : null;

  // 4. semantic rerank, always.
  const question = `${input.stem}\n${input.options.join("\n")}\n${input.explanation ?? ""}`;
  const ranked = await rerank(question, candidates);
  if (!ranked) {
    return { status: "UNRESOLVED", method: "fts+ai", candidates: candidates.slice(0, 3), section: null, section_id: null, confidence: 0, rationale: "语义重排不可用（模型超时/错误/无法解析），已按弃权处理", fts_top1_score: topScores[0] ?? null, fts_margin: margin };
  }
  const chosen = ranked.index !== null ? candidates[ranked.index] : null;
  const status = statusFor(ranked.confidence, Boolean(chosen));
  const confidence = ranked.confidence === "HIGH" ? 0.9 : ranked.confidence === "MEDIUM" ? 0.6 : 0.2;
  const rationale = `${ranked.topic ? ranked.topic + " — " : ""}${ranked.reason}`.slice(0, 300);

  await writeLink(database, input.questionId, chosen?.section_id ?? null, status, confidence, rationale, topScores);

  if (status === "UNRESOLVED" || !chosen) {
    return { status: "UNRESOLVED", method: "fts+ai", candidates: candidates.slice(0, 3), section: null, section_id: null, confidence, rationale, fts_top1_score: topScores[0] ?? null, fts_margin: margin };
  }
  return { status, method: "fts+ai", section: chosen, section_id: chosen.section_id, confidence, rationale, candidates: candidates.slice(0, 3), fts_top1_score: topScores[0] ?? null, fts_margin: margin };
}
