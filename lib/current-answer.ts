/**
 * VERSIONED CURRENT ANSWER — the only authority for a user-visible "current"
 * answer, and the only writer of `current_answer_versions`.
 *
 * Permanent product contract
 * --------------------------
 *   SOURCE-ERA ANSWER (questions.answer_key / questions.source_explanation_en)
 *   is IMMUTABLE.  Nothing in this module reads or writes it except to *display*
 *   it.  There is no code path here that issues UPDATE/DELETE against
 *   `questions`, `canonical_records` or any attempt/history table.
 *
 *   CURRENT AUSTRALIAN ANSWER is append-only and versioned.  Publishing a new
 *   current answer inserts a new row; the previous row stays, and only the
 *   `is_current` flag moves.  See drizzle/0057_current_answer_versions.sql for
 *   the database-level guarantees (a SHADOW_PROPOSAL can never be current).
 */

export const CURRENT_ANSWER_STATUSES = ["VERIFIED_SAME", "VERIFIED_UPDATED", "REVIEW_REQUIRED"] as const;
export type CurrentAnswerStatus = (typeof CURRENT_ANSWER_STATUSES)[number];

export const VERIFICATION_MODES = ["AUTO_DETERMINISTIC_VERIFIED", "REVIEWED_VERIFIED", "SHADOW_PROPOSAL"] as const;
export type VerificationMode = (typeof VERIFICATION_MODES)[number];

/** Only these two modes may ever be shown to a learner as a current answer. */
export const PUBLISHABLE_MODES: VerificationMode[] = ["AUTO_DETERMINISTIC_VERIFIED", "REVIEWED_VERIFIED"];

export type EvidenceRef = {
  sourceFamily?: string;
  title?: string;
  url?: string;
  documentDate?: string | null;
  retrievalDate?: string | null;
  evidenceSummary?: string | null;
  recommendation?: string | null;
  snapshotSha256?: string | null;
};

export type OptionRow = { option_key: string; text_en: string };

export type CurrentAnswerVersion = {
  version_id: string;
  question_id: string;
  version_no: number;
  selected_option_semantic_id: string;
  status: CurrentAnswerStatus;
  verification_mode: VerificationMode;
  effective_date: string | null;
  verified_at: string;
  source_family: string | null;
  source_title: string | null;
  source_url: string | null;
  source_snapshot_sha256: string | null;
  evidence_refs: EvidenceRef[];
  reason_for_change: string | null;
  previous_version_id: string | null;
  is_current: number;
  machine_status: string | null;
  machine_answer: string | null;
  created_at: string;
};

/** The three UI states of the Current Australian guidance panel. */
export type DualAnswerState = "VERIFIED_SAME" | "VERIFIED_UPDATED" | "REVIEW_REQUIRED";

export type DualAnswerView = {
  question_id: string;
  state: DualAnswerState;
  /** Always present.  Never overwritten, never suppressed. */
  source_era_answer: string;
  source_era_answer_text: string | null;
  source_era_explanation: string;
  /** Only a VERIFIED_UPDATED row carries a different option. */
  current_answer: string | null;
  current_answer_text: string | null;
  reason_for_change: string | null;
  effective_date: string | null;
  verified_at: string | null;
  verification_mode: VerificationMode | null;
  source_family: string | null;
  sources: EvidenceRef[];
  version_id: string | null;
  version_no: number | null;
  display: {
    headline: string;
    detail: string;
  };
};

const UNVERIFIED_DETAIL = "No sufficiently reliable option-level update has been verified.";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export type SourceEraQuestion = {
  id: string;
  answer_key: string;
  source_explanation_en: string;
};

/**
 * Builds the learner-visible dual answer.  It is a pure function of the
 * immutable source-era record plus the single published current version, so the
 * two can never be blended into one "answer".
 */
