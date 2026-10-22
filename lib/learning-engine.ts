export type GuidanceStatus =
  | "VERIFIED_SAME"
  | "VERIFIED_UPDATED_OPTION"
  | "VERIFIED_UPDATED_NOT_IN_OPTIONS"
  | "VERIFIED_RATIONALE_CHANGED"
  | "CONFLICTING_EVIDENCE"
  | "UNVERIFIED";

export type EvidenceSource = {
  title: string;
  url?: string;
  accessed?: string;
  issuingBody?: string;
  year?: string;
};

export type Guidance = {
  status: GuidanceStatus;
  currentAnswer: string | null;
  currentAnswerText: string | null;
  recommendation: string | null;
  whatChanged: string | null;
  verifiedAt: string | null;
  sources: EvidenceSource[];
  isVerified: boolean;
  isUpdated: boolean;
};

const STATUS_MAP: Record<string, GuidanceStatus> = {
  verified_same: "VERIFIED_SAME",
  same: "VERIFIED_SAME",
  verified_updated_option: "VERIFIED_UPDATED_OPTION",
  updated_option: "VERIFIED_UPDATED_OPTION",
  verified_updated_not_in_options: "VERIFIED_UPDATED_NOT_IN_OPTIONS",
  updated_not_in_options: "VERIFIED_UPDATED_NOT_IN_OPTIONS",
  verified_rationale_changed: "VERIFIED_RATIONALE_CHANGED",
  rationale_changed: "VERIFIED_RATIONALE_CHANGED",
  conflicting_evidence: "CONFLICTING_EVIDENCE",
  needs_verification: "UNVERIFIED",
  unverified: "UNVERIFIED",
};

export function normalizeGuidanceStatus(value: unknown): GuidanceStatus {
  if (typeof value !== "string") return "UNVERIFIED";
  const key = value.trim().toLowerCase();
  return STATUS_MAP[key] ?? (Object.values(STATUS_MAP).includes(value as GuidanceStatus) ? value as GuidanceStatus : "UNVERIFIED");
}

function parseEvidence(value: unknown): EvidenceSource[] {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean).map((row: any) => ({
      title: String(row.title ?? row.documentTitle ?? row.name ?? "Australian clinical guidance"),
      url: typeof row.url === "string" ? row.url : undefined,
      accessed: String(row.accessed ?? row.retrievalDate ?? row.verificationDate ?? row.verifiedAt ?? "") || undefined,
      issuingBody: String(row.issuingBody ?? row.issuer ?? "") || undefined,
      year: String(row.year ?? row.publicationYear ?? String(row.documentDate ?? "").match(/20\d{2}/)?.[0] ?? "") || undefined,
    }));
  } catch {
    return [];
  }
}

function optionText(options: any[], key: string | null) {
  if (!key) return null;
  const option = options.find((row) => row.option_key === key);
  return option?.text_en ? String(option.text_en).replace(/^O?[A-E][.)]?\s*/i, "").trim() : null;
}

