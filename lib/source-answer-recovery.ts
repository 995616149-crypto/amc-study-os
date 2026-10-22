// Single resolver for "what is the source-era answer / explanation for this record".
//
// Priority is fixed and deliberately narrow:
//   canonical source_answer
//     -> CONFIRMED source_answer_recovery
//       -> null
//
// REVIEW_REQUIRED and NO_SOURCE_ANSWER_AVAILABLE never resolve to a value, so a
// recovered-but-unverified answer can never leak into practice, marking, the
// Answer Comparison panel or the AI Coach.
//
// The source-era answer and current Australian guidance stay strictly separate:
// nothing in this module touches `current_answer` or the Current Evidence layer.

export const RECOVERY_VERSION = "source-answer-recovery-v1";
export const RECOVERED_IMPORT_VERSION = "v2.9.4-recovered";

export type RecoveryStatus = "CONFIRMED" | "REVIEW_REQUIRED" | "NO_SOURCE_ANSWER_AVAILABLE";

// Mismatch taxonomy.  A conflict between two source documents is NOT a pipeline
// failure and must never be classified as one.
export const RECOVERY_CLASSIFICATION = {
  EXTRACTION_MATCH: "EXTRACTION_MATCH",
  EXTRACTION_MISMATCH: "EXTRACTION_MISMATCH",
  SOURCE_CONFLICT: "SOURCE_CONFLICT",
  NO_MATCH: "NO_MATCH",
  MULTIPLE_MATCHES: "MULTIPLE_MATCHES",
  EXPLANATION_CONTAMINATION: "EXPLANATION_CONTAMINATION",
} as const;

export type RecoveryClassification = (typeof RECOVERY_CLASSIFICATION)[keyof typeof RECOVERY_CLASSIFICATION];

export const RECOVERY_CLASSIFICATION_LABEL: Record<string, string> = {
  EXTRACTION_MATCH: "与 canonical 一致（提取正确）",
  EXTRACTION_MISMATCH: "与 canonical 冲突且无法证明同题 —— 视为提取失败，阻断门禁",
  SOURCE_CONFLICT: "两个来源文档答案解析不同（同一道题的证据成立）",
  NO_MATCH: "答案块无法唯一归属到 canonical 记录",
  MULTIPLE_MATCHES: "答案块匹配到多条记录",
  EXPLANATION_CONTAMINATION: "解析疑似混入相邻题目",
  UNCLASSIFIED: "未分类",
  NO_CONTROL: "已恢复但该题没有 canonical 答案可作对照",
};

export type RecoveryRow = {
  record_id: string;
  recovered_answer?: string | null;
  recovered_explanation?: string | null;
  source_pdf?: string | null;
  source_pdf_sha256?: string | null;
  source_page?: number | null;
  source_page_index?: number | null;
  ocr_engine?: string | null;
  ocr_version?: string | null;
  ocr_confidence?: number | null;
  answer_pattern?: string | null;
  question_fingerprint?: string | null;
  match_method?: string | null;
  candidate_match_count?: number | null;
  status?: string | null;
  review_reason?: string | null;
};

const LETTERS = new Set(["A", "B", "C", "D", "E"]);

export function isRecoveredAnswer(value: unknown): value is string {
  return typeof value === "string" && LETTERS.has(value.trim().toUpperCase());
}

/** True only for a recovery that passed every hard condition. */
export function isPromotedRecovery(row: RecoveryRow | null | undefined): boolean {
  return !!row && row.status === "CONFIRMED" && isRecoveredAnswer(row.recovered_answer);
}

type CanonicalShape = { source_answer?: string | null; source_explanation?: string | null } | null | undefined;

/** canonical source-era answer, else a CONFIRMED recovery, else null. */
export function effectiveSourceAnswer(record: CanonicalShape, recovery?: RecoveryRow | null): string | null {
  if (isRecoveredAnswer(record?.source_answer)) return String(record!.source_answer).trim().toUpperCase();
  return isPromotedRecovery(recovery) ? String(recovery!.recovered_answer).trim().toUpperCase() : null;
}

/** canonical source-era explanation, else a CONFIRMED recovery, else null. */
export function effectiveSourceExplanation(record: CanonicalShape, recovery?: RecoveryRow | null): string | null {
  const canonical = typeof record?.source_explanation === "string" ? record.source_explanation.trim() : "";
  if (canonical) return canonical;
  const recovered = typeof recovery?.recovered_explanation === "string" ? recovery.recovered_explanation.trim() : "";
  return isPromotedRecovery(recovery) && recovered ? recovered : null;
}

export function effectiveAnswerOrigin(record: CanonicalShape, recovery?: RecoveryRow | null) {
  if (isRecoveredAnswer(record?.source_answer)) return "canonical";
  if (isPromotedRecovery(recovery)) return "recovered-confirmed";
  return "unavailable";
}

export function recoveryProvenance(recovery?: RecoveryRow | null) {
  if (!isPromotedRecovery(recovery)) return null;
  return {
    sourcePdf: recovery!.source_pdf ?? null,
    sourcePage: recovery!.source_page ?? null,
    answerPattern: recovery!.answer_pattern ?? null,
    matchMethod: recovery!.match_method ?? null,
    candidateMatchCount: recovery!.candidate_match_count ?? null,
    ocrEngine: recovery!.ocr_engine ?? null,
    ocrVersion: recovery!.ocr_version ?? null,
    ocrConfidence: recovery!.ocr_confidence ?? null,
    recoveryVersion: recovery!.recovery_version ?? RECOVERY_VERSION,
  };
}

export const RECOVERY_REASON_LABEL: Record<string, string> = {
  MULTIPLE_MATCHES: "题干/选项指纹匹配到多条 canonical 记录，无法唯一归属",
  NO_MATCH: "在 canonical 记录中找不到唯一对应题",
  AMBIGUOUS_ANSWER_LETTER: "同一答案块出现多个 Option X is correct，或答案字母不唯一",
  MISSING_ANSWER_PATTERN: "答案册中没有出现 Option X is correct 模式",
  ANSWER_NOT_IN_OPTIONS: "恢复出的字母在本题选项集合中不存在",
  BLOCK_BOUNDARY_UNCLEAR: "答案块与解析正文的边界不清晰",
  EXPLANATION_CONTAMINATION: "解析疑似混入相邻题目的内容",
  LOW_OCR_CONFIDENCE: "该页 OCR 置信度明显异常",
  PROVENANCE_UNCERTAIN: "答案册与来源文件的对齐关系不确定",
  OPTIONS_INCOMPLETE: "本题选项不是 5 个非空选项，无法安全判分",
  KNOWN_ANSWER_CONFLICT: "与 canonical 已知答案冲突（仅作诊断标记，不用于覆盖）",
  NO_LOCAL_ANSWER_EXPORT: "本地可访问的答案源中不存在对应答案材料",
  NOT_ATTEMPTED_YET: "本轮未处理（答案册尚未 OCR 完成）",
};

export function recoveryReasonLabel(reason?: string | null) {
  if (!reason) return "";
  return RECOVERY_REASON_LABEL[reason] ?? reason;
}
