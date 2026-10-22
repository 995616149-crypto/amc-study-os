import { bad, database, decodeParam, json, requireUser } from "../_d1";

export const dynamic = "force-dynamic";

/**
 * Full-text search over the assembler's validated FTS5 index
 * (`textbook_section_fts`, built by tools/release/build_textbook_fts.mjs and
 * deployed by migration 0061).
 *
 * The index is a LOCATOR: it caps stored text at 6 000 characters and only holds
 * the 7 844 sections whose aggregated text passed its 40-character floor, so a hit
 * is a pointer, never the reading material.  Every hit therefore carries the
 * `section_uid` the reader must open to show the section's FULL text.
 */
const CONFIDENT_LIMIT = 60;

function toMatch(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "";
  // A multi-word query is a phrase, so "atrial fibrillation" cannot match the two
  // words scattered across a page; a single word stays bare so porter stemming applies.
  if (/\s/.test(trimmed) && !trimmed.startsWith('"')) return `"${trimmed.replace(/"/g, "")}"`;
  return trimmed.replace(/[^\w"*:^()\- ]/g, " ").trim();
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const query = decodeParam(url.searchParams.get("q")).trim();
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") ?? 25) || 25, CONFIDENT_LIMIT));
  if (!query) return json({ query, count: 0, hits: [] });

  const match = toMatch(query);
  if (!match) return json({ query, count: 0, hits: [] });

  try {
    const db = database();
    let rows: any[] = [];
    try {
      const result = await db
        .prepare(`SELECT s.section_id, s.chapter_id, s.chapter_title, s.section_title,
                         s.page_start, s.page_end, s.printed_page_start,
                         snippet(textbook_section_fts, 2, '', '', ' … ', 14) AS snippet,
                         bm25(textbook_section_fts) AS rank
                    FROM textbook_section_fts
                    JOIN textbook_section_index s ON s.rowid = textbook_section_fts.rowid
                   WHERE textbook_section_fts MATCH ?
                   ORDER BY bm25(textbook_section_fts)
                   LIMIT ?`)
        .bind(match, limit)
        .all<any>();
      rows = result.results ?? [];
    } catch {
      // An FTS syntax error from a stray character must read as "no hits", not a 500.
      rows = [];
    }

    const hits = [];
    for (const row of rows) {
      // The locator index carries `section_id`; the reader opens `section_uid`.
      const uid = await db
        .prepare(`SELECT section_uid FROM textbook_section WHERE section_id=? ORDER BY section_uid LIMIT 1`)
        .bind(String(row.section_id))
        .first<any>();
      hits.push({
        section_id: String(row.section_id),
        section_uid: uid?.section_uid ?? String(row.section_id),
        chapter_id: row.chapter_id ?? null,
        chapter_title: row.chapter_title ?? null,
        section_title: row.section_title ?? null,
        page_start: row.page_start ?? null,
        page_end: row.page_end ?? null,
        printed_page_start: row.printed_page_start ?? null,
        snippet: String(row.snippet ?? "").replace(/\s+/g, " ").trim().slice(0, 300),
        score: Math.max(0, -Number(row.rank ?? 0)),
      });
    }

    return json({ query, count: hits.length, hits });
  } catch (error) {
    console.error("textbook_search_failed", error);
    return bad("教材检索暂时不可用。", 503);
  }
}
