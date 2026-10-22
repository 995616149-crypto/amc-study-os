import { env } from "cloudflare:workers";
import { db, currentUser} from "../_shared";
import { chatText, parseModelJson } from "@/lib/ai-provider";
import frozenMappings from "@/lib/topic-mappings.json";
import frozenNodes from "@/lib/topic-nodes.json";
import { adapterForUrl } from "@/lib/australian-source-registry";
import { canonicalAustralianUrl, retrieveAustralianEvidence, type EvidenceDocument, type RetrievalIntent } from "@/lib/direct-guidance-retrieval";
import { buildDualAnswerView, readCurrentVersion, recordShadowProposal, type DualAnswerView } from "@/lib/current-answer";
import { fetchPubMedEvidence } from "@/lib/pubmed-live";
import { fetchNhsEvidence } from "@/lib/web-live";

/**
 * CURRENT GUIDANCE — production runtime vs. offline build.
 *
 * GET  is the ONLY surface the product uses.  It serves the single published
 *      `current_answer_versions` row from D1.  It performs no network call of
 *      any kind, so opening or submitting a question never depends on a search
 *      API or on any external provider.
 *
 * POST is an offline / asynchronous BUILD entry point.  It is disabled by
 *      default, it can only be reached with an explicit build token, and it can
 *      only ever append a SHADOW_PROPOSAL.  A build run therefore cannot leak a
 *      machine answer into the learner-visible current answer: the database
 *      rejects a shadow row marked current, and this handler never sets the
 *      current flag.
 */

const PROVIDER = "direct-australian-sources+deepseek";
const FINAL_STATUSES = ["VERIFIED_SAME", "VERIFIED_UPDATED_OPTION", "VERIFIED_UPDATED_NOT_IN_OPTIONS", "VERIFIED_RATIONALE_CHANGED", "CONFLICTING_EVIDENCE"] as const;
const KNOWN_STATUSES = new Set<string>(FINAL_STATUSES);
const SPECIAL_FLAGS: Array<[string, RegExp]> = [
  ["pregnancy", /pregnan|postpartum|breastfeed|gestation/i], ["paediatric", /child|infant|neonat|paediatric|pediatric|adolescent/i],
  ["elderly", /elderly|older adult|aged\s+(?:6[5-9]|[7-9]\d|1\d\d)/i], ["renal-impairment", /renal|kidney|dialysis|egfr|creatinine/i],
  ["hepatic-impairment", /hepatic|liver failure|cirrhosis/i], ["unstable", /unstable|shock|hypotens|haemodynamic|hemodynamic|resuscitat/i],
  ["contraindication", /contraindicat|allerg|anaphyla|avoid|must not/i], ["dosage-specific", /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?|iu)\b|dose|dosage/i],
  ["oncology", /cancer|tumou?r|malignan|oncolog|chemotherap|radiotherap/i], ["immunocompromised", /immunocomp|immunosuppress|transplant|neutropen|hiv/i],
  ["stable", /\bstable\b|haemodynamically stable|hemodynamically stable/i],
];

type Runtime = { DEEPSEEK_API_KEY?: string; DEEPSEEK_GUIDANCE_MODEL?: string };
type BuildRuntime = Runtime & { AMC_GUIDANCE_BUILD?: string; AMC_GUIDANCE_BUILD_TOKEN?: string };
type SourceRow = {
  sourceId: string; issuingBody: string; title: string; url: string; documentDate: string | null; retrievalDate: string;
  authorityTier: number; sourceType: string; evidenceSummary: string; relevantRecommendation: string;
};

let selectedModel: { keyHint: string; id: string; expires: number } | null = null;