export function buildDualAnswerView(
  question: SourceEraQuestion,
  options: OptionRow[],
  version: CurrentAnswerVersion | null,
): DualAnswerView {
  const optionText = (key: string | null) => {
    if (!key || key === "NONE") return null;
    const match = options.find((option) => option.option_key === key);
    return match?.text_en ? String(match.text_en).trim() : null;
  };
  const sourceEraAnswer = text(question.answer_key) || "—";
  const base = {
    question_id: question.id,
    source_era_answer: sourceEraAnswer,
    source_era_answer_text: optionText(sourceEraAnswer),
    source_era_explanation: String(question.source_explanation_en ?? ""),
  };

  const published = version && PUBLISHABLE_MODES.includes(version.verification_mode) ? version : null;
  if (!published) {
    return {
      ...base,
      state: "REVIEW_REQUIRED",
      current_answer: null,
      current_answer_text: null,
      reason_for_change: null,
      effective_date: null,
      verified_at: null,
      verification_mode: null,
      source_family: null,
      sources: [],
      version_id: null,
      version_no: null,
      display: { headline: "REVIEW REQUIRED", detail: UNVERIFIED_DETAIL },
    };
  }

  const sources = Array.isArray(published.evidence_refs) ? published.evidence_refs : [];
  const common = {
    ...base,
    effective_date: published.effective_date ?? null,
    verified_at: published.verified_at ?? null,
    verification_mode: published.verification_mode,
    source_family: published.source_family ?? null,
    sources,
    version_id: published.version_id,
    version_no: published.version_no,
  };

  if (published.status === "REVIEW_REQUIRED") {
    return {
      ...common,
      state: "REVIEW_REQUIRED",
      current_answer: null,
      current_answer_text: null,
      reason_for_change: published.reason_for_change ?? null,
      display: { headline: "REVIEW REQUIRED", detail: UNVERIFIED_DETAIL },
    };
  }

  if (published.status === "VERIFIED_SAME") {
    const echoed = published.selected_option_semantic_id === sourceEraAnswer
      ? published.selected_option_semantic_id
      : sourceEraAnswer;
    return {
      ...common,
      state: "VERIFIED_SAME",
      current_answer: echoed,
      current_answer_text: optionText(echoed),
      reason_for_change: null,
      display: { headline: "Current Australian guidance", detail: "VERIFIED — answer unchanged" },
    };
  }

  // VERIFIED_UPDATED — the source-era answer is retained and shown beside it.
  const updated = published.selected_option_semantic_id;
  return {
    ...common,
    state: "VERIFIED_UPDATED",
    current_answer: updated,
    current_answer_text: optionText(updated),
    reason_for_change: published.reason_for_change ?? null,
    display: { headline: "Current Australian answer", detail: `Updated from ${sourceEraAnswer} to ${updated}` },
  };
}

// ---------------------------------------------------------------------------
// Promotion policy
// ---------------------------------------------------------------------------

export const DETERMINISTIC_EXTRACTION_KINDS = [
  "DOSAGE",
  "AGE_THRESHOLD",
  "SCREENING_INTERVAL",
  "NUMERIC_CUTOFF",
  "GUIDELINE_DEFINED_REPLACEMENT",
] as const;
export type DeterministicExtractionKind = (typeof DETERMINISTIC_EXTRACTION_KINDS)[number];

/**
 * Everything the offline build job must have *already* extracted from a
 * registered Australian source.  No LLM judgement field exists here on purpose:
 * if the decisive step is a model opinion, the candidate is not auto-promotable.
 */
export type DeterministicCandidate = {
  question_id: string;
  source_family: string | null;
  source_title: string | null;
  source_url: string | null;
  source_snapshot_sha256: string | null;
  /** Registered in the Australian authoritative source registry. */
  source_registered: boolean;
  /** Source carries an explicit CURRENT + FINAL currency marker. */
  source_currency_current_final: boolean;
  /** The exact span taken from the fetched source; matching is done on this. */
  direct_source_span: string | null;
  extraction_kind: DeterministicExtractionKind | null;
  /** The extracted value, e.g. "5 years", "25", "1.8 mmol/L", "75 mg". */
  extraction_value: string | null;
  effective_date: string | null;
  evidence_refs: EvidenceRef[];
  /** Adversarial flags the extractor must actively rule out. */
  semantic_bridge_required: boolean;
  parent_class_inference: boolean;
  uncovered_components: string[];
  contradictions: string[];
  image_interpretation_required: boolean;
  llm_judgement_decisive: boolean;
  /** For GUIDELINE_DEFINED_REPLACEMENT: the option the guideline names verbatim. */
  guideline_named_option_key?: string | null;
};

export type PromotionVerdict = {
  eligible: boolean;
  matched_option_key: string | null;
  reasons: string[];
};

const NUMBER_PATTERN = /-?\d+(?:\.\d+)?/g;

function canonicalNumbers(value: string): string[] {
  return (value.match(NUMBER_PATTERN) ?? []).map((token) => {
    const parsed = Number(token);
    return Number.isFinite(parsed) ? String(parsed) : token;
  });
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/g, "")
    .trim();
}

