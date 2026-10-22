import { bad, database, json, requireUser } from "../_d1";

export const dynamic = "force-dynamic";

/**
 * The real book structure, straight from the imported assembler output.
 *
 *   book > parts > chapters  (front/back matter is returned separately)
 *
 * Sections are NOT inlined: a chapter's section list is a light second call to
 * /api/textbook/sections, so the first paint of the textbook page never waits on
 * 8 420 rows.  The order is the assembler's own order (`part_order`,
 * `chapter_order`); nothing here invents or re-derives a hierarchy.
 */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  try {
    const db = database();
    const [bookRow, partRows, chapterRows, counts] = await Promise.all([
      db.prepare(`SELECT book_id,title,edition,language,part_count,chapter_count,section_count,block_count,figure_count,table_count,generated_at FROM textbook_book LIMIT 1`).first<any>(),
      db.prepare(`SELECT part_id,part_order,part_title,printed_page_start,pdf_page_start FROM textbook_part ORDER BY part_order`).all<any>(),
      db.prepare(`SELECT chapter_id,part_id,chapter_order,chapter_number,chapter_title,start_page,end_page,printed_page_start,section_count,block_count,is_matter FROM textbook_chapter ORDER BY chapter_order`).all<any>(),
      db.prepare(`SELECT (SELECT COUNT(*) FROM textbook_section) AS sections, (SELECT COUNT(*) FROM textbook_block) AS blocks, (SELECT COUNT(*) FROM textbook_section_index) AS searchable_sections`).first<any>(),
    ]);

    if (!bookRow) return bad("textbook not imported", 503);

    const chapters = chapterRows.results ?? [];
    const shapeChapter = (row: any) => ({
      chapter_id: row.chapter_id,
      chapter_order: row.chapter_order,
      chapter_number: row.chapter_number ?? null,
      chapter_title: row.chapter_title,
      start_page: row.start_page ?? null,
      end_page: row.end_page ?? null,
      printed_page_start: row.printed_page_start ?? null,
      section_count: row.section_count ?? 0,
      block_count: row.block_count ?? 0,
      is_matter: !!row.is_matter,
    });

    const byPart = new Map<string, any[]>();
    for (const chapter of chapters) {
      const key = chapter.part_id ?? "__matter__";
      const list = byPart.get(key);
      if (list) list.push(shapeChapter(chapter));
      else byPart.set(key, [shapeChapter(chapter)]);
    }

    const parts = (partRows.results ?? []).map((part: any) => ({
      part_id: part.part_id,
      part_order: part.part_order,
      part_title: part.part_title,
      printed_page_start: part.printed_page_start ?? null,
      pdf_page_start: part.pdf_page_start ?? null,
      chapters: byPart.get(part.part_id) ?? [],
    }));
    // Front matter and the Appendices/Index have no part of their own; they are
    // still readable units, so they are returned rather than dropped.
    const matter = [...byPart.keys()]
      .filter((key) => key === "__matter__" || !parts.some((part) => part.part_id === key))
      .flatMap((key) => byPart.get(key) ?? []);

    return json({
      book: {
        book_id: bookRow.book_id,
        title: bookRow.title,
        edition: bookRow.edition,
        language: bookRow.language,
        generated_at: bookRow.generated_at,
      },
      counts: {
        parts: parts.length,
        chapters: chapters.length,
        sections: counts?.sections ?? 0,
        blocks: counts?.blocks ?? 0,
        searchable_sections: counts?.searchable_sections ?? 0,
      },
      parts,
      matter: matter.sort((left, right) => left.chapter_order - right.chapter_order),
    });
  } catch (error) {
    console.error("textbook_toc_failed", error);
    return bad("教材目录暂时不可用。", 503);
  }
}
