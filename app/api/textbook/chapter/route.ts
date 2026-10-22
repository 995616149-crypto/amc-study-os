import { bad, database, decodeParam, json, requireUser } from "../_d1";

export const dynamic = "force-dynamic";

/**
 * A chapter, read as a continuous run of sections.
 *
 * §26 asks for a chapter reader, and §56 warns that a chapter can be large, so the
 * sections are returned in a window (`from` / `limit`) rather than all at once, and
 * the client walks the windows.  Each returned unit still carries its FULL block
 * list — the window bounds how many sections travel together, never how much of a
 * section is shown.
 */
const MAX_SECTIONS = 12;

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const chapterId = decodeParam(url.searchParams.get("id"));
  if (!chapterId) return bad("id required");
  const from = Math.max(0, Number(url.searchParams.get("from") ?? 0) || 0);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") ?? 3) || 3, MAX_SECTIONS));

  try {
    const db = database();
    const chapter = await db
      .prepare(`SELECT chapter_id,part_id,chapter_order,chapter_number,chapter_title,start_page,end_page,printed_page_start,is_matter FROM textbook_chapter WHERE chapter_id=?`)
      .bind(chapterId)
      .first<any>();
    if (!chapter) return bad("unknown chapter", 404);

    const total = await db.prepare(`SELECT COUNT(*) AS n FROM textbook_section WHERE chapter_id=?`).bind(chapterId).first<any>();
    const sectionCount = total?.n ?? 0;

    const rows = await db
      .prepare(`SELECT section_uid,section_id,section_order,section_title,heading_level,start_page,end_page,printed_page_start,block_count,visible_block_count
                FROM textbook_section WHERE chapter_id=? ORDER BY section_order, section_uid LIMIT ? OFFSET ?`)
      .bind(chapterId, limit, from)
      .all<any>();

    const sections = [];
    for (const row of rows.results ?? []) {
      const blocks = await db
        .prepare(`SELECT block_id,block_order,block_type,text,heading_level,page,printed_page,
                         figure_id,figure_caption,table_id,table_html,table_text,table_caption,manual_review_status
                    FROM textbook_block WHERE section_uid=? ORDER BY block_order, block_id`)
        .bind(row.section_uid)
        .all<any>();
      sections.push({
        section_uid: row.section_uid,
        section_id: row.section_id,
        section_order: row.section_order,
        section_title: row.section_title,
        heading_level: row.heading_level ?? null,
        start_page: row.start_page ?? null,
        end_page: row.end_page ?? null,
        printed_page_start: row.printed_page_start ?? null,
        block_count: row.block_count ?? 0,
        source_blocks: row.block_count ?? 0,
        blocks: (blocks.results ?? []).map((block: any) => ({
          block_id: block.block_id,
          block_order: block.block_order,
          block_type: block.block_type,
          text: block.text ?? "",
          heading_level: block.heading_level ?? null,
          page: block.page ?? null,
          printed_page: block.printed_page ?? null,
          figure_id: block.figure_id ?? null,
          figure_caption: block.figure_caption ?? null,
          figure_image_available: false,
          table_id: block.table_id ?? null,
          table_html: block.manual_review_status ? null : block.table_html ?? null,
          table_text: block.table_text ?? null,
          table_caption: block.table_caption ?? null,
          manual_review_status: block.manual_review_status ?? null,
        })),
      });
    }

    // Tables the assembler left at chapter level (between sections) belong to the
    // chapter, not to a section, so they are read here in the front window.
    let chapterLevel: any[] = [];
    if (from === 0) {
      const extra = await db
        .prepare(`SELECT block_id,block_order,block_type,text,heading_level,page,printed_page,table_id,table_html,table_text,table_caption,manual_review_status
                    FROM textbook_block WHERE section_uid=? ORDER BY block_order, block_id`)
        .bind(`chapter:${chapterId}`)
        .all<any>();
      chapterLevel = (extra.results ?? []).map((block: any) => ({
        block_id: block.block_id,
        block_order: block.block_order,
        block_type: block.block_type,
        text: block.text ?? "",
        heading_level: block.heading_level ?? null,
        page: block.page ?? null,
        printed_page: block.printed_page ?? null,
        table_id: block.table_id ?? null,
        table_html: block.manual_review_status ? null : block.table_html ?? null,
        table_text: block.table_text ?? null,
        table_caption: block.table_caption ?? null,
        manual_review_status: block.manual_review_status ?? null,
      }));
    }

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
      window: { from, limit, section_count: sectionCount, returned: sections.length },
      sections,
      chapter_level_blocks: chapterLevel,
    });
  } catch (error) {
    console.error("textbook_chapter_failed", error);
    return bad("教材章节暂时不可用。", 503);
  }
}