/**
 * Deterministic option matching.
 *
 * A candidate earns an option only when the extracted value from the direct
 * source span can be matched to exactly one existing option.  Matching is
 * numeric (so "5 years" matches "every 5 years") or literal (for guideline-
 * defined replacements that name the option verbatim).  It never "reasons".
 */
export function matchOptionDeterministically(
  extractionValue: string | null,
  extractionKind: DeterministicExtractionKind | null,
  options: OptionRow[],
  guidelineNamedOptionKey?: string | null,
): { key: string | null; unique: boolean; reason: string } {
  const usable = options.filter((option) => text(option.option_key) && text(option.text_en));
  if (!usable.length) return { key: null, unique: false, reason: "no_options" };

  if (extractionKind === "GUIDELINE_DEFINED_REPLACEMENT") {
    const key = text(guidelineNamedOptionKey).toUpperCase();
    const target = usable.filter((option) => option.option_key.toUpperCase() === key);
    if (target.length !== 1) return { key: null, unique: false, reason: "guideline_named_option_not_unique" };
    return { key: target[0].option_key, unique: true, reason: "guideline_named_option" };
  }

  const value = text(extractionValue);
  if (!value) return { key: null, unique: false, reason: "no_extraction_value" };
  const wanted = canonicalNumbers(value);
  if (!wanted.length) return { key: null, unique: false, reason: "non_numeric_extraction" };

  const hits = usable.filter((option) => {
    const present = canonicalNumbers(option.text_en);
    return wanted.every((token) => present.includes(token));
  });
  if (hits.length === 1) return { key: hits[0].option_key, unique: true, reason: "unique_numeric_match" };
  if (!hits.length) return { key: null, unique: false, reason: "no_option_match" };
  return { key: null, unique: false, reason: "ambiguous_option_match" };
}

/**
 * The single gate between an extracted candidate and a user-visible current
 * answer.  Every condition from the release contract is checked explicitly and
 * each failure is reported, so an ineligible candidate can never be published
 * "silently".
 */
export function evaluateAutoDeterministicPromotion(
  candidate: DeterministicCandidate,
  options: OptionRow[],
): PromotionVerdict {
  const reasons: string[] = [];
  if (!candidate || typeof candidate !== "object") return { eligible: false, matched_option_key: null, reasons: ["malformed_candidate"] };

  if (!candidate.source_registered) reasons.push("source_not_registered_authoritative");
  if (!candidate.source_currency_current_final) reasons.push("source_not_current_final");
  if (!text(candidate.direct_source_span)) reasons.push("missing_verified_direct_source_span");
  if (!text(candidate.source_url)) reasons.push("missing_source_url");
  if (!text(candidate.source_title)) reasons.push("missing_source_title");
  if (!text(candidate.effective_date)) reasons.push("missing_effective_date");
  if (!Array.isArray(candidate.evidence_refs) || !candidate.evidence_refs.length) reasons.push("missing_evidence_refs");
  if (!candidate.extraction_kind || !DETERMINISTIC_EXTRACTION_KINDS.includes(candidate.extraction_kind)) reasons.push("extraction_not_deterministic_kind");
  if (candidate.semantic_bridge_required) reasons.push("semantic_bridge_required");
  if (candidate.parent_class_inference) reasons.push("parent_class_inference");
  if (candidate.image_interpretation_required) reasons.push("image_interpretation_required");
  if (candidate.llm_judgement_decisive) reasons.push("llm_judgement_decisive");
  if (Array.isArray(candidate.uncovered_components) && candidate.uncovered_components.length) reasons.push("uncovered_component");
  if (Array.isArray(candidate.contradictions) && candidate.contradictions.length) reasons.push("contradiction_present");

  // The extraction must be physically present in the span it was taken from.
  const span = normalizeForMatch(text(candidate.direct_source_span));
  const value = normalizeForMatch(text(candidate.extraction_value));
  if (value && span && !span.includes(value) && !canonicalNumbers(value).every((token) => canonicalNumbers(span).includes(token))) {
    reasons.push("extraction_not_present_in_direct_source_span");
  }

  const match = matchOptionDeterministically(candidate.extraction_value, candidate.extraction_kind, options, candidate.guideline_named_option_key ?? null);
  if (!match.unique || !match.key) reasons.push(`option_match_${match.reason}`);

  return { eligible: reasons.length === 0, matched_option_key: match.key, reasons };
}

