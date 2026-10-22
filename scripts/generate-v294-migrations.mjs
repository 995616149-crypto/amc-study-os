import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const packageRoot = process.argv[2];
const siteRoot = process.argv[3];
if (!packageRoot || !siteRoot) throw new Error("Usage: generate-v294-migrations.mjs <package-root> <site-root>");

const [jsonl, assetText, journalText] = await Promise.all([
  readFile(path.join(packageRoot, "canonical_questions_v2_9_4_candidate.jsonl"), "utf8"),
  readFile(path.join(packageRoot, "asset_reference_manifest_v2_9_4_candidate.json"), "utf8"),
  readFile(path.join(siteRoot, "drizzle/meta/_journal.json"), "utf8"),
]);
const records = jsonl.trim().split(/\n/).map((line) => JSON.parse(line));
const assets = JSON.parse(assetText).assets;
const sql = (value) => value === null || value === undefined ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => sql(JSON.stringify(value));
const letters = ["A", "B", "C", "D", "E"];

function sourceId(sourceFile) {
  let hash = 2166136261;
  for (const character of sourceFile) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `src-v294-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

const existing = await readdir(path.join(siteRoot, "drizzle"));
for (const name of existing.filter((name) => /^00(?:0[3-9]|[1-9]\d)_amc_v294_data_/.test(name) || name === "0040_amc_v294_finalize.sql")) {
  await rm(path.join(siteRoot, "drizzle", name));
}

const journal = JSON.parse(journalText);
journal.entries = journal.entries.filter((entry) => entry.idx <= 2);
const chunkSize = 100;
let active = 0;
let activeVisual = 0;

for (let offset = 0; offset < records.length; offset += chunkSize) {
  const migrationIndex = 3 + offset / chunkSize;
  const tag = `${String(migrationIndex).padStart(4, "0")}_amc_v294_data_${String(offset / chunkSize + 1).padStart(4, "0")}`;
  const statements = [];
  for (const q of records.slice(offset, offset + chunkSize)) {
    const sourceFile = q.source_file || "Unknown source";
    const sid = sourceId(sourceFile);
    const domain = q.domain_hint ?? "Mixed/Unclassified";
    const nodeId = `node-v294-${sourceId(domain).slice(-8)}`;
    const asset = q.visual_asset ? assets[q.visual_asset] : null;
    const driveId = asset?.drive_file_id ?? null;
    const assetUrl = driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600` : null;
    const assetPreviewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null;
    const options = q.options && typeof q.options === "object" && !Array.isArray(q.options) ? q.options : {};
    const hasFiveOptions = letters.every((letter) => typeof options[letter] === "string" && options[letter].trim()) && Object.keys(options).length === 5;
    const hasAnswer = /^[A-E]$/.test(q.source_answer ?? "");
    const answerableImageMode = q.options_mode === "source_page_image" && hasAnswer && assetUrl && Object.keys(options).length === 0;
    const activeQuiz = hasAnswer && (hasFiveOptions || answerableImageMode);
    const normalizedOptions = hasFiveOptions
      ? letters.map((key) => [key, options[key].trim()])
      : answerableImageMode
        ? letters.map((key) => [key, `Option ${key} — see the source-page image`])
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
      asset_preview_url: assetPreviewUrl,
    };
    statements.push(`INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES (${sql(sid)},${sql(sourceFile)},'AMC question-bank source',${sql(q.source_year)},${sql(q.source_relative_path ?? sourceFile)},'private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json`);
    statements.push(`INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES (${sql(q.record_id)},${sql(sourceFile)},${sql(q.source_page)},${sql(domain)},${sql(q.stem ?? "Source-page question")},${Object.keys(options).length ? json(options) : "NULL"},${hasAnswer ? sql(q.source_answer) : "NULL"},${sql(q.source_explanation)},${json(provenance)},${sql(q.visual_asset)},${sql(assetUrl)},${sql(q.options_mode)},${/^[A-E]$/.test(q.current_answer ?? "") ? sql(q.current_answer) : "NULL"},${sql(q.current_answer_status ?? "needs_verification")},${json(Array.isArray(q.current_evidence) ? q.current_evidence : [])},${sql(q.currentness_risk ?? "unknown")},${json(q)},${activeQuiz ? 1 : 0},'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at`);
    if (!activeQuiz) {
      statements.push(`UPDATE questions SET active=0,import_version='v2.9.4' WHERE id=${sql(q.record_id)}`);
      continue;
    }
    active += 1;
    if (assetUrl) activeVisual += 1;
    const explanation = q.source_explanation?.trim() || "No source-era explanation was supplied in the canonical record.";
    const memoryRule = "Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.";
    statements.push(`INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES (${sql(q.record_id)},${sql(sid)},${sql(q.source_qid)},${sql(q.source_page)},${sql(domain)},${sql(domain)},${sql(domain)},'AMC MCQ',${sql(q.stem ?? "Source-page question")},NULL,${sql(q.source_answer)},${sql(explanation)},NULL,${sql(memoryRule)},NULL,${sql(assetUrl)},${sql(q.source_year)},'v2.9.4',1,${sql(q.options_mode ?? (hasFiveOptions ? "text" : null))},${json(provenance)},${/^[A-E]$/.test(q.current_answer ?? "") ? sql(q.current_answer) : "NULL"},${sql(q.current_answer_status ?? "needs_verification")},${json(Array.isArray(q.current_evidence) ? q.current_evidence : [])},${sql(q.currentness_risk ?? "unknown")}) ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk`);
    statements.push(`INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES (${sql(nodeId)},${sql(`${domain} — question-bank review`)},${sql(domain)},${sql(domain)},${sql(domain)},'AMC MCQ',${sql(`Imported source-era questions in ${domain}; current Australian guidance remains separately verified.`)},NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary`);
    statements.push(`INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES (${sql(q.record_id)},${sql(nodeId)},1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type`);
    statements.push(`DELETE FROM question_options WHERE question_id=${sql(q.record_id)}`);
    normalizedOptions.forEach(([key, value], index) => statements.push(`INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES (${sql(`${q.record_id}-${key}`)},${sql(q.record_id)},${sql(key)},${sql(value)},NULL,${index + 1})`));
  }
  await writeFile(path.join(siteRoot, "drizzle", `${tag}.sql`), statements.join(";\n--> statement-breakpoint\n") + ";\n");
  journal.entries.push({ idx: migrationIndex, version: "6", when: 1790251200000 + migrationIndex, tag, breakpoints: true });
}

const finalIndex = 3 + Math.ceil(records.length / chunkSize);
const finalTag = `${String(finalIndex).padStart(4, "0")}_amc_v294_finalize`;
await writeFile(path.join(siteRoot, "drizzle", `${finalTag}.sql`), "UPDATE questions SET active=0 WHERE import_version='pilot-v1';\n");
journal.entries.push({ idx: finalIndex, version: "6", when: 1790251200000 + finalIndex, tag: finalTag, breakpoints: true });
await writeFile(path.join(siteRoot, "drizzle/meta/_journal.json"), JSON.stringify(journal, null, 2) + "\n");
console.log(JSON.stringify({ canonical: records.length, migrations: Math.ceil(records.length / chunkSize) + 1, active, activeVisual }));
