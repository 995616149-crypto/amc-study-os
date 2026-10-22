#!/usr/bin/env node
/**
 * Import the extracted Emidici bank into AMC Study OS as an independent source.
 *
 * Guarantees:
 *  - Reuses the existing canonical_records / questions / question_options model.
 *    Only the provenance columns added by drizzle/0054 are new.
 *  - Never writes to a record that is not its own: every statement is scoped to
 *    source_provider='Emidici', and the v2.9.4 corpus rows are only ever read.
 *  - Idempotent.  record_id is a pure function of (provider, source_question_id),
 *    and every insert is INSERT OR IGNORE, so a second run inserts 0 rows.
 *  - Duplicates are MARKED, never deleted and never hidden.
 *  - Practiceability is computed with the same rule set and precedence as
 *    lib/practiceability.ts.  No second judgement layer is introduced here.
 *
 * Usage:
 *   node tools/emidici/import.mjs            # import (idempotent)
 *   node tools/emidici/import.mjs --dry-run  # report only, no writes
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const ROOT = "C:/AMC_Study_OS";
const STAGING = path.join(ROOT, "_staging", "emidici");
const OUTDIR = path.join(ROOT, "import", "emidici");
const DB_PATH = path.join(
  ROOT,
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
  "faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite",
);

const PROVIDER = "Emidici";
const PROVIDER_LONG = "Emidici (Emedici 2026)";
const SOURCE_ID = "src-emidici-2026";
const IMPORT_VERSION = "emidici-2026-v1";
const MARK_VERSION = "emidici-dedup-v1";
const NOW = new Date().toISOString();
const DRY = process.argv.includes("--dry-run");

// Thresholds for MARKING a relationship.  Documented in the final report.
const NEAR_STEM_JACCARD = 0.82;
const NEAR_OPTION_OVERLAP = 4;

// --------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------

const sha1 = (s) => createHash("sha1").update(s).digest("hex");

/** Stable 20-hex record id.  Pure function of provider + source question id. */
function recordId(sourceQuestionId) {
  return sha1(`${PROVIDER}|${sourceQuestionId}`).slice(0, 20);
}

const STOP = new Set(
  ("a an the of to in on at for with and or is are was were be been being his her their our its this that these those" +
    " he she it they you your i we me my him them which what who whom whose from by as has have had do does did not no" +
    " normal years year old year-old man woman patient presents presented following one best answer choose single most" +
    " likely less than more then there here about after before during between under over into out up down s t")
    .split(/\s+/),
);

