import { db, currentUser } from "../_shared";

/**
 * The full body of ONE question, plus its options.
 *
 * This is the other half of the index bootstrap: the list payload carries only
 * identity and small filter fields, so the stem, the options and the source-era text
 * are fetched per question and cached in the browser.  Opening a question therefore
 * costs a few KB instead of shipping 6 208 stems and 31 040 options on every load.
 *
 * `content_hash` lets the browser cache a body without ever serving a stale one: the
 * cache key is `id + content_hash`, so a question whose text changes is a new entry.
 */
export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing question id" }, { status: 400 });
  try {
    const database = db();
    const row = await database
      .prepare(
        `SELECT id,stem_en,stem_zh,answer_key,image_ref,source_explanation_en,memory_rule_en,
                current_answer,current_answer_status,current_evidence_json
           FROM questions WHERE id=? AND active=1`,
      )
      .bind(id)
      .first<any>();
    if (!row) return Response.json({ error: "Question not found" }, { status: 404 });

    const options = await database
      .prepare(`SELECT id,question_id,option_key,text_en,text_zh FROM question_options WHERE question_id=? ORDER BY sort_order`)
      .bind(id)
      .all<any>();

    const body = {
      id: row.id,
      stem_en: row.stem_en ?? "",
      stem_zh: row.stem_zh ?? null,
      answer_key: row.answer_key ?? null,
      image_ref: row.image_ref ?? null,
      source_explanation_en: row.source_explanation_en ?? "",
      memory_rule_en: row.memory_rule_en ?? null,
      current_answer: row.current_answer ?? null,
      current_answer_status: row.current_answer_status ?? null,
      current_evidence_json: row.current_evidence_json ?? null,
      options: (options.results ?? []).map((option: any) => ({
        id: option.id,
        question_id: option.question_id,
        option_key: option.option_key,
        text_en: option.text_en,
        ...(option.text_zh ? { text_zh: option.text_zh } : {}),
      })),
    };

    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${body.stem_en}|${body.answer_key}|${body.source_explanation_en}|${body.memory_rule_en ?? ""}|${body.options.length}`),
    );
    const contentHash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("").slice(0, 16);

    return Response.json({ question: body, content_hash: contentHash });
  } catch (error) {
    console.error("question_detail_failed", error);
    return Response.json({ error: "题目信息暂时不可用。" }, { status: 503 });
  }
}