export type VersionAppendInput = {
  question_id: string;
  selected_option_semantic_id: string;
  status: CurrentAnswerStatus;
  verification_mode: VerificationMode;
  effective_date?: string | null;
  verified_at?: string | null;
  source_family?: string | null;
  source_title?: string | null;
  source_url?: string | null;
  source_snapshot_sha256?: string | null;
  evidence_refs?: EvidenceRef[];
  reason_for_change?: string | null;
  machine_status?: string | null;
  machine_answer?: string | null;
};

type D1Like = {
  prepare(sql: string): {
    bind(...values: unknown[]): { run(): Promise<unknown>; first<T>(): Promise<T | null>; all<T>(): Promise<{ results: T[] }> };
  };
  batch(statements: unknown[]): Promise<unknown>;
};

function parseEvidenceRefs(value: unknown): EvidenceRef[] {
  if (Array.isArray(value)) return value as EvidenceRef[];
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as EvidenceRef[]) : [];
  } catch {
    return [];
  }
}

/** D1 stores `evidence_refs` as JSON text; normalise a raw row for the UI. */
export function versionFromRow(row: any): CurrentAnswerVersion {
  return { ...row, evidence_refs: parseEvidenceRefs(row?.evidence_refs) } as CurrentAnswerVersion;
}

function rowToVersion(row: any): CurrentAnswerVersion {
  return versionFromRow(row);
}

export async function readCurrentVersion(database: D1Like, questionId: string): Promise<CurrentAnswerVersion | null> {
  const row = await database
    .prepare(`SELECT * FROM current_answer_versions WHERE question_id=? AND is_current=1`)
    .bind(questionId)
    .first<any>();
  return row ? rowToVersion(row) : null;
}

export async function readCurrentVersions(database: D1Like, questionIds: string[]): Promise<Map<string, CurrentAnswerVersion>> {
  const map = new Map<string, CurrentAnswerVersion>();
  const ids = [...new Set(questionIds.filter((id) => typeof id === "string" && id))];
  for (let index = 0; index < ids.length; index += 200) {
    const slice = ids.slice(index, index + 200);
    const placeholders = slice.map(() => "?").join(",");
    const rows = await database
      .prepare(`SELECT * FROM current_answer_versions WHERE is_current=1 AND question_id IN (${placeholders})`)
      .bind(...slice)
      .all<any>();
    for (const row of rows.results ?? []) map.set(row.question_id, rowToVersion(row));
  }
  return map;
}

export async function readVersionHistory(database: D1Like, questionId: string): Promise<CurrentAnswerVersion[]> {
  const rows = await database
    .prepare(`SELECT * FROM current_answer_versions WHERE question_id=? ORDER BY version_no DESC`)
    .bind(questionId)
    .all<any>();
  return (rows.results ?? []).map(rowToVersion);
}

/**
 * Appends one version row.  Publishing also clears the previous `is_current`
 * flag — a flag transition, never a content rewrite.  The previous row is left
 * byte-identical so the whole history stays readable.
 */