function normText(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9%.\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return new Set(
    normText(s)
      .split(/[^a-z0-9%.]+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of small) if (big.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function optionOverlap(a, b) {
  // a, b are arrays of normalised option strings
  let n = 0;
  const pool = [...b];
  for (const o of a) {
    const i = pool.indexOf(o);
    if (i >= 0) {
      pool.splice(i, 1);
      n++;
    }
  }
  return n;
}

// --------------------------------------------------------------------------
// practiceability -- single rule set, mirroring lib/practiceability.ts
// --------------------------------------------------------------------------

const REASON = {
  ANSWER_LEAK_PROTECTED: "ANSWER_LEAK_PROTECTED",
  MISSING_REQUIRED_VISUAL: "MISSING_REQUIRED_VISUAL",
  MISSING_SOURCE_ANSWER: "MISSING_SOURCE_ANSWER",
  MISSING_STEM_OPTIONS: "MISSING_STEM_OPTIONS",
  OPTIONS_MODE_IMAGE_WITHOUT_ASSET: "OPTIONS_MODE_IMAGE_WITHOUT_ASSET",
  STRUCTURALLY_BROKEN: "STRUCTURALLY_BROKEN",
  OTHER: "OTHER",
};

// Wording that means an answer/explanation PANEL leaked into the option text.
// Deliberately narrow: a bare "explanation" is ordinary option wording
// ("Request explanation from other aged care staff members"), and matching it
// would wrongly disable a perfectly good question.
const LEAK_PATTERN =
  /(correct answer|your answer|green tick|\u2713|\u2714|answer\s*[:：]|答案|(^|\n)\s*explanation\s*[:：])/i;

function practiceReason(q) {
  const stem = (q.stem ?? "").trim();
  const options = q.options ?? [];
  if (options.filter((o) => String(o ?? "").trim()).length !== 5) {
    return REASON.MISSING_STEM_OPTIONS;
  }
  if (options.some((o) => LEAK_PATTERN.test(String(o)))) return REASON.ANSWER_LEAK_PROTECTED;
  if (!stem || stem.length < 20) return REASON.STRUCTURALLY_BROKEN;
  if (q.has_clinical_image && !(q.figure_assets ?? []).length) {
    return REASON.MISSING_REQUIRED_VISUAL;
  }
  const a = q.correct_answer;
  if (!a || !/^[A-E]$/.test(a)) return REASON.MISSING_SOURCE_ANSWER;
  return null;
}

// --------------------------------------------------------------------------
// load
// --------------------------------------------------------------------------

function loadJsonl(p) {
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

const questions = loadJsonl(path.join(STAGING, "questions.jsonl"));
// figure_assets side table: { source_question_id: ["/emidici-assets/xx-1.jpg", ...] }
const figureMap = existsSync(path.join(STAGING, "figures.json"))
  ? JSON.parse(readFileSync(path.join(STAGING, "figures.json"), "utf8"))
  : {};
// Set by the caller when only a pilot slice should be imported.
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

const db = new DatabaseSync(DB_PATH, { readOnly: DRY });
db.exec("PRAGMA foreign_keys=ON");

// --------------------------------------------------------------------------
// existing corpus fingerprint index (READ ONLY)
// --------------------------------------------------------------------------

const existing = db
  .prepare(
    `SELECT record_id, source_file, source_provider, domain, stem, options_json, source_answer
       FROM canonical_records
      WHERE source_provider IS NULL OR source_provider <> ?`,
  )
  .all(PROVIDER);

const existingIds = new Set(existing.map((r) => r.record_id));
const exIndex = existing.map((r) => {
  const opts = r.options_json ? Object.values(JSON.parse(r.options_json)) : [];
  return {
    id: r.record_id,
    provider: r.source_provider ?? "AMC-v2.9.4",
    source: r.source_file,
    stemTok: tokens(r.stem),
    optsNorm: opts.map(normText),
    sig: sha1(normText(r.stem) + "||" + opts.map(normText).join("|")),
  };
});

// Inverted index over discriminative stem tokens (skip very common ones).
const df = new Map();
for (const e of exIndex) for (const t of e.stemTok) df.set(t, (df.get(t) ?? 0) + 1);
const inv = new Map();
exIndex.forEach((e, i) => {
  for (const t of e.stemTok) {
    if ((df.get(t) ?? 0) <= 400) {
      if (!inv.has(t)) inv.set(t, []);
      inv.get(t).push(i);
    }
  }
});

// --------------------------------------------------------------------------
// import
// --------------------------------------------------------------------------

const stats = {
  parsed: 0,
  candidates: 0,
  new_unique: 0,
  exact_duplicate_existing: 0,
  near_duplicate_existing: 0,
  duplicate_within_emidici: 0,
  practiceable: 0,
  unpracticeable: 0,
  reasons: {},
  no_answer: 0,
  image_questions: 0,
  skipped_no_number: 0,
  id_collision: 0,
};

const seenSig = new Map(); // signature -> emidici record_id (internal duplicate detection)
const marks = [];
const insertCanonical = [];
const insertQuestions = [];
const insertOptions = [];

for (const q of questions) {
  if (q.question_number == null) {
    stats.skipped_no_number++;
    continue;
  }
  // The printed number restarts at 1 inside every source PDF, so identity is
  // (file, number).  The printed number is kept verbatim as well.
  const sid = q.source_question_id ?? `${q.source_pdf_key}#${q.question_number}`;
  if (ONLY && Number(q.question_number) > Number(ONLY)) continue;
  stats.parsed++;

  const rid = recordId(sid);
  if (existingIds.has(rid)) stats.id_collision++;
  const options = (q.options ?? []).map((o) => String(o ?? "").trim()).filter(Boolean);
  const qq = { ...q, figure_assets: figureMap[sid] ?? [] };

  if (q.has_clinical_image) stats.image_questions++;
  if (!q.correct_answer) stats.no_answer++;

  const reason = practiceReason(qq);
  const optionsObj = {};
  ["A", "B", "C", "D", "E"].forEach((k, i) => {
    if (options[i] !== undefined) optionsObj[k] = options[i];
  });
  const optsNorm = Object.values(optionsObj).map(normText);
  const sig = sha1(normText(q.stem) + "||" + optsNorm.join("|"));
  const stemTok = tokens(q.stem);
  const opts = Object.keys(optionsObj).sort().map((k) => optionsObj[k]);

  // ---- duplicate MARKING (never deletion) ----
  let kind = "new_unique";
  let counterpart = null;
  let counterpartProvider = null;
  let similarity = null;
  let method = null;

  if (seenSig.has(sig)) {
    kind = "duplicate_within_emidici";
    counterpart = seenSig.get(sig);
    counterpartProvider = PROVIDER;
    similarity = 1;
    method = "signature";
  } else {
    const cands = new Set();
    for (const t of [...stemTok].slice(0, 12)) {
      const list = inv.get(t);
      if (list && list.length <= 400) for (const i of list) cands.add(i);
    }
    let bestExact = null;
    let bestNear = null;
    for (const i of cands) {
      const e = exIndex[i];
      if (e.sig === sig) {
        bestExact = e;
        break;
      }
      if (stemTok.size && e.optsNorm.length) {
        const s = jaccard(stemTok, e.stemTok);
        const ov = optionOverlap(optsNorm, e.optsNorm);
        if (ov >= NEAR_OPTION_OVERLAP && s >= NEAR_STEM_JACCARD) {
          const score = s + ov / 10;
          if (!bestNear || score > bestNear.score) {
            bestNear = { e, score, s, ov };
          }
        }
      }
    }
    if (bestExact) {
      kind = "exact_duplicate_existing";
      counterpart = bestExact.id;
      counterpartProvider = bestExact.provider;
      similarity = 1;
      method = "signature";
    } else if (bestNear) {
      kind = "near_duplicate_existing";
      counterpart = bestNear.e.id;
      counterpartProvider = bestNear.e.provider;
      similarity = Number(bestNear.s.toFixed(4));
      method = `stem_jaccard>=${NEAR_STEM_JACCARD}&option_overlap>=${NEAR_OPTION_OVERLAP}`;
    }
  }
  if (!seenSig.has(sig)) seenSig.set(sig, rid);

  stats.candidates++;
  if (kind === "new_unique") stats.new_unique++;
  else if (kind === "exact_duplicate_existing") stats.exact_duplicate_existing++;
  else if (kind === "near_duplicate_existing") stats.near_duplicate_existing++;
  else stats.duplicate_within_emidici++;

  // Every record gets a ledger row, including `new_unique`: the table is the
  // complete record of how each Emidici question was classified, so a re-run
  // under changed rules corrects every row instead of leaving stale ones behind.
  marks.push({
    rid,
    sid,
    kind,
    counterpart,
    counterpartProvider,
    similarity,
    evidence: { method, source_pdf: q.source_pdf, question_number: q.question_number },
  });

  // ---- practiceability ----
  if (reason) {
    stats.unpracticeable++;
    stats.reasons[reason] = (stats.reasons[reason] ?? 0) + 1;
  } else {
    stats.practiceable++;
  }

  // ---- rows ----
  const domain = q.source_category?.trim() || "Emidici (source-unlabelled)";
  const visualAsset = (figureMap[sid] ?? [])[0] ?? null;
  const provenance = {
    source_provider: PROVIDER,
    source_provider_long: PROVIDER_LONG,
    source_pdf: q.source_pdf,
    source_page: q.question_page_pdf_index ?? null,
    answer_page: q.answer_page_pdf_index ?? null,
    source_question_id: sid,
    source_question_number: q.question_number,
    source_category: q.source_category ?? null,
    source_location: `${q.source_pdf}#page${q.question_page_pdf_index}`,
    answer_source: q.correct_answer_source ?? null,
    image_indices: q.clinical_image_image_index ?? null,
    notes: q.notes ?? null,
    duplicate_kind: kind,
    duplicate_of: counterpart,
    // Read by practiceability.ts so a source that needs a figure the extractor
    // could not safely recover is reported as MISSING_REQUIRED_VISUAL rather
    // than as an anonymous defect.  It never grants practiceability.
    requires_visual: Boolean(q.has_clinical_image),
    // Recorded source facts, not inferred ones.  5 records in this bank genuinely
    // print only 4 options; they stay unpracticeable because the practiceability
    // rule requires a complete option set, and the reason is named explicitly
    // instead of being papered over with a fabricated fifth option.
    source_option_count: options.length,
    ...(options.length !== 5 ? { source_anomaly: "SOURCE_HAS_4_OPTIONS" } : {}),
    extraction: { engine: "deepseek-flash vision", dpi: 130, import_version: IMPORT_VERSION },
  };

  insertCanonical.push({
    record_id: rid,
    source_file: q.source_pdf,
    source_page: q.question_page_pdf_index ?? null,
    domain,
    stem: q.stem,
    options_json: JSON.stringify(optionsObj),
    source_answer: /^[A-E]$/.test(q.correct_answer ?? "") ? q.correct_answer : null,
    source_explanation: q.explanation ?? null,
    provenance_json: JSON.stringify(provenance),
    visual_asset: visualAsset,
    visual_url: null,
    options_mode: "text",
    current_answer: null,
    current_answer_status: "needs_verification",
    current_evidence_json: "[]",
    currentness_risk: "high",
    record_json: JSON.stringify({
      record_id: rid,
      source_file: q.source_pdf,
      source_relative_path: q.source_pdf,
      source_year: 2026,
      source_page: q.question_page_pdf_index ?? null,
      source_qid: sid,
      domain_hint: domain,
      stem: q.stem,
      options: optionsObj,
      source_answer: q.correct_answer ?? null,
      key_takeaways: q.key_takeaways ?? [],
    }),
    active_quiz: reason === null ? 1 : 0,
    import_version: IMPORT_VERSION,
    imported_at: NOW,
    source_provider: PROVIDER,
    source_question_id: sid,
    source_location: `${q.source_pdf}#page${q.question_page_pdf_index}`,
  });

  insertQuestions.push({
    id: rid,
    source_id: SOURCE_ID,
    source_question_no: sid,
    source_page: q.question_page_pdf_index ?? null,
    domain,
    system: domain,
    topic: domain,
    clinical_task: "AMC MCQ",
    stem_en: q.stem,
    stem_zh: null,
    answer_key: q.correct_answer ?? "",
    source_explanation_en: q.explanation ?? "",
    source_explanation_zh: null,
    memory_rule_en:
      "Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.",
    memory_rule_zh: null,
    image_ref: visualAsset,
    source_year: 2026,
    import_version: IMPORT_VERSION,
    active: reason === null ? 1 : 0,
    options_mode: "text",
    provenance_json: JSON.stringify(provenance),
    current_answer: null,
    current_answer_status: "needs_verification",
    current_evidence_json: "[]",
    currentness_risk: "high",
    source_provider: PROVIDER,
  });

  for (const [k, text] of Object.entries(optionsObj)) {
    insertOptions.push({ id: `${rid}-${k}`, question_id: rid, option_key: k, text_en: text, sort_order: k.charCodeAt(0) - 64 });
  }
}

// --------------------------------------------------------------------------
// write
// --------------------------------------------------------------------------

let newInserts = 0;
if (!DRY) {
  const tx = [];
  const run = (sql) => ({ sql });

  const beforeCanonical = db.prepare("SELECT count(*) c FROM canonical_records").get().c;

  db.exec("BEGIN");
  db.prepare(
    `INSERT OR IGNORE INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(
    SOURCE_ID,
    PROVIDER_LONG,
    "AMC question-bank source",
    2026,
    process.env.EMIDICI_SOURCE_DIR ?? "Emedici PDF export directory (set EMIDICI_SOURCE_DIR)",
    "private-study",
    "emidici-imported",
    "separate-current-layer",
    JSON.stringify({ provider: PROVIDER, import_version: IMPORT_VERSION, files: 34, note: "Independent source; source-era answers preserved verbatim." }),
  );

  // Reconcile rather than ignore.  record_id is derived from (provider, question
  // id), so this can only ever touch a row this importer created; a corrected
  // rule has to be able to fix its own earlier outcome.  Inserting a new record
  // and re-running the importer are both idempotent.
  const cStmt = db.prepare(
    `INSERT INTO canonical_records
     (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,
      visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,
      record_json,active_quiz,import_version,imported_at,source_provider,source_question_id,source_location)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(record_id) DO UPDATE SET
       source_file=excluded.source_file, source_page=excluded.source_page, domain=excluded.domain,
       stem=excluded.stem, options_json=excluded.options_json, source_answer=excluded.source_answer,
       source_explanation=excluded.source_explanation, provenance_json=excluded.provenance_json,
       visual_asset=excluded.visual_asset, options_mode=excluded.options_mode,
       record_json=excluded.record_json, active_quiz=excluded.active_quiz,
       imported_at=excluded.imported_at, source_location=excluded.source_location`,
  );
  const qStmt = db.prepare(
    `INSERT INTO questions
     (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,
      source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,
      active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk,source_provider)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       source_question_no=excluded.source_question_no, source_page=excluded.source_page,
       stem_en=excluded.stem_en, answer_key=excluded.answer_key,
       source_explanation_en=excluded.source_explanation_en, image_ref=excluded.image_ref,
       active=excluded.active, provenance_json=excluded.provenance_json,
       source_provider=excluded.source_provider`,
  );
  const oStmt = db.prepare(
    `INSERT OR IGNORE INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES (?,?,?,?,?,?)`,
  );

  for (const r of insertCanonical)
    cStmt.run(r.record_id, r.source_file, r.source_page, r.domain, r.stem, r.options_json, r.source_answer,
      r.source_explanation, r.provenance_json, r.visual_asset, r.visual_url, r.options_mode, r.current_answer,
      r.current_answer_status, r.current_evidence_json, r.currentness_risk, r.record_json, r.active_quiz,
      r.import_version, r.imported_at, r.source_provider, r.source_question_id, r.source_location);
  for (const r of insertQuestions)
    qStmt.run(r.id, r.source_id, r.source_question_no, r.source_page, r.domain, r.system, r.topic, r.clinical_task,
      r.stem_en, r.stem_zh, r.answer_key, r.source_explanation_en, r.source_explanation_zh, r.memory_rule_en,
      r.memory_rule_zh, r.image_ref, r.source_year, r.import_version, r.active, r.options_mode, r.provenance_json,
      r.current_answer, r.current_answer_status, r.current_evidence_json, r.currentness_risk, r.source_provider);
  for (const r of insertOptions) oStmt.run(r.id, r.question_id, r.option_key, r.text_en, null, r.sort_order);

  // Marking is reconciled, not merely inserted: a re-run after the dedup rules
  // change must be able to correct an earlier mark.  It still never deletes or
  // hides a question.
  const mStmt = db.prepare(
    `INSERT INTO emidici_duplicate_mark
     (emidici_record_id,source_provider,source_question_id,duplicate_kind,counterpart_record_id,counterpart_provider,
      similarity,evidence_json,marked_at,mark_version)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(emidici_record_id) DO UPDATE SET
       duplicate_kind=excluded.duplicate_kind,
       counterpart_record_id=excluded.counterpart_record_id,
       counterpart_provider=excluded.counterpart_provider,
       similarity=excluded.similarity,
       evidence_json=excluded.evidence_json,
       marked_at=excluded.marked_at,
       mark_version=excluded.mark_version`,
  );
  for (const m of marks)
    mStmt.run(m.rid, PROVIDER, m.sid, m.kind, m.counterpart, m.counterpartProvider, m.similarity,
      JSON.stringify(m.evidence), NOW, MARK_VERSION);

  db.exec("COMMIT");

  const afterCanonical = db.prepare("SELECT count(*) c FROM canonical_records").get().c;
  newInserts = afterCanonical - beforeCanonical;
}

// --------------------------------------------------------------------------
// report
// --------------------------------------------------------------------------

if (!DRY && !existsSync(OUTDIR)) mkdirSync(OUTDIR, { recursive: true });
const report = {
  generated_at: NOW,
  provider: PROVIDER,
  import_version: IMPORT_VERSION,
  source_files: [...new Set(questions.map((q) => q.source_pdf))].length,
  ...stats,
  new_inserts_this_run: newInserts,
  marked_duplicates: marks.filter((m) => m.kind !== "new_unique").length,
  thresholds: { near_stem_jaccard: NEAR_STEM_JACCARD, near_option_overlap: NEAR_OPTION_OVERLAP },
};
if (!DRY) writeFileSync(path.join(OUTDIR, "import_report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
