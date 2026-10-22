import { bad, database, decodeParam, json, requireUser } from "../_d1";

export const dynamic = "force-dynamic";

/**
 * One complete textbook section: identity, page range, and EVERY block from the
 * first to the last.
 *
 * This is the route that answers the product question "show the real textbook, not
 * a snippet".  It returns the whole section — never a first-N-characters excerpt,
 * never a summary — plus the previous/next section for continuous reading, and it
 * reports how many blocks it returned next to how many the section has, so a
 * truncated response is detectable rather than silent.
 *
 * `id` is a `section_uid` (see 0062_textbook_reader.sql).  A plain `section_id` is
 * accepted too and resolves to its first uid, which is what the question page has
 * from the retrieval layer.
 */
const BLOCK_CAP = 4_000; // a section this large does not exist in this book; the cap only guards a corrupt row

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const id = decodeParam(new URL(request.url).searchParams.get("id"));
  if (!id) return bad("id required");

  try {
    const db = database();
    let section = await db
      .prepare(`SELECT section_uid,section_id,book_id,part_id,chapter_id,section_order,section_title,heading_level,start_page,end_page,printed_page_start,block_count,visible_block_count,text_chars
                FROM textbook_section WHERE section_uid=?`)
      .bind(id)
      .first<any>();
    if (!section) {
      section = await db
        .prepare(`SELECT section_uid,section_id,book_id,part_id,chapter_id,section_order,section_title,heading_level,start_page,end_page,printed_page_start,block_count,visible_block_count,text_chars
                  FROM textbook_section WHERE section_id=? ORDER BY section_uid LIMIT 1`)
        .bind(id)
        .first<any>();
    }
    if (!section) return bad("unknown section", 404);

    const [blockRows, chapterRow, partRow, bookRow] = await Promise.all([
      db.prepare(`SELECT block_id,block_order,block_type,text,heading_level,page,printed_page,
                         figure_id,figure_caption,figure_asset,
                         table_id,table_html,table_text,table_caption,manual_review_status
                    FROM textbook_block WHERE section_uid=? ORDER BY block_order, block_id LIMIT ?`)
        .bind(section.section_uid, BLOCK_CAP)
        .all<any>(),
      db.prepare(`SELECT chapter_id,part_id,chapter_order,chapter_number,chapter_title,start_page,end_page,printed_page_start,is_matter FROM textbook_chapter WHERE chapter_id=?`)
        .bind(section.chapter_id)
        .first<any>(),
      section.part_id
        ? db.prepare(`SELECT part_id,part_order,part_title FROM textbook_part WHERE part_id=?`).bind(section.part_id).first<any>()
        : Promise.resolve(null),
      db.prepare(`SELECT book_id,title,edition,language FROM textbook_book LIMIT 1`).first<any>(),
    ]);

    const order = chapterRow?.chapter_order ?? 0;
    const neighbours = await Promise.all([
      db.prepare(`SELECT s.section_uid,s.section_title,c.chapter_title,c.chapter_id
                    FROM textbook_section s JOIN textbook_chapter c ON c.chapter_id=s.chapter_id
                   WHERE c.chapter_order < ? OR (c.chapter_order = ? AND s.section_order < ?)
                   ORDER BY c.chapter_order DESC, s.section_order DESC, s.section_uid DESC LIMIT 1`)
        .bind(order, order, section.section_order).first<any>(),
      db.prepare(`SELECT s.section_uid,s.section_title,c.chapter_title,c.chapter_id
                    FROM textbook_section s JOIN textbook_chapter c ON c.chapter_id=s.chapter_id
                   WHERE c.chapter_order > ? OR (c.chapter_order = ? AND s.section_order > ?)
                   ORDER BY c.chapter_order ASC, s.section_order ASC, s.section_uid ASC LIMIT 1`)
        .bind(order, order, section.section_order).first<any>(),
    ]);

    const shapeNeighbour = (row: any) => (row ? { section_uid: row.section_uid, section_title: row.section_title, chapter_id: row.chapter_id, chapter_title: row.chapter_title } : null);

    const blocks = (blockRows.results ?? []).map((row: any) => ({
      block_id: row.block_id,
      block_order: row.block_order,
      block_type: row.block_type,
      text: row.text ?? "",
      heading_level: row.heading_level ?? null,
      page: row.page ?? null,
      printed_page: row.printed_page ?? null,
      figure_id: row.figure_id ?? null,
      figure_caption: row.figure_caption ?? null,
      // The figure rasters (885 MiB) are not part of the deployment; the caption and
      // the original page citation are, and the UI says so instead of faking an image.
      figure_image_available: false,
      table_id: row.table_id ?? null,
      table_html: row.manual_review_status ? null : row.table_html ?? null,
      table_text: row.table_text ?? null,
      table_caption: row.table_caption ?? null,
      manual_review_status: row.manual_review_status ?? null,
    }));

    return json({
      book: bookRow ?? null,
      part: partRow ?? null,
      chapter: chapterRow
        ? {
            chapter_id: chapterRow.chapter_id,
            chapter_order: chapterRow.chapter_order,
            chapter_number: chapterRow.chapter_number ?? null,
            chapter_title: chapterRow.chapter_title,
            start_page: chapterRow.start_page ?? null,
            end_page: chapterRow.end_page ?? null,
            printed_page_start: chapterRow.printed_page_start ?? null,
            is_matter: !!chapterRow.is_matter,
          }
        : null,
      section: {
        section_uid: section.section_uid,
        section_id: section.section_id,
        section_order: section.section_order,
        section_title: section.section_title,
        heading_level: section.heading_level ?? null,
        start_page: section.start_page ?? null,
        end_page: section.end_page ?? null,
        printed_page_start: section.printed_page_start ?? null,
        block_count: section.block_count ?? 0,
        visible_block_count: section.visible_block_count ?? 0,
        text_chars: section.text_chars ?? 0,
      },
      blocks,
      navigation: { previous: shapeNeighbour(neighbours[0]), next: shapeNeighbour(neighbours[1]) },
      counts: { source_blocks: section.block_count ?? 0, returned_blocks: blocks.length },
    });
  } catch (error) {
    console.error("textbook_section_failed", error);
    return bad("教材正文暂时不可用。", 503);
  }
}