export async function appendVersion(database: D1Like, input: VersionAppendInput): Promise<CurrentAnswerVersion> {
  if (!CURRENT_ANSWER_STATUSES.includes(input.status)) throw new Error(`invalid status ${input.status}`);
  if (!VERIFICATION_MODES.includes(input.verification_mode)) throw new Error(`invalid verification mode ${input.verification_mode}`);
  if (input.status === "REVIEW_REQUIRED" && input.selected_option_semantic_id !== "NONE") {
    throw new Error("REVIEW_REQUIRED must not carry an option");
  }
  const publish = PUBLISHABLE_MODES.includes(input.verification_mode);
  if (!publish && input.selected_option_semantic_id !== "NONE") {
    throw new Error("a shadow proposal must not carry a selected option as its current answer");
  }

  const latest = await database
    .prepare(`SELECT version_id, version_no FROM current_answer_versions WHERE question_id=? ORDER BY version_no DESC LIMIT 1`)
    .bind(input.question_id)
    .first<{ version_id: string; version_no: number }>();

  const now = new Date().toISOString();
  const versionId = crypto.randomUUID();
  const versionNo = (latest?.version_no ?? 0) + 1;

  const statements: unknown[] = [];
  if (publish) {
    statements.push(
      database.prepare(`UPDATE current_answer_versions SET is_current=0 WHERE question_id=? AND is_current=1`).bind(input.question_id),
    );
  }
  statements.push(
    database.prepare(
      `INSERT INTO current_answer_versions
        (version_id,question_id,version_no,selected_option_semantic_id,status,verification_mode,effective_date,verified_at,
         source_family,source_title,source_url,source_snapshot_sha256,evidence_refs,reason_for_change,previous_version_id,is_current,
         machine_status,machine_answer,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      versionId,
      input.question_id,
      versionNo,
      input.selected_option_semantic_id,
      input.status,
      input.verification_mode,
      input.effective_date ?? null,
      input.verified_at ?? now,
      input.source_family ?? null,
      input.source_title ?? null,
      input.source_url ?? null,
      input.source_snapshot_sha256 ?? null,
      JSON.stringify(input.evidence_refs ?? []),
      input.reason_for_change ?? null,
      latest?.version_id ?? null,
      publish ? 1 : 0,
      input.machine_status ?? null,
      input.machine_answer ?? null,
      now,
    ),
  );
  await database.batch(statements);

  const inserted = await database
    .prepare(`SELECT * FROM current_answer_versions WHERE version_id=?`)
    .bind(versionId)
    .first<any>();
  return rowToVersion(inserted);
}

/**
 * Records an unverified machine candidate.  It is written to the same
 * append-only stream for auditability, but it can never become current: the
 * database rejects that combination, and the read path only serves publishable
 * modes.
 */
export async function recordShadowProposal(database: D1Like, input: {
  question_id: string;
  machine_status: string;
  machine_answer: string | null;
  evidence_refs?: EvidenceRef[];
  source_family?: string | null;
  source_title?: string | null;
  source_url?: string | null;
  reason_for_change?: string | null;
}): Promise<CurrentAnswerVersion> {
  return appendVersion(database, {
    question_id: input.question_id,
    selected_option_semantic_id: "NONE",
    status: "REVIEW_REQUIRED",
    verification_mode: "SHADOW_PROPOSAL",
    evidence_refs: input.evidence_refs ?? [],
    source_family: input.source_family ?? null,
    source_title: input.source_title ?? null,
    source_url: input.source_url ?? null,
    reason_for_change: input.reason_for_change ?? null,
    machine_status: input.machine_status,
    machine_answer: input.machine_answer,
  });
}

/** Promotion path B — human review of a non-deterministic clinical update. */
export async function publishReviewedVersion(database: D1Like, input: VersionAppendInput & { reviewed_by: string }): Promise<CurrentAnswerVersion> {
  if (!text(input.reviewed_by)) throw new Error("reviewed_by is required for a reviewed promotion");
  if (input.status === "REVIEW_REQUIRED") {
    return appendVersion(database, { ...input, verification_mode: "REVIEWED_VERIFIED", selected_option_semantic_id: "NONE" });
  }
  const option = text(input.selected_option_semantic_id).toUpperCase();
  if (!/^[A-E]$/.test(option)) throw new Error("a reviewed update must select an existing option");
  return appendVersion(database, { ...input, verification_mode: "REVIEWED_VERIFIED", selected_option_semantic_id: option });
}

/** Promotion path A — the deterministic gate must pass, then the row is written. */
export async function promoteAutoDeterministic(
  database: D1Like,
  candidate: DeterministicCandidate,
  options: OptionRow[],
): Promise<{ published: boolean; verdict: PromotionVerdict; version: CurrentAnswerVersion | null }> {
  const verdict = evaluateAutoDeterministicPromotion(candidate, options);
  if (!verdict.eligible || !verdict.matched_option_key) return { published: false, verdict, version: null };
  const sourceEra = await database
    .prepare(`SELECT answer_key FROM questions WHERE id=?`)
    .bind(candidate.question_id)
    .first<{ answer_key: string }>();
  const same = text(sourceEra?.answer_key).toUpperCase() === verdict.matched_option_key;
  const version = await appendVersion(database, {
    question_id: candidate.question_id,
    selected_option_semantic_id: verdict.matched_option_key,
    status: same ? "VERIFIED_SAME" : "VERIFIED_UPDATED",
    verification_mode: "AUTO_DETERMINISTIC_VERIFIED",
    effective_date: candidate.effective_date,
    source_family: candidate.source_family,
    source_title: candidate.source_title,
    source_url: candidate.source_url,
    source_snapshot_sha256: candidate.source_snapshot_sha256,
    evidence_refs: candidate.evidence_refs,
    reason_for_change: same
      ? null
      : `Deterministic ${String(candidate.extraction_kind).toLowerCase()} update: ${text(candidate.extraction_value)} (was ${text(sourceEra?.answer_key) || "—"}).`,
  });
  return { published: true, verdict, version };
}
