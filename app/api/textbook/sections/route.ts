import { bad, database, decodeParam, json, requireUser } from "../_d1";

export const dynamic = "force-dynamic";

/**
 * The section list of one chapter (the contents panel's third level).
 *
 * `chapter` accepts anything the importer kept as a chapter id, including the
 * front-matter and back-matter ids.  A unit with no sub-sections answers with an
 * empty list rather than a 404, because "this unit has no sections" is a real
 * state of the source structure, not an error.
 */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const chapterId = decodeParam(new URL(request.url).searchParams.get("chapter"));
  if (!chapterId) return bad("chapter required");

  try {
    const db = database();
    const chapter = await db
      .prepare(`SELECT chapter_id,part_id,chapter_order,chapter_number,chapter_title,start_page,end_page,printed_page_start,section_count,block_count,is_matter FROM textbook_chapter WHERE chapter_id=?`)
      .bind(chapterId)
      .first<any>();
    if (!chapter) return bad("unknown chapter", 404);

    const rows = await db
      .prepare(`SELECT section_uid,section_id,section_order,section_title,heading_level,start_page,end_page,printed_page_start,block_count,visible_block_count
                FROM textbook_section WHERE chapter_id=? ORDER BY section_order, section_uid`)
      .bind(chapterId)
      .all<any>();

    const extra = await db
      .prepare(`SELECT COUNT(*) AS n FROM textbook_block WHERE section_uid=?`)
      .bind(`chapter:${chapterId}`)
      .first<any>();

    return json({
      chapter: {
        chapter_id: chapter.chapter_id,
        part_id: chapter.part_id ?? null,
        chapter_order: chapter.chapter_order,
        chapter_number: chapter.chapter_number ?? null,
        chapter_title: chapter.chapter_title,
        start_page: chapter.start_page ?? null,
        end_page: chapter.end_page ?? null,
        printed_page_start: chapter.printed_page_start ?? null,
        is_matter: !!chapter.is_matter,
      },
      count: (rows.results ?? []).length,
      sections: (rows.results ?? []).map((row: any) => ({
        section_uid: row.section_uid,
        section_id: row.section_id,
        section_order: row.section_order,
        section_title: row.section_title,
        heading_level: row.heading_level ?? null,
        start_page: row.start_page ?? null,
        end_page: row.end_page ?? null,
        printed_page_start: row.printed_page_start ?? null,
        block_count: row.block_count ?? 0,
        visible_block_count: row.visible_block_count ?? 0,
      })),
      /** Tables the assembler emitted between sections, without a section of their own. */
      chapter_level_blocks: extra?.n ?? 0,
    });
  } catch (error) {
    console.error("textbook_sections_failed", error);
    return bad("教材章节暂时不可用。", 503);
  }
}
