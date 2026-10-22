import { db, currentUser } from "../../_shared";
import { locateTextbookSection } from "@/lib/textbook-retrieval";

export const dynamic = "force-dynamic";

/**
 * Locate the practice question in Murtagh's General Practice 9e.
 *
 * GET /api/textbook/locate?questionId=...
 *
 * Runs entirely against the deployed database (section index + FTS5), so it needs no
 * local files, and it caches the result per question instead of precomputing the
 * whole question bank.
 */
export async function GET(request: Request) {
  if (!(await currentUser(request))) return Response.json({ error: "Sign in required" }, { status: 401 });
  const url = new URL(request.url);
  const questionId = url.searchParams.get("questionId");
  if (!questionId) return Response.json({ error: "Missing questionId" }, { status: 400 });

  try {
    const database = db();
    const question = await database.prepare(`SELECT id,stem_en,source_explanation_en FROM questions WHERE id=? AND active=1`)
      .bind(questionId).first<{ id: string; stem_en: string; source_explanation_en: string | null }>();
    if (!question) return Response.json({ error: "Question not found" }, { status: 404 });
    const options = await database.prepare(`SELECT text_en FROM question_options WHERE question_id=? ORDER BY option_key`)
      .bind(questionId).all<{ text_en: string }>();

    const location = await locateTextbookSection(database, {
      questionId,
      stem: String(question.stem_en ?? ""),
      options: (options.results ?? []).map((row: { text_en: string }) => String(row.text_en ?? "")),
      explanation: question.source_explanation_en,
    });

    // The retrieval layer works in `section_id` (that is what the locator index
    // stores).  The reader opens `section_uid`, and the two differ only for nine
    // back-matter records, so resolve the uid here and let the client deep-link and
    // fetch the full section without a second lookup.
    const sectionId = (location as { section?: { section_id?: string } | null }).section?.section_id;
    let sectionUid: string | null = null;
    if (sectionId) {
      const row = await database
        .prepare(`SELECT section_uid FROM textbook_section WHERE section_id=? ORDER BY section_uid LIMIT 1`)
        .bind(sectionId)
        .first<{ section_uid: string }>();
      sectionUid = row?.section_uid ?? sectionId;
    }

    return Response.json({
      questionId,
      retrievalVersion: "murtagh-9e-fts-v1",
      ...location,
      section_uid: sectionUid,
      label: "Murtagh 9e",
    });
  } catch (error) {
    console.error("textbook_locate_failed", error);
    return Response.json({ error: "教材定位暂时不可用。" }, { status: 503 });
  }
}