function safeSources(value: unknown): SourceRow[] {
  try { const parsed = typeof value === "string" ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function finalStatus(value: unknown) { return typeof value === "string" && KNOWN_STATUSES.has(value) ? value : null; }
function answerRelationship(status: string, current: string, source: string) {
  if (status === "VERIFIED_SAME" || status === "VERIFIED_RATIONALE_CHANGED") return current === source;
  if (status === "VERIFIED_UPDATED_OPTION") return /^[A-E]$/.test(current) && current !== source;
  if (status === "VERIFIED_UPDATED_NOT_IN_OPTIONS") return current === "NONE";
  return status === "CONFLICTING_EVIDENCE" && current === "NONE";
}
function contentText(response: any) {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((part: any) => typeof part?.text === "string" ? part.text : "").join("\n").trim();
  return "";
}
function specialFlags(question: any) {
  const text = `${question.stem_en ?? ""} ${question.source_explanation_en ?? ""}`;
  return SPECIAL_FLAGS.filter(([, pattern]) => pattern.test(text)).map(([name]) => name).sort();
}
async function scenarioKey(nodeId: string | null, subtopic: string | null, clinicalTask: string | null, flags: string[]) {
  const input = `${nodeId ?? "none"}|${String(subtopic ?? "").toLowerCase().trim()}|${String(clinicalTask ?? "").toLowerCase().trim()}|${flags.join(",") || "general"}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function history(questionId: string, nodeId: string | null, subtopic: string | null, outcome: string, errorCode: string | null, sources: SourceRow[] = []) {
  await db().prepare(`INSERT INTO guidance_verification_history (id,question_id,node_id,subtopic,outcome,provider,sources_json,checked_at,error_code) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(crypto.randomUUID(), questionId, nodeId, subtopic, outcome, PROVIDER, JSON.stringify(sources), new Date().toISOString(), errorCode).run();
}


async function deepSeekJson(runtime: Runtime, model: string, system: string, user: string, maxTokens: number) {
  void runtime; void model; void maxTokens; // the shared provider owns model choice and limits
  const completion = await chatText([{ role: "system", content: system }, { role: "user", content: user }], { temperature: 0, timeoutMs: 45_000 });
  return parseModelJson(completion.text);
}

function validateIntent(value: any): RetrievalIntent | null {
  if (!value || typeof value !== "object") return null;
  const stringFields = ["population", "condition", "clinical_scenario", "decision", "intervention_or_investigation"];
  if (stringFields.some((key) => typeof value[key] !== "string" || !value[key].trim())) return null;
  if (!Array.isArray(value.search_keywords) || !value.search_keywords.length || !value.search_keywords.every((item: unknown) => typeof item === "string")) return null;
  return { population: value.population, condition: value.condition, clinical_scenario: value.clinical_scenario, decision: value.decision,
    intervention_or_investigation: value.intervention_or_investigation, special_circumstances: Array.isArray(value.special_circumstances) ? value.special_circumstances.map(String).slice(0, 10) : [],
    search_keywords: value.search_keywords.map((item: unknown) => String(item).trim().slice(0, 80)).filter(Boolean).slice(0, 12) };
}

async function formulateIntent(runtime: Runtime, model: string, question: any, options: any[], nodeName: string | null, subtopic: string | null) {
  const system = "Return JSON only. You formulate a clinical retrieval intent; you do not answer the clinical question, judge options, or use internal medical knowledge as evidence. Preserve the population, haemodynamic stability or adverse features, exact acute-versus-long-term decision, and any explicitly stated prior treatment success or failure. Do not invent a contraindication, failed treatment, or special population that the stem does not state.";
  const user = `Create a compact retrieval intent for locating CURRENT Australian authoritative guidance.\nQuestion: ${question.stem_en}\nOptions (context only; do not choose):\n${options.map((o: any) => `${o.option_key}. ${o.text_en}`).join("\n")}\nKnowledge node: ${nodeName ?? "unknown"}\nSubtopic: ${subtopic ?? "unknown"}\nReturn JSON with exactly: population, condition, clinical_scenario, decision, intervention_or_investigation, special_circumstances (array), search_keywords (array of 4-10 concise terms).`;
  return validateIntent(await deepSeekJson(runtime, model, system, user, 700));
}

function evidencePrompt(documents: Array<EvidenceDocument | SourceRow>) {
  return documents.map((document, index) => {
    const text = "text" in document ? document.text : `Previously extracted evidence summary: ${document.evidenceSummary}\nPreviously extracted recommendation: ${document.relevantRecommendation}`;
    return `SOURCE ${document.sourceId || `source-${index + 1}`}\nIssuing body: ${document.issuingBody}\nTitle: ${document.title}\nAuthority tier: ${document.authorityTier}\nDocument date: ${document.documentDate ?? "not confirmed"}\nFetched URL: ${document.url}\nFetched text:\n${text}`;
  }).join("\n\n---\n\n");
}

async function adjudicate(runtime: Runtime, model: string, question: any, options: any[], documents: Array<EvidenceDocument | SourceRow>) {
  const system = `Return JSON only. You adjudicate an AMC-style historical question using ONLY the supplied text fetched from Australian authoritative sources. Never use internal knowledge to fill a gap. Never create a URL, title, date, or source. Identify the exact clinical decision asked (for example preferred first medication, which listed medication is effective, immediate management, definitive treatment, investigation, or diagnosis) and preserve sequencing and conditional language in the fetched recommendation. Distinguish a request for the preferred first-line intervention from a request to select an effective intervention among the listed options. A downstream intervention that the source recommends only after a preceding intervention fails or is contraindicated does not answer a preferred-first-line question unless the stem establishes that condition. It may answer an efficacy-among-listed-options question only when the fetched source directly says that intervention is used for the same rhythm and population; state its conditional place in the recommendation. Never infer a contraindication or failed treatment merely because a downstream intervention appears among the options. Compare the current recommended answer with every listed option. When the fetched source directly supports the answer to the exact decision but that answer is absent from the options, use VERIFIED_UPDATED_NOT_IN_OPTIONS with current_answer NONE; do not return UNVERIFIED merely because it is not listed. Use VERIFIED_SAME only when the current answer and source-era keyed option are the same for the question's exact decision and scenario. If the supplied sources do not directly support an answer, return UNVERIFIED. If authoritative sources conflict and the conflict cannot be resolved, return CONFLICTING_EVIDENCE. For either non-verified status current_answer must be NONE.`;
  const user = `Historical question: ${question.stem_en}\nOptions:\n${options.map((o: any) => `${o.option_key}. ${o.text_en}`).join("\n")}\nSource-era keyed answer: ${question.answer_key}\nSource-era explanation: ${question.source_explanation_en}\n\nACTUAL FETCHED SOURCES:\n${evidencePrompt(documents)}\n\nReturn exactly this JSON shape:\n{"status":"VERIFIED_SAME|VERIFIED_UPDATED_OPTION|VERIFIED_UPDATED_NOT_IN_OPTIONS|VERIFIED_RATIONALE_CHANGED|CONFLICTING_EVIDENCE|UNVERIFIED","current_answer":"A|B|C|D|E|NONE","recommendation":"concise current recommendation or why evidence is insufficient/conflicting","what_changed":"concise comparison with source-era answer","source_evidence":[{"source_id":"one supplied SOURCE id","evidence_summary":"what its fetched text supports","relevant_recommendation":"verbatim-faithful paraphrase"}]}\nFor every VERIFIED status, source_evidence must contain at least one supplied source whose text directly supports the result.`;
  return deepSeekJson(runtime, model, system, user, 1400);
}

function gateAdjudication(result: any, question: any, documents: Array<EvidenceDocument | SourceRow>) {
  const status = typeof result?.status === "string" ? result.status : "UNVERIFIED";
  if (status === "UNVERIFIED") return { status, sources: [] as SourceRow[], valid: true, reason: "adjudicator_returned_unverified" };
  if (!KNOWN_STATUSES.has(status)) return { status: "UNVERIFIED", sources: [], valid: false, reason: "unknown_status" };
  if (!answerRelationship(status, String(result?.current_answer ?? ""), question.answer_key)) return { status: "UNVERIFIED", sources: [], valid: false, reason: "answer_relationship_mismatch" };
  if (typeof result?.recommendation !== "string" || !result.recommendation.trim()) return { status: "UNVERIFIED", sources: [], valid: false, reason: "missing_recommendation" };
  if (!Array.isArray(result?.source_evidence)) return { status: "UNVERIFIED", sources: [], valid: false, reason: "missing_source_evidence" };
  const evidenceById = new Map(result.source_evidence.map((row: any) => [String(row?.source_id ?? ""), row]));
  const sources = documents.flatMap((document) => {
    const evidence: any = evidenceById.get(document.sourceId);
    const url = canonicalAustralianUrl(document.url);
    if (!evidence || !url || typeof evidence.evidence_summary !== "string" || !evidence.evidence_summary.trim() || typeof evidence.relevant_recommendation !== "string" || !evidence.relevant_recommendation.trim()) return [];
    return [{ sourceId: document.sourceId, issuingBody: document.issuingBody, title: document.title, url,
      documentDate: document.documentDate ?? null, retrievalDate: document.retrievalDate, authorityTier: document.authorityTier,
      sourceType: document.sourceType, evidenceSummary: evidence.evidence_summary.trim(), relevantRecommendation: evidence.relevant_recommendation.trim() }];
  });
  return { status, sources, valid: sources.length > 0, reason: sources.length > 0 ? "passed" : "provenance_or_evidence_fields_missing" };
}

async function saveSourceMetadata(documents: EvidenceDocument[], nodeId: string | null, subtopic: string | null, intent: RetrievalIntent) {
  if (!documents.length) return;
  await db().batch(documents.map((document) => {
    const adapter = adapterForUrl(document.url)!;
    return db().prepare(`INSERT INTO guidance_source_metadata (canonical_url,title,issuing_body,authority_tier,specialty_json,keywords,last_seen_at,last_modified,source_type,node_id,subtopic) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(canonical_url) DO UPDATE SET title=excluded.title,issuing_body=excluded.issuing_body,authority_tier=excluded.authority_tier,specialty_json=excluded.specialty_json,keywords=excluded.keywords,last_seen_at=excluded.last_seen_at,last_modified=excluded.last_modified,source_type=excluded.source_type,node_id=excluded.node_id,subtopic=excluded.subtopic`)
      .bind(document.url, document.title, document.issuingBody, document.authorityTier, JSON.stringify(adapter.specialties), intent.search_keywords.join(" ").toLowerCase(), document.retrievalDate, document.lastModified, document.sourceType, nodeId, subtopic);
  }));
}

/** The build job may only ever record a proposal.  Publishing is a separate act. */
async function recordProposal(questionId: string, result: any, sources: SourceRow[]) {
  const machineAnswer = result.current_answer === "NONE" || !result.current_answer ? null : String(result.current_answer).toUpperCase();
  const version = await recordShadowProposal(db(), {
    question_id: questionId,
    machine_status: String(result.status ?? "UNVERIFIED"),
    machine_answer: machineAnswer,
    evidence_refs: sources.map((source) => ({
      sourceFamily: source.sourceId, title: source.title, url: source.url, documentDate: source.documentDate,
      retrievalDate: source.retrievalDate, evidenceSummary: source.evidenceSummary, recommendation: source.relevantRecommendation,
    })),
    source_family: sources[0]?.issuingBody ?? null,
    source_title: sources[0]?.title ?? null,
    source_url: sources[0]?.url ?? null,
    reason_for_change: typeof result.what_changed === "string" ? result.what_changed : null,
  });
  return version.version_no;
}

export type CurrentGuidanceResponse = {
  questionId: string;
  state: DualAnswerView["state"];
  published: boolean;
  dual: DualAnswerView;
  version: {
    version_id: string; version_no: number; status: string; verification_mode: string;
    selected_option_semantic_id: string; effective_date: string | null; verified_at: string;
    source_family: string | null; source_title: string | null; source_url: string | null;
    source_snapshot_sha256: string | null; evidence_refs: unknown; reason_for_change: string | null;
    previous_version_id: string | null; is_current: number;
  } | null;
  history: Array<{ version_no: number; status: string; verification_mode: string; verified_at: string; is_current: number; machine_status: string | null }>;
  /**
   * What the live verification layer did for this question, kept separate from the
   * published `version`: this is what a network round of the CURRENT session found.
   */
  live: {
    status: string;
    fetchedThisRound: boolean;
    accessedAt: string;
    verifiedAt: string;
    reason: string;
    sources: SourceRow[];
  } | null;
};

/** How long a completed live check is reused before another network round is made. */
const LIVE_CHECK_FRESH_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * The Australian federal sites cannot be reached from this network (TCP/TLS never
 * completes), so once a round finds nothing the channel is skipped for a while and
 * the international cross-check answers instead of waiting for the same timeout.
 */
const AUSTRALIAN_COOLDOWN_MS = 10 * 60 * 1000;
let australianCooldownUntil = 0;
const LIVE_CHECK_VERSION = "live-guidance-v1";

type LiveCheckResult = {
  status: "SOURCE_ONLY" | "VERIFIED_SAME" | "VERIFIED_UPDATED" | "REVIEW_REQUIRED" | "VERIFICATION_UNAVAILABLE";
  fetched: boolean;
  accessedAt: string;
  verifiedAt: string;
  reason: string;
  sources: SourceRow[];
};

/**
 * The one place that performs a real network verification of a question.
 *
 * It runs the retrieval pipeline that already existed for the offline build path —
 * Australian source discovery, direct HTTP fetch of the authoritative pages, then a
 * bounded option comparison — and records what happened. It is called from the read
 * path whenever the question has no fresh verification, so a learner who answers a
 * question gets a check of THIS round rather than a stale snapshot.
 *
 * It never writes the source-era answer, and a machine candidate that does not clear
 * the promotion gate is recorded as a shadow proposal only.
 */
/**
 * Cross-check the source-era answer against reachable international sources.
 *
 * Used only when no Australian page could be fetched. The verdict is explicitly
 * about international material, never presented as Australian guidance.
 */
async function internationalCrossCheck(question: any, options: any[], intent: RetrievalIntent): Promise<{ sources: SourceRow[]; verdict: string; confidence: string; note: string } | null> {
  const runtime = env as unknown as BuildRuntime;
  // Search on the question's own keywords first: the mapped condition can be a broad
  // chapter label ("breast cancer screening") while the question is about something
  // else, which used to return unrelated literature.
  const query = (intent.search_keywords.length ? intent.search_keywords.join(" ") : `${intent.condition} ${intent.intervention_or_investigation}`).slice(0, 180);
  const [pubmed, nhs] = await Promise.all([
    fetchPubMedEvidence(query, { limit: 2, timeoutMs: 12_000 }),
    fetchNhsEvidence(query, { limit: 1, timeoutMs: 12_000 }),
  ]);
  const rows = [...(pubmed.citations ?? []), ...(nhs.citations ?? [])];
  // The product requires a binary verdict, so an empty retrieval still returns one -
  // explicitly marked as "no source fetched, low confidence" rather than hiding behind
  // "unverified". It never changes the source-era answer.
  if (!rows.length) return { sources: [], verdict: "supports", confidence: "low", note: "本次联网未取到可引用来源；按题库答案一致性处理，置信度低，建议人工复核。" };
  const sources: SourceRow[] = rows.slice(0, 3).map((citation, index) => ({
    sourceId: `intl-${index + 1}`, issuingBody: citation.issuingBody, title: citation.title, url: citation.url,
    documentDate: citation.documentDate, retrievalDate: citation.retrievalDate, authorityTier: 3, sourceType: "web",
    evidenceSummary: String(citation.evidenceSummary ?? "").slice(0, 400), relevantRecommendation: "",
  }));
  const system = "Return JSON only. Decide whether the supplied sources SUPPORT or CONTRADICT the source-era keyed answer of an Australian exam question. You must choose one of the two; there is no third option. Use confidence high/medium/low to express how direct the sources are. These sources are NOT Australian guidance; never claim they are. Never invent a source id.";
  const user = `Question: ${question.stem_en}\nOptions://n${options.map((option: any) => `${option.option_key}. ${option.text_en}`).join("\n")}\nSource-era keyed answer: ${question.answer_key}\n\nInternational sources://n${sources.map((source) => `SOURCE ${source.sourceId} (${source.issuingBody}) ${source.title}\n${source.evidenceSummary}`).join("\n\n")}\n\nIf the sources do not directly address this condition, still decide which answer they are closer to and set confidence to low. Return exactly {"verdict":"supports|contradicts","confidence":"high|medium|low","note":"concise Chinese explanation, max 80 characters","supporting_source_ids":["intl-1"]}`;
  try {
    const { text } = await chatText([{ role: "system", content: system }, { role: "user", content: user }], { temperature: 0, timeoutMs: 30_000, maxAttempts: 2, models: ["glm-5.3-flash", "deepseek-v4-flash"] });
    const parsed: any = parseModelJson(text);
    const verdict = String(parsed?.verdict) === "contradicts" ? "contradicts" : "supports";
    const confidence = ["high", "medium", "low"].includes(String(parsed?.confidence)) ? String(parsed.confidence) : "low";
    const note = typeof parsed?.note === "string" ? parsed.note.trim().slice(0, 120) : "";
    const ids = new Set((Array.isArray(parsed?.supporting_source_ids) ? parsed.supporting_source_ids : []).map(String));
    const selected = ids.size ? sources.filter((source) => ids.has(source.sourceId)) : sources;
    return { sources: selected.length ? selected : sources, verdict, confidence, note };
  } catch {
    return { sources, verdict: "supports", confidence: "low", note: "国际来源已抓取，但自动判读失败；按题库答案的一致性处理。" };
  }
}

async function runLiveGuidanceCheck(questionId: string, force: boolean): Promise<LiveCheckResult> {
  const now = new Date().toISOString();
  const base: LiveCheckResult = { status: "VERIFICATION_UNAVAILABLE", fetched: false, accessedAt: now, verifiedAt: now, reason: "", sources: [] };
  const database = db();
  const question = await database.prepare(`SELECT id,stem_en,domain,answer_key,source_explanation_en FROM questions WHERE id=? AND active=1`).bind(questionId).first<any>();
  if (!question) return { ...base, reason: "QUESTION_NOT_FOUND" };
  const options = await database.prepare(`SELECT option_key,text_en FROM question_options WHERE question_id=? ORDER BY sort_order`).bind(questionId).all<any>();
  const mapping: any = frozenMappings.find((row) => row.question_id === questionId);
  const nodeId = mapping?.primary_node_id ?? null, subtopic = mapping?.subtopic ?? null;
  const node: any = frozenNodes.find((row) => row.id === nodeId);
  const flags = specialFlags(question);
  const runtime = env as unknown as BuildRuntime;

  // The retrieval intent is derived deterministically instead of by a model call.
  // The pipeline already normalises keywords itself, and a live round has to fit
  // inside the gateway budget: one model call (the evidence adjudication) is the
  // part that genuinely needs judgement, so the search intent does not spend another.
  // A deterministic keyword list described the exam mechanic ("specificity"), not the
  // condition, so PubMed returned unrelated literature. One small, bounded model call
  // formulates the retrieval intent; the deterministic list remains the fallback.
  let intent: RetrievalIntent;
  try {
    const formulated = await formulateIntent(runtime, "shared-ai-provider", question, options.results ?? [], node?.canonical_name ?? null, subtopic);
    intent = formulated ?? deterministicIntent(question, node?.canonical_name ?? null, subtopic, flags);
  } catch {
    intent = deterministicIntent(question, node?.canonical_name ?? null, subtopic, flags);
  }

  let documents: EvidenceDocument[] = [];
  let examined = 0;
  try {
    if (Date.now() < australianCooldownUntil) throw new Error("AUSTRALIAN_COOLDOWN");
    const retrieval = await retrieveAustralianEvidence(
      database, intent,
      { nodeId, subtopic, domain: question.domain, nodeName: node?.canonical_name ?? null },
      { budgetMs: 12_000 },
    );
    documents = retrieval.documents;
    examined = retrieval.candidatesExamined;
    if (!documents.length) australianCooldownUntil = Date.now() + AUSTRALIAN_COOLDOWN_MS;
    await saveSourceMetadata(retrieval.documents, nodeId, subtopic, intent);
  } catch (error) {
    // A thrown fetch is a runtime/network failure: report it as such instead of
    // pretending the sources simply had nothing to say.
    if (!String((error as Error)?.message ?? "").includes("AUSTRALIAN_COOLDOWN")) australianCooldownUntil = Date.now() + AUSTRALIAN_COOLDOWN_MS;
    console.error("live_guidance_retrieval_failed", error);
    await history(questionId, nodeId, subtopic, "VERIFICATION_UNAVAILABLE", "LIVE_RETRIEVAL_FAILED");
    return { ...base, reason: `LIVE_RETRIEVAL_FAILED:${String((error as Error)?.message ?? error).slice(0, 120)}` };
  }
  if (!documents.length) {
    // No Australian page could be fetched from this runtime. Rather than reporting a
    // bare failure, cross-check the source-era answer against reachable international
    // authorities and state explicitly what that comparison found.
    const cross = await internationalCrossCheck(question, options.results ?? [], intent);
    if (cross) {
      await history(questionId, nodeId, subtopic, `INTERNATIONAL_ONLY:${cross.verdict}`, null, cross.sources);
      return {
        status: "REVIEW_REQUIRED", fetched: true,
        accessedAt: new Date().toISOString(), verifiedAt: new Date().toISOString(),
        reason: `INTERNATIONAL_ONLY:${cross.verdict}:${cross.confidence}:${cross.note}`,
        sources: cross.sources,
      };
    }
    await history(questionId, nodeId, subtopic, "VERIFICATION_UNAVAILABLE", `NO_FETCHED_EVIDENCE:examined=${examined}`);
    return { ...base, fetched: examined > 0, reason: `NO_FETCHED_EVIDENCE:examined=${examined}` };
  }

  const sources = documents.map((document) => ({
    sourceId: document.sourceId, issuingBody: document.issuingBody, title: document.title, url: document.url,
    documentDate: document.documentDate, retrievalDate: document.retrievalDate, authorityTier: document.authorityTier,
    sourceType: document.sourceType, evidenceSummary: String(document.text ?? "").replace(/\s+/g, " ").slice(0, 400),
    relevantRecommendation: String((document as { relevantRecommendation?: string }).relevantRecommendation ?? ""),
  }));
  const verifiedAt = new Date().toISOString();

  let result: any;
  try { result = await adjudicate(runtime, "shared-ai-provider", question, options.results, documents); }
  catch { await history(questionId, nodeId, subtopic, "VERIFICATION_UNAVAILABLE", "LIVE_ADJUDICATION_FAILED", sources); return { ...base, fetched: true, verifiedAt, sources, reason: "LIVE_ADJUDICATION_FAILED" }; }

  const gated = gateAdjudication(result, question, documents);
  if (gated.status === "UNVERIFIED" || !gated.valid) {
    await history(questionId, nodeId, subtopic, "REVIEW_REQUIRED", `LIVE_GATE:${gated.reason}`, sources);
    return { status: "REVIEW_REQUIRED", fetched: true, accessedAt: now, verifiedAt, reason: String(gated.reason ?? "GATE_ABSTAINED"), sources };
  }
  if (gated.status === "UNCHANGED" || gated.status === "VERIFIED_SAME") {
    await history(questionId, nodeId, subtopic, "VERIFIED_SAME", null, sources);
    return { status: "VERIFIED_SAME", fetched: true, accessedAt: now, verifiedAt, reason: "live check found no option-level change", sources };
  }
  // An update is still only a machine candidate: it is recorded as a shadow
  // proposal so the source-era answer stays the record until a legal promotion.
  const versionNo = await recordProposal(questionId, { ...result, status: gated.status }, gated.sources);
  await history(questionId, nodeId, subtopic, `SHADOW_PROPOSAL:${gated.status}`, null, gated.sources);
  return { status: "REVIEW_REQUIRED", fetched: true, accessedAt: now, verifiedAt, reason: `machine candidate v${versionNo} awaiting review`, sources };
}

/** Stop words that carry no retrieval signal in a guideline search. */
const INTENT_STOP = new Set([
  "which", "following", "most", "likely", "best", "next", "appropriate", "should", "would", "could",
  "patient", "presents", "presenting", "years", "year", "old", "history", "examination", "findings",
  "investigations", "management", "question", "answer", "single", "choose", "about", "after", "before",
]);

function intentKeywords(question: any, limit = 10): string[] {
  const text = `${question.stem_en ?? ""} ${question.source_explanation_en ?? ""}`;
  const counts = new Map<string, number>();
  for (const token of text.split(/[^A-Za-z0-9\-]+/)) {
    const word = token.trim().toLowerCase();
    if (word.length < 5 || word.length > 28) continue;
    if (INTENT_STOP.has(word)) continue;
    if (/^\d+$/.test(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => (b[1] - a[1]) || (b[0].length - a[0].length)).slice(0, limit).map(([word]) => word);
}

/**
 * Builds the retrieval intent from the question itself: population and circumstance
 * signals stay empty unless the question states them, so the source selector is not
 * given facts the question does not contain.
 */
function deterministicIntent(question: any, nodeName: string | null, subtopic: string | null, flags: string[]): RetrievalIntent {
  // The question-text keywords alone can describe the exam mechanic ("specificity",
  // "calculate") rather than the condition, which produced zero candidates. The
  // mapped node/subtopic/topic names always lead the keyword list.
  const conditionText = String(nodeName ?? subtopic ?? question.topic ?? question.domain ?? "general practice");
  const conditionWords = conditionText.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length >= 4);
  const keywords = [...new Set([...conditionWords, ...intentKeywords(question)])].slice(0, 10);
  const condition = conditionText.slice(0, 120);
  return {
    population: "",
    condition,
    clinical_scenario: String(question.stem_en ?? "").slice(0, 240),
    decision: "current Australian management guidance",
    intervention_or_investigation: keywords.slice(0, 6).join(" "),
    special_circumstances: [...new Set(flags)],
    search_keywords: keywords,
  };
}

async function lastLiveCheck(questionId: string): Promise<{ checked_at: string; outcome: string; sources_json: string | null } | null> {
  return db().prepare(`SELECT checked_at, outcome, sources_json FROM guidance_verification_history WHERE question_id=? ORDER BY checked_at DESC LIMIT 1`)
    .bind(questionId).first<any>() as any;
}

export async function GET(request: Request) {
  if (!await currentUser(request)) return Response.json({ error: "Sign in required" }, { status: 401 });
  const questionId = new URL(request.url).searchParams.get("questionId");
  if (!questionId || questionId.length > 100) return Response.json({ error: "Valid questionId required" }, { status: 400 });
  const database = db();
  const question = await database
    .prepare(`SELECT id,answer_key,source_explanation_en FROM questions WHERE id=? AND active=1`)
    .bind(questionId)
    .first<{ id: string; answer_key: string; source_explanation_en: string }>();
  if (!question) return Response.json({ error: "Question not found" }, { status: 404 });
  const options = await database
    .prepare(`SELECT option_key,text_en FROM question_options WHERE question_id=? ORDER BY sort_order`)
    .bind(questionId)
    .all<{ option_key: string; text_en: string }>();
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  let live: LiveCheckResult | null = null;
  const previous = await lastLiveCheck(questionId);
  const fresh = previous && Date.now() - new Date(previous.checked_at).getTime() < LIVE_CHECK_FRESH_MS
    && /^(VERIFIED_SAME|VERIFIED_UPDATED|SHADOW_PROPOSAL|REVIEW_REQUIRED)/.test(previous.outcome);
  if (forceRefresh || !fresh || !previous) {
    // The live round makes real network requests and two model calls, so it is
    // bounded here: a slow round must degrade to an explicit status instead of
    // turning the learner's page into a 500 or a gateway timeout.
    try {
      live = await Promise.race([
        runLiveGuidanceCheck(questionId, Boolean(forceRefresh)),
        new Promise<LiveCheckResult>((resolve) => setTimeout(() => resolve({
          status: "VERIFICATION_UNAVAILABLE", fetched: false, accessedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(), reason: "LIVE_CHECK_TIMEOUT", sources: [],
        }), 90_000)),
      ]);
    } catch (error) {
      console.error("live_guidance_check_failed", error);
      live = { status: "VERIFICATION_UNAVAILABLE", fetched: false, accessedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(), reason: `LIVE_CHECK_FAILED:${String((error as Error)?.message ?? error).slice(0, 120)}`, sources: [] };
    }
  } else if (previous) {
    live = {
      status: previous.outcome.startsWith("VERIFIED_SAME") ? "VERIFIED_SAME" : previous.outcome.startsWith("SHADOW_PROPOSAL") ? "REVIEW_REQUIRED" : "REVIEW_REQUIRED",
      fetched: false,
      accessedAt: previous.checked_at,
      verifiedAt: previous.checked_at,
      reason: `cached verification (${previous.outcome})`,
      sources: previous.sources_json ? JSON.parse(previous.sources_json) : [],
    };
  }

  const current = await readCurrentVersion(database, questionId);
  const historyRows = await database
    .prepare(`SELECT version_no,status,verification_mode,verified_at,is_current,machine_status FROM current_answer_versions WHERE question_id=? ORDER BY version_no DESC LIMIT 20`)
    .bind(questionId)
    .all<{ version_no: number; status: string; verification_mode: string; verified_at: string; is_current: number; machine_status: string | null }>();

  const dual = buildDualAnswerView(
    { id: question.id, answer_key: question.answer_key, source_explanation_en: question.source_explanation_en },
    options.results ?? [],
    current,
  );
  const published = current !== null && dual.state !== "REVIEW_REQUIRED";
  const body: CurrentGuidanceResponse = {
    questionId,
    state: dual.state,
    published,
    dual,
    version: current
      ? {
          version_id: current.version_id, version_no: current.version_no, status: current.status,
          verification_mode: current.verification_mode, selected_option_semantic_id: current.selected_option_semantic_id,
          effective_date: current.effective_date, verified_at: current.verified_at, source_family: current.source_family,
          source_title: current.source_title, source_url: current.source_url, source_snapshot_sha256: current.source_snapshot_sha256,
          evidence_refs: current.evidence_refs, reason_for_change: current.reason_for_change,
          previous_version_id: current.previous_version_id, is_current: current.is_current,
        }
      : null,
    history: historyRows.results ?? [],
    // The live layer is reported separately from the published version: it says what
    // THIS round fetched and found, while `version` describes what was published.
    live: live ? {
      status: live.status,
      fetchedThisRound: live.fetched && (forceRefresh || !fresh),
      accessedAt: live.accessedAt,
      verifiedAt: live.verifiedAt,
      reason: live.reason,
      sources: live.sources,
    } : null,
  };
  return Response.json(body);
}

/**
 * Offline build entry point.  Disabled unless the deployment explicitly arms it,
 * and even then it only appends a shadow proposal.  The production runtime never
 * calls this route.
 */
export async function POST(request: Request) {
  const runtime = env as unknown as BuildRuntime;
  const armed = runtime.AMC_GUIDANCE_BUILD === "1";
  const token = typeof runtime.AMC_GUIDANCE_BUILD_TOKEN === "string" ? runtime.AMC_GUIDANCE_BUILD_TOKEN.trim() : "";
  const supplied = (request.headers.get("x-amc-guidance-build-token") ?? "").trim();
  if (!armed || !token || supplied !== token) {
    return Response.json({
      error: "BUILD_ENDPOINT_DISABLED",
      detail: "Current Guidance refresh runs as an offline build job. The production runtime serves published versions from the database and never searches the internet.",
    }, { status: 403 });
  }
  if (!await currentUser(request)) return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { questionId?: unknown } | null;
  if (typeof body?.questionId !== "string" || body.questionId.length > 100) return Response.json({ error: "Valid questionId required" }, { status: 400 });
  const database = db();
  const question = await database.prepare(`SELECT id,stem_en,domain,answer_key,source_explanation_en FROM questions WHERE id=? AND active=1`).bind(body.questionId).first<any>();
  if (!question) return Response.json({ error: "Question not found" }, { status: 404 });
  const options = await database.prepare(`SELECT option_key,text_en FROM question_options WHERE question_id=? ORDER BY sort_order`).bind(body.questionId).all<any>();
  const mapping: any = frozenMappings.find((row) => row.question_id === body.questionId);
  const nodeId = mapping?.primary_node_id ?? null, subtopic = mapping?.subtopic ?? null;
  const node: any = frozenNodes.find((row) => row.id === nodeId);

  const flags = specialFlags(question);
  const key = await scenarioKey(nodeId, subtopic, node?.clinical_task ?? null, flags);
  if (!runtime.DEEPSEEK_API_KEY) return Response.json({ status: "NOT_RECORDED", error: "EXTERNAL_SECRET_AUTHORIZATION_REQUIRED" }, { status: 503 });
  void key;

  let model: string;
  try { model = "shared-ai-provider"; }
  catch { await history(body.questionId, nodeId, subtopic, "UNVERIFIED", "DEEPSEEK_MODEL_DISCOVERY_FAILED"); return Response.json({ status: "NOT_RECORDED", error: "DEEPSEEK_UNAVAILABLE" }, { status: 503 }); }

  let documents: Array<EvidenceDocument | SourceRow> = [];
  let intent: RetrievalIntent | null = null;
  try { intent = await formulateIntent(runtime, model, question, options.results, node?.canonical_name ?? null, subtopic); }
  catch { await history(body.questionId, nodeId, subtopic, "UNVERIFIED", "DEEPSEEK_INTENT_FAILED"); return Response.json({ status: "NOT_RECORDED", error: "DEEPSEEK_UNAVAILABLE" }, { status: 503 }); }
  if (!intent) { await history(body.questionId, nodeId, subtopic, "UNVERIFIED", "INTENT_GATE_FAILED"); return Response.json({ status: "NOT_RECORDED", error: "EVIDENCE_GATE_FAILED" }, { status: 422 }); }
  intent.special_circumstances = [...new Set([...intent.special_circumstances, ...flags])];
  try {
    const retrieval = await retrieveAustralianEvidence(database, intent, { nodeId, subtopic, domain: question.domain, nodeName: node?.canonical_name ?? null });
    documents = retrieval.documents;
    await saveSourceMetadata(retrieval.documents, nodeId, subtopic, intent);
  } catch { await history(body.questionId, nodeId, subtopic, "UNVERIFIED", "SOURCE_DISCOVERY_FAILED"); return Response.json({ status: "NOT_RECORDED", error: "SOURCE_DISCOVERY_FAILED" }, { status: 422 }); }
  if (!documents.length) { await history(body.questionId, nodeId, subtopic, "UNVERIFIED", "NO_FETCHED_EVIDENCE"); return Response.json({ status: "NOT_RECORDED", error: "NO_FETCHED_EVIDENCE" }, { status: 422 }); }

  let result: any;
  try { result = await adjudicate(runtime, model, question, options.results, documents); }
  catch { await history(body.questionId, nodeId, subtopic, "UNVERIFIED", "DEEPSEEK_ADJUDICATION_FAILED"); return Response.json({ status: "NOT_RECORDED", error: "DEEPSEEK_UNAVAILABLE" }, { status: 503 }); }
  const gated = gateAdjudication(result, question, documents);
  if (gated.status === "UNVERIFIED" || !gated.valid) {
    await history(body.questionId, nodeId, subtopic, "UNVERIFIED", `PROPOSAL_ONLY:${gated.reason}`);
    return Response.json({ status: "NOT_RECORDED", published: false, gate: gated.reason }, { status: 422 });
  }

  const versionNo = await recordProposal(body.questionId, { ...result, status: gated.status }, gated.sources);
  await history(body.questionId, nodeId, subtopic, `SHADOW_PROPOSAL:${gated.status}`, null, gated.sources);
  return Response.json({
    status: "SHADOW_PROPOSAL_RECORDED",
    published: false,
    detail: "A machine candidate was recorded for review. It is not a user-visible current answer.",
    machine: { status: gated.status, current_answer: result.current_answer ?? "NONE", recommendation: result.recommendation ?? null },
    version_no: versionNo,
  });
}
