// Practiceability is a property of a canonical record itself.  It is deliberately
// independent of the semantic/canonical chapter mapping: a record that has not
// been mapped to a canonical chapter is still perfectly practiceable.
//
// The reason codes below mirror the requirement vocabulary and are the single
// source of truth for both the SQL projection used by /api/bootstrap and the
// pure helpers used by the client.

import { LEAKED_ANSWER_IN_OPTIONS_IDS, MISSING_REQUIRED_SOURCE_VISUAL_IDS } from "./visual-integrity";

export const PRACTICE_REASON = {
  ANSWER_LEAK_PROTECTED: "ANSWER_LEAK_PROTECTED",
  MISSING_REQUIRED_VISUAL: "MISSING_REQUIRED_VISUAL",
  MISSING_SOURCE_ANSWER: "MISSING_SOURCE_ANSWER",
  MISSING_STEM_OPTIONS: "MISSING_STEM_OPTIONS",
  OPTIONS_MODE_IMAGE_WITHOUT_ASSET: "OPTIONS_MODE_IMAGE_WITHOUT_ASSET",
  STRUCTURALLY_BROKEN: "STRUCTURALLY_BROKEN",
  OTHER: "OTHER",
} as const;

export type PracticeReason = (typeof PRACTICE_REASON)[keyof typeof PRACTICE_REASON];

// Informational only.  Never used to decide practiceability.
export const UNMAPPED_CHAPTER = "UNMAPPED_CANONICAL_CHAPTER";

export const PRACTICE_REASON_LABEL: Record<string, string> = {
  ANSWER_LEAK_PROTECTED: "原始选项混入答案区文字，需先核对来源",
  MISSING_REQUIRED_VISUAL: "缺少原题必需图片",
  MISSING_SOURCE_ANSWER: "原始记录没有可判分的答案（非 A–E）",
  MISSING_STEM_OPTIONS: "原始记录选项不完整（不是 5 个非空选项）",
  OPTIONS_MODE_IMAGE_WITHOUT_ASSET: "选项以题图呈现，但题图资源缺失",
  STRUCTURALLY_BROKEN: "原始记录结构损坏（题干缺失）",
  OTHER: "其他原始记录缺陷",
  [UNMAPPED_CHAPTER]: "尚未建立 canonical chapter（不影响刷题）",
};

const SAFE_ID = /^[a-z0-9]+$/;

function idList(ids: Iterable<string>) {
  const quoted = [...ids].filter((id) => SAFE_ID.test(id)).map((id) => `'${id}'`);
  return quoted.length ? quoted.join(",") : "''";
}

/**
 * SQL fragment: nullable practiceability reason code for one `canonical_records`
 * row.  NULL means the record is practiceable.
 *
 * A CONFIRMED recovered answer makes a record practiceable exactly like a canonical
 * source answer does, but only when the record still carries 5 usable options —
 * otherwise the item could not be marked safely.  REVIEW_REQUIRED and
 * NO_SOURCE_ANSWER_AVAILABLE recoveries never change practiceability.
 */
export function practiceReasonSql(table = "canonical_records", recoveryTable = "source_answer_recovery") {
  const leaked = idList(LEAKED_ANSWER_IN_OPTIONS_IDS);
  const missingVisual = idList(MISSING_REQUIRED_SOURCE_VISUAL_IDS);
  const fiveOptions = `json_valid(${table}.options_json) AND (SELECT count(*) FROM json_each(${table}.options_json)) = 5`;
  // Promotion is gated on the known-answer calibration gate, so a CONFIRMED recovery
  // does not unlock anything until it has been explicitly promoted.
  const confirmedRecovery = `EXISTS (SELECT 1 FROM ${recoveryTable} r WHERE r.record_id = ${table}.record_id
      AND r.status = 'CONFIRMED' AND r.promoted = 1 AND r.recovered_answer IN ('A','B','C','D','E'))`;
  return `CASE
    WHEN ${table}.record_id IN (${leaked}) THEN '${PRACTICE_REASON.ANSWER_LEAK_PROTECTED}'
    WHEN ${table}.record_id IN (${missingVisual}) THEN '${PRACTICE_REASON.MISSING_REQUIRED_VISUAL}'
    WHEN ${table}.active_quiz = 1 THEN NULL
    WHEN (${confirmedRecovery}) AND (${fiveOptions}) THEN NULL
    WHEN coalesce(${table}.source_provider,'') <> '' AND ${table}.visual_asset IS NULL
         AND json_extract(${table}.provenance_json,'$.requires_visual') = 1 THEN '${PRACTICE_REASON.MISSING_REQUIRED_VISUAL}'
    WHEN ${table}.source_answer IS NULL OR ${table}.source_answer NOT IN ('A','B','C','D','E') THEN '${PRACTICE_REASON.MISSING_SOURCE_ANSWER}'
    WHEN coalesce(${table}.options_mode,'') = 'source_page_image' THEN '${PRACTICE_REASON.OPTIONS_MODE_IMAGE_WITHOUT_ASSET}'
    WHEN NOT (${fiveOptions}) THEN '${PRACTICE_REASON.MISSING_STEM_OPTIONS}'
    WHEN ${table}.stem IS NULL OR trim(${table}.stem) = '' OR ${table}.stem = 'Source-page question' THEN '${PRACTICE_REASON.STRUCTURALLY_BROKEN}'
    ELSE '${PRACTICE_REASON.OTHER}'
  END`;
}

type PracticeShape = { active_quiz?: number | boolean; practiceReason?: string | null };

/** Practiceability of a canonical index row.  Never derives from the chapter map. */
export function isPracticeable(record: PracticeShape | null | undefined) {
  if (!record) return false;
  if (record.practiceReason !== undefined) return !record.practiceReason;
  return Boolean(record.active_quiz);
}

/** The canonical chapter of a record, kept strictly separate from practiceability. */
export function canonicalChapterId(record: { canonicalChapterId?: string | null } | null | undefined) {
  const value = record?.canonicalChapterId;
  return typeof value === "string" && value.trim() ? value : null;
}

export function practiceabilityLabel(reason: string | null | undefined) {
  if (!reason) return "";
  return PRACTICE_REASON_LABEL[reason] ?? PRACTICE_REASON_LABEL[PRACTICE_REASON.OTHER];
}
