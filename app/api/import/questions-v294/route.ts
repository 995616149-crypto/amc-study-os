import { z } from "zod";
import { env } from "cloudflare:workers";
import { db, currentUser} from "../../_shared";

const RecordSchema = z.object({
  raw: z.record(z.string(), z.unknown()),
  assetUrl: z.string().url().nullable(),
  assetPreviewUrl: z.string().url().nullable(),
});

const Payload = z.object({
  importVersion: z.literal("v2.9.4"),
  records: z.array(RecordSchema).min(1).max(100),
});

const letters = ["A", "B", "C", "D", "E"] as const;
const validAnswer = (value: unknown): value is typeof letters[number] =>
  typeof value === "string" && letters.includes(value as typeof letters[number]);

async function importAuthorized(request: Request) {
  const importKey = (env as unknown as { AMC_IMPORT_KEY?: string }).AMC_IMPORT_KEY;
  return !!(await currentUser(request)) || (!!importKey && request.headers.get("x-amc-import-key") === importKey);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sourceId(sourceFile: string) {
  let hash = 2166136261;
  for (const character of sourceFile) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `src-v294-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function POST(request: Request) {
  if (!(await importAuthorized(request))) return Response.json({ error: "Sign in required" }, { status: 401 });
  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "v2.9.4 import validation failed", details: parsed.error.flatten() }, { status: 400 });

  const database = db();
  const statements: ReturnType<typeof database.prepare>[] = [];
  let active = 0;
  let visual = 0;
  const importedAt = new Date().toISOString();

  for (const envelope of parsed.data.records) {
    const q = envelope.raw as Record<string, unknown>;
    const recordId = text(q.record_id);
    const sourceFile = text(q.source_file, "Unknown source");
    const stem = text(q.stem, "Source-page question");
    const domain = text(q.domain_hint, "Mixed/Unclassified");
    const answer = validAnswer(q.source_answer) ? q.source_answer : null;
    const rawOptions = q.options && typeof q.options === "object" && !Array.isArray(q.options)
      ? q.options as Record<string, unknown> : {};
    const hasFiveOptions = letters.every((letter) => text(rawOptions[letter]).length > 0) && Object.keys(rawOptions).length === 5;
    const imageMode = q.options_mode === "source_page_image";
    const answerableImageMode = imageMode && !!answer && !!envelope.assetUrl && Object.keys(rawOptions).length === 0;
    const activeQuiz = (!!answer && hasFiveOptions) || answerableImageMode;
    const options = hasFiveOptions
      ? letters.map((key) => ({ key, value: text(rawOptions[key]) }))
      : answerableImageMode
        ? letters.map((key) => ({ key, value: `Option ${key} — see the source-page image` }))
        : [];
    const provenance = {
      source_relative_path: q.source_relative_path ?? null,
      supporting_pages: q.supporting_pages ?? [],
      source_qid: q.source_qid ?? null,
      duplicate_group_id: q.duplicate_group_id ?? null,
      duplicate_sources: q.duplicate_sources ?? [],
      parser_version: q.parser_version ?? null,
      parser_mode: q.parser_mode ?? null,
      text_method: q.text_method ?? null,
      visual_asset: q.visual_asset ?? null,
      asset_preview_url: envelope.assetPreviewUrl,
    };
    const currentEvidence = Array.isArray(q.current_evidence) ? q.current_evidence : [];
    const sourceExplanation = text(q.source_explanation, "No source-era explanation was supplied in the canonical record.");
    const memoryRule = "Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.";
    const sid = sourceId(sourceFile);

    statements.push(database.prepare(`INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json)
      VALUES (?,?,?,?,?,'private-study','v2.9.4-imported','needs-verification',?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json`)
      .bind(sid, sourceFile, "AMC question-bank source", typeof q.source_year === "number" ? q.source_year : null, text(q.source_relative_path, sourceFile), JSON.stringify({ import_version: "v2.9.4" })));

    statements.push(database.prepare(`INSERT INTO canonical_records
      (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at`)
      .bind(recordId, sourceFile, typeof q.source_page === "number" ? q.source_page : null, domain, stem, Object.keys(rawOptions).length ? JSON.stringify(rawOptions) : null, answer, q.source_explanation == null ? null : text(q.source_explanation), JSON.stringify(provenance), text(q.visual_asset) || null, envelope.assetUrl, text(q.options_mode) || null, validAnswer(q.current_answer) ? q.current_answer : null, text(q.current_answer_status, "needs_verification"), JSON.stringify(currentEvidence), text(q.currentness_risk, "unknown"), JSON.stringify(q), activeQuiz ? 1 : 0, "v2.9.4", importedAt));

    if (!activeQuiz) {
      statements.push(database.prepare(`UPDATE questions SET active=0,import_version='v2.9.4' WHERE id=?`).bind(recordId));
      continue;
    }

    active += 1;
    if (envelope.assetUrl) visual += 1;
    statements.push(database.prepare(`INSERT INTO questions
      (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk`)
      .bind(recordId, sid, text(q.source_qid) || null, typeof q.source_page === "number" ? q.source_page : null, domain, domain, domain, "AMC MCQ", stem, null, answer, sourceExplanation, null, memoryRule, null, envelope.assetUrl, typeof q.source_year === "number" ? q.source_year : null, "v2.9.4", 1, text(q.options_mode) || (hasFiveOptions ? "text" : null), JSON.stringify(provenance), validAnswer(q.current_answer) ? q.current_answer : null, text(q.current_answer_status, "needs_verification"), JSON.stringify(currentEvidence), text(q.currentness_risk, "unknown")));
    statements.push(database.prepare(`DELETE FROM question_options WHERE question_id=?`).bind(recordId));
    options.forEach((option, index) => statements.push(database.prepare(`INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES (?,?,?,?,?,?)`)
      .bind(`${recordId}-${option.key}`, recordId, option.key, option.value, null, index + 1)));
  }

  try {
    await database.batch(statements);
    return Response.json({ ok: true, imported: parsed.data.records.length, active, visual });
  } catch (error) {
    console.error("v294_import_failed", error);
    return Response.json({ error: "v2.9.4 import failed; this chunk was not committed." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await importAuthorized(request))) return Response.json({ error: "Sign in required" }, { status: 401 });
  const database = db();
  await database.prepare(`UPDATE questions SET active=0 WHERE import_version='pilot-v1'`).run();
  const [canonical, active, visual, verification, imageMode, legacy] = await Promise.all([
    database.prepare(`SELECT count(*) AS count FROM canonical_records WHERE import_version='v2.9.4'`).first<{count:number}>(),
    database.prepare(`SELECT count(*) AS count FROM canonical_records WHERE import_version='v2.9.4' AND active_quiz=1`).first<{count:number}>(),
    database.prepare(`SELECT count(*) AS count FROM canonical_records WHERE import_version='v2.9.4' AND visual_asset IS NOT NULL`).first<{count:number}>(),
    database.prepare(`SELECT count(*) AS count FROM canonical_records WHERE import_version='v2.9.4' AND current_answer_status='needs_verification'`).first<{count:number}>(),
    database.prepare(`SELECT count(*) AS count FROM canonical_records WHERE import_version='v2.9.4' AND options_mode='source_page_image'`).first<{count:number}>(),
    database.prepare(`SELECT count(*) AS count FROM canonical_records WHERE import_version='v2.9.4' AND active_quiz=0`).first<{count:number}>(),
  ]);
  const stats = { canonical: canonical?.count ?? 0, active: active?.count ?? 0, visual: visual?.count ?? 0, needsVerification: verification?.count ?? 0, imageMode: imageMode?.count ?? 0, excluded: legacy?.count ?? 0 };
  const ok = stats.canonical === 3621 && stats.active === 1322 && stats.visual === 239 && stats.needsVerification === 3621 && stats.imageMode === 155;
  return Response.json({ ok, stats, noLossGatePassed: stats.canonical === 3621 }, { status: ok ? 200 : 409 });
}