export function guidanceForQuestion(question: any, options: any[], coach: any, coachSources: any[], cached?: any): Guidance {
  let status = normalizeGuidanceStatus(question?.current_answer_status);
  let currentAnswer = typeof question?.current_answer === "string" && question.current_answer.trim() ? question.current_answer.trim().toUpperCase() : null;
  const sources = [...parseEvidence(question?.current_evidence_json), ...parseEvidence(coachSources)]
    .filter((row, index, all) => index === all.findIndex((candidate) => candidate.title === row.title && candidate.url === row.url));
  const cacheSources = parseEvidence(cached?.sources_json);
  const cacheFresh = !!cached?.stale_after && new Date(cached.stale_after).getTime() > Date.now();
  const cacheStatus = normalizeGuidanceStatus(cached?.status);
  const usableCache = cacheFresh && cacheSources.some((row) => /^https:\/\//.test(row.url ?? "")) && (cacheStatus.startsWith("VERIFIED_") || cacheStatus === "CONFLICTING_EVIDENCE");
  if (usableCache) {
    status = normalizeGuidanceStatus(cached.status);
    currentAnswer = cacheStatus.startsWith("VERIFIED_") && typeof cached.current_answer === "string" ? cached.current_answer.toUpperCase() : null;
    sources.splice(0, sources.length, ...cacheSources);
  }

  const verified = status.startsWith("VERIFIED_") && sources.length > 0;
  if (!verified && status !== "CONFLICTING_EVIDENCE") {
    status = "UNVERIFIED";
    currentAnswer = null;
  }
  const recommendation = verified || status === "CONFLICTING_EVIDENCE" ? String((usableCache ? cached.recommendation : coach?.currentPractice) ?? "").trim() || null : null;
  const whatChanged = (verified && status !== "VERIFIED_SAME") || status === "CONFLICTING_EVIDENCE"
    ? String((usableCache ? cached.what_changed : coach?.sourceVsCurrent) ?? "").trim() || null
    : null;
  return {
    status,
    currentAnswer,
    currentAnswerText: currentAnswer === "NONE" ? null : optionText(options, currentAnswer),
    recommendation,
    whatChanged,
    verifiedAt: usableCache ? String(cached.verified_at ?? "") || null : sources.find((source) => source.accessed)?.accessed ?? (String(coach?.searchedAt ?? "").trim() || null),
    sources,
    isVerified: verified,
    isUpdated: ["VERIFIED_UPDATED_OPTION", "VERIFIED_UPDATED_NOT_IN_OPTIONS", "VERIFIED_RATIONALE_CHANGED"].includes(status),
  };
}

/**
 * Derives the legacy `Guidance` shape for queue scoring and chapter review from
 * a PUBLISHED dual-answer view.
 *
 * This is the only bridge from the versioned current answer to those surfaces.
 * When a question has no published version, or the published version asserts no
 * option-level update, the result is UNVERIFIED: no current answer is invented
 * and a shadow proposal can never appear here.
 */
export function guidanceFromDualAnswer(question: any, options: any[], dual: any): Guidance {
  const shape: Guidance = {
    status: "UNVERIFIED",
    currentAnswer: null,
    currentAnswerText: null,
    recommendation: null,
    whatChanged: null,
    verifiedAt: null,
    sources: [],
    isVerified: false,
    isUpdated: false,
  };
  if (!dual || dual.state === "REVIEW_REQUIRED") return shape;
  const currentAnswer = typeof dual.current_answer === "string" && dual.current_answer ? dual.current_answer.toUpperCase() : null;
  const isUpdated = dual.state === "VERIFIED_UPDATED";
  return {
    status: isUpdated ? "VERIFIED_UPDATED_OPTION" : "VERIFIED_SAME",
    currentAnswer,
    currentAnswerText: optionText(options, currentAnswer),
    recommendation: dual.reason_for_change ?? null,
    whatChanged: isUpdated ? dual.reason_for_change ?? null : null,
    verifiedAt: dual.verified_at ?? null,
    sources: parseEvidence(
      Array.isArray(dual.sources)
        ? dual.sources.map((source: any) => ({
            title: source?.title, url: source?.url,
            accessed: source?.retrievalDate ?? source?.documentDate ?? dual.verified_at,
            issuingBody: source?.sourceFamily,
          }))
        : [],
    ),
    isVerified: true,
    isUpdated,
  };
}

export type QueueItem = { questionId: string; reason: string; score: number };
export function buildTargetedQueue(questions: any[], attempts: any[], links: any[], reviews: any[], guidanceById: Map<string, Guidance>, nodeId?: string, conceptMappings: any[] = [], conceptReviews: any[] = [], requestedConceptId?: string): QueueItem[] {
  const now = Date.now();
  const weakCard = requestedConceptId ? conceptReviews.find((card) => card.tested_concept_id === requestedConceptId) : [...conceptReviews].sort((a,b)=>Number(b.priority)-Number(a.priority))[0];
  const targetConceptId = requestedConceptId ?? weakCard?.tested_concept_id;
  const targetMapping = conceptMappings.find((mapping) => mapping.tested_concept_id === targetConceptId);
  const filtered = nodeId ? questions.filter((question) => links.some((link) => link.question_id === question.id && link.node_id === nodeId)) : questions;
  return filtered.map((question) => {
    const history = attempts.filter((attempt) => attempt.question_id === question.id);
    const linkedNodeIds = links.filter((link) => link.question_id === question.id).map((link) => link.node_id);
    const due = reviews.some((review) => linkedNodeIds.includes(review.node_id) && new Date(review.due_at).getTime() <= now);
    const wrong = history.filter((attempt) => !attempt.correct).length;
    const lowConfidence = history.some((attempt) => attempt.confidence !== "confident");
    const guidanceUpdated = guidanceById.get(question.id)?.isUpdated ?? false;
    const last = history[0]?.attempted_at ? new Date(history[0].attempted_at).getTime() : 0;
    const stale = last > 0 && now - last > 21 * 86400000;
    const mapping = conceptMappings.find((row) => row.question_id === question.id);
    const exactConcept = !!targetConceptId && mapping?.tested_concept_id === targetConceptId;
    const sameSection = !!targetMapping && mapping?.chapter_id === targetMapping.chapter_id && mapping?.section_id === targetMapping.section_id;
    const sameChapter = !!targetMapping && mapping?.chapter_id === targetMapping.chapter_id;
    let score = wrong * 45 + (lowConfidence ? 24 : 0) + (due ? 34 : 0) + (guidanceUpdated ? 30 : 0) + (stale ? 12 : 0) + (history.length === 0 ? 5 : 0) + (exactConcept ? 180 : sameSection ? 110 : sameChapter ? 55 : 0);
    const reason = exactConcept ? "Same weak concept" : sameSection ? "Same chapter section" : sameChapter ? "Same chapter" : wrong ? "Previous mistake" : lowConfidence ? "Low confidence" : due ? "Due for review" : guidanceUpdated ? "Guideline update" : nodeId ? "Same knowledge node" : stale ? "Long time since review" : "Knowledge coverage";
    if (!history.length && !nodeId && !guidanceUpdated && !exactConcept && !sameSection && !sameChapter) score = 1;
    return { questionId: question.id, reason, score };
  }).sort((a, b) => b.score - a.score || a.questionId.localeCompare(b.questionId));
}

export function buildGuidelineQueue(questions: any[], guidanceById: Map<string, Guidance>): QueueItem[] {
  return questions
    .filter((question) => guidanceById.get(question.id)?.isUpdated)
    .map((question) => ({ questionId: question.id, reason: "Guideline update", score: 100 }));
}

export function distractorReason(sourceExplanation: string, optionKey: string): string | null {
  const escaped = optionKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\((?:Option|Options)\\s+[^)]*${escaped}[^)]*\\)\\s*([^\\n]+(?:\\n(?!\\().+)*)`, "i");
  return sourceExplanation.match(pattern)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

export function concise(text: unknown, max = 360): string {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const clipped = clean.slice(0, max);
  const sentence = clipped.lastIndexOf(". ");
  return `${clipped.slice(0, sentence > 100 ? sentence + 1 : max).trim()}…`;
}
