import { db, ensureUser, currentUser, seedPilot} from "../_shared";
import { env } from "cloudflare:workers";
import frozenMappings from "@/lib/topic-mappings.json";
import frozenNodes from "@/lib/topic-nodes.json";
import graphReport from "@/lib/topic-graph-report.json";
import { applyV12DataHygiene, ensureHistoricalConceptFsrs, ensureOpenKnowledgeCatalog } from "@/lib/open-knowledge";
import { LEAKED_ANSWER_IN_OPTIONS_IDS, MISSING_REQUIRED_SOURCE_VISUAL_IDS, practiceExclusionStatus } from "@/lib/visual-integrity";
import { practiceReasonSql } from "@/lib/practiceability";
import { buildDualAnswerView, versionFromRow } from "@/lib/current-answer";
import { flagOverridesFromEnv, readFeatureFlags } from "@/lib/feature-flags";

type Scope = "critical" | "deferred" | "user" | "full";

function requestedScope(request: Request): Scope {
  const value = new URL(request.url).searchParams.get("scope");
  return value === "critical" || value === "deferred" || value === "user" ? value : "full";
}

const empty = () => Promise.resolve({ results: [] as any[] });

/**
 * A question source is a first-class scope.  A record with no explicit provider
 * belongs to the original AMC corpus; anything else is addressed by its own key
 * so the two can never be blended by accident.
 */
const EMIDICI_PROVIDER = "Emidici";
function sourceScopeKey(provider: string | null | undefined): string {
  return provider === EMIDICI_PROVIDER ? "emidici" : provider ? String(provider).toLowerCase() : "legacy";
}

/**
 * Boot is deliberately split into two phases.
 *
 *   critical  — the app shell plus everything the current practice question needs.
 *               This is the only request on the first-paint path.
 *   deferred  — Question Map totals, Knowledge Graph, canonical chapter mapping,
 *               chapter bodies and analytics, loaded after the first paint.
 *
 * Translation, chapter bodies, AI Coach output and non-current question images are
 * never on the critical path; per-question source text is fetched lazily.
 */
export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in with ChatGPT is required." }, { status: 401 });
  const scope = requestedScope(request);
  try {
    const userId = await ensureUser(user);
    const database = db();
    // critical = corpus + user state, user = user state only, deferred = analytics.
    // `critical` used to carry the whole 6 208-question corpus (10.05 MiB decoded,
    // 37 248 JSON objects) on the first paint, which is what made the page take ~12 s
    // to become interactive.  It now carries a compact INDEX only — identity and the
    // small filter fields — while the heavy payload moved to its own lazily requested
    // `corpus` scope, and per-question bodies come from /api/question-detail.
    const wantCorpus = scope === "critical" || scope === "corpus" || scope === "full";
    const wantHeavy = scope === "corpus" || scope === "full";
    const wantUser = scope !== "deferred";
    const wantDeferred = scope === "deferred" || scope === "full";

    if (wantCorpus) {
      await seedPilot();
      await ensureOpenKnowledgeCatalog(database);
      await applyV12DataHygiene(database, userId);
      await ensureHistoricalConceptFsrs(database, userId);
    }

    const [questions, options, activeIdRows, attempts, legacyReviews, vocabulary, coaches, sources, bankStats, evidenceCache, notes, position, recoveries, currentVersions] = await Promise.all([
      wantHeavy
        ? database.prepare(`SELECT id,domain,topic,clinical_task,stem_en,stem_zh,answer_key,image_ref,current_answer,current_answer_status,current_evidence_json,source_provider
            FROM questions WHERE active=1 ORDER BY domain, topic, id`).all()
        : wantCorpus
          ? database.prepare(`SELECT id,domain,topic,clinical_task,answer_key,source_provider
              FROM questions WHERE active=1 ORDER BY domain, topic, id`).all()
          : empty(),
      wantHeavy
        ? database.prepare(`SELECT id,question_id,option_key,text_en,text_zh FROM question_options ORDER BY question_id, sort_order`).all()
        : empty(),
      database.prepare(`SELECT id FROM questions WHERE active=1`).all(),
      wantUser ? database.prepare(`SELECT * FROM attempts WHERE user_id=? ORDER BY attempted_at DESC`).bind(userId).all() : empty(),
      wantUser ? database.prepare(`SELECT * FROM review_state WHERE user_id=? ORDER BY priority DESC, due_at`).bind(userId).all() : empty(),
      wantUser ? database.prepare(`SELECT * FROM vocabulary WHERE user_id=? ORDER BY due_at, created_at DESC`).bind(userId).all() : empty(),
      wantUser ? database.prepare(`SELECT question_id,evidence_status,result_json,source_list_json,searched_at FROM coach_runs WHERE user_id='system' AND cache_key LIKE 'amc-coach-v2:%' ORDER BY created_at DESC`).all() : empty(),
      wantUser ? database.prepare(`SELECT * FROM sources ORDER BY name`).all() : empty(),
      wantUser ? database.prepare(`SELECT count(*) AS canonical_count,
          sum(CASE WHEN active_quiz=1 THEN 1 ELSE 0 END) AS active_count,
          sum(CASE WHEN active_quiz=0 THEN 1 ELSE 0 END) AS excluded_count,
          sum(CASE WHEN visual_asset IS NOT NULL THEN 1 ELSE 0 END) AS visual_count,
          sum(CASE WHEN options_mode='source_page_image' THEN 1 ELSE 0 END) AS image_mode_count,
          sum(CASE WHEN current_answer_status='needs_verification' THEN 1 ELSE 0 END) AS needs_verification_count
          FROM canonical_records WHERE import_version='v2.9.4'`).first() : Promise.resolve(null),
      wantUser ? database.prepare(`SELECT question_id,node_id,subtopic,status,current_answer,recommendation,what_changed,sources_json,verified_at,stale_after FROM guidance_evidence_cache`).all() : empty(),
      wantUser ? database.prepare(`SELECT * FROM study_notes WHERE user_id=? ORDER BY updated_at DESC`).bind(userId).all() : empty(),
      wantUser ? database.prepare(`SELECT question_id,practice_scope,updated_at FROM practice_position WHERE user_id=? ORDER BY practice_scope`).bind(userId).all() : empty(),
      wantCorpus ? database.prepare(`SELECT record_id,source_pdf,source_page,answer_pattern,match_method,candidate_match_count,recovery_version
        FROM source_answer_recovery WHERE status='CONFIRMED'`).all() : empty(),
      // Only the single published version per question is exposed.  Shadow
      // proposals live in the same append-only table but are never current, so
      // they cannot reach the UI through this query.
      wantCorpus ? database.prepare(`SELECT * FROM current_answer_versions WHERE is_current=1`).all() : empty(),
    ]);

    const analysis = wantDeferred
      ? await Promise.all([
        database.prepare(`SELECT record_id,substr(stem,1,140) AS stem,domain,active_quiz,source_provider,(${practiceReasonSql()}) AS practice_reason FROM canonical_records ORDER BY record_id`).all(),
        database.prepare(`SELECT source_provider,(${practiceReasonSql()}) AS reason, count(*) AS count FROM canonical_records GROUP BY 1,2`).all(),
        database.prepare(`SELECT c.source_provider,
          sum(CASE WHEN m.primary_chapter_id IS NULL THEN 1 ELSE 0 END) AS unmapped_total,
          sum(CASE WHEN m.primary_chapter_id IS NULL AND (${practiceReasonSql("c")}) IS NULL THEN 1 ELSE 0 END) AS unmapped_practiceable
          FROM canonical_records c LEFT JOIN canonical_question_learning_map m ON m.record_id=c.record_id GROUP BY 1`).all(),
        database.prepare(`SELECT * FROM knowledge_nodes ORDER BY canonical_name`).all(),
        database.prepare(`SELECT * FROM question_node_links`).all(),
        database.prepare(`SELECT * FROM knowledge_chapters ORDER BY title`).all(),
        database.prepare(`SELECT * FROM question_concept_map ORDER BY question_id`).all(),
        database.prepare(`SELECT * FROM concept_fsrs_state WHERE user_id=? ORDER BY priority DESC,due_at`).bind(userId).all(),
        database.prepare(`SELECT record_id,primary_chapter_id,mapping_status FROM canonical_question_learning_map ORDER BY record_id`).all(),
        database.prepare(`SELECT id,title,status FROM canonical_chapters ORDER BY title`).all(),
        database.prepare(`SELECT status, count(*) AS count FROM source_answer_recovery GROUP BY 1`).all(),
        database.prepare(`SELECT source_pdf, count(*) AS count FROM source_answer_recovery WHERE status='CONFIRMED' GROUP BY 1 ORDER BY count DESC`).all(),
      ])
      : null;

    // Practiceability of the observable practice rotation.  The 14 isolated
    // protected records stay excluded from active practice and from the payload.
    const safeIds = activeIdRows.results.filter((row: any) => !practiceExclusionStatus(row.id)).map((row: any) => row.id);
    const activeIdSet = new Set(safeIds);

    const payload: Record<string, any> = { scope, user };
    // Feature flags travel with the boot payload so the client can honour a
    // kill switch without a second request.  Turning one off only hides that
    // surface; questions, submit, source answers, attempts, progress and review
    // are never gated by a flag.
    payload.flags = await readFeatureFlags(database, flagOverridesFromEnv(env as unknown as Record<string, unknown>));
    if (wantCorpus) {
      const safeQuestions = questions.results.filter((q: any) => activeIdSet.has(q.id));
      payload.questions = safeQuestions;
      payload.options = wantHeavy
        ? options.results
            .filter((row: any) => activeIdSet.has(row.question_id))
            .map((row: any) => ({ id: row.id, question_id: row.question_id, option_key: row.option_key, text_en: row.text_en, ...(row.text_zh ? { text_zh: row.text_zh } : {}) }))
        : [];
      payload.attempts = attempts.results;
      payload.reviews = legacyReviews.results;
      payload.vocabulary = vocabulary.results;
      payload.coaches = coaches.results;
      payload.evidenceCache = evidenceCache.results;
      // Dual-answer view for every question that has a published current answer.
      // Questions without one simply get no entry, which the UI renders as
      // REVIEW REQUIRED — never as an asserted current answer.
      const publishedRows = (currentVersions.results ?? []) as any[];
      if (publishedRows.length) {
        const questionById = new Map<string, any>((questions.results as any[]).map((row: any) => [row.id, row]));
        const optionsByQuestionId = new Map<string, any[]>();
        for (const row of (wantHeavy ? (options.results as any[]) : []) as any[]) {
          const option = { option_key: row.option_key, text_en: row.text_en };
          const list = optionsByQuestionId.get(row.question_id);
          if (list) list.push(option); else optionsByQuestionId.set(row.question_id, [option]);
        }
        payload.currentGuidance = publishedRows.flatMap((row: any) => {
          const question = questionById.get(row.question_id);
          if (!question) return [];
          return [buildDualAnswerView(
            { id: question.id, answer_key: question.answer_key, source_explanation_en: question.source_explanation_en },
            optionsByQuestionId.get(row.question_id) ?? [],
            versionFromRow(row),
          )];
        });
      } else {
        payload.currentGuidance = [];
      }
      payload.sources = sources.results;
      payload.notes = notes.results;
      // One cursor per practice scope.  The all-sources cursor is also exposed
      // under its legacy key so an existing session resumes unchanged.
      const positions: Record<string, { questionId: string; practiceScope: string; updatedAt: string }> = {};
      for (const row of (position.results ?? []) as any[]) {
        positions[row.practice_scope] = {
          questionId: row.question_id, practiceScope: row.practice_scope, updatedAt: row.updated_at,
        };
      }
      payload.practicePositions = positions;
      payload.practicePosition = positions.all ?? null;
      payload.bankStats = bankStats ? {
        ...bankStats,
        active_count: Number((bankStats as any)?.active_count ?? 0) - (questions.results.length - safeQuestions.length),
        excluded_count: Number((bankStats as any)?.excluded_count ?? 0) + (questions.results.length - safeQuestions.length),
        missing_required_visual_count: MISSING_REQUIRED_SOURCE_VISUAL_IDS.size,
        unsafe_option_count: LEAKED_ANSWER_IN_OPTIONS_IDS.size,
      } : null;
      // Traceability only: which of the questions on screen carry a source-era
      // answer that was recovered from a local answer export.
      const recoveryByRecord = new Map((recoveries.results as any[]).map((row: any) => [row.record_id, row]));
      payload.recoveries = safeQuestions
        .filter((question: any) => recoveryByRecord.has(question.id))
        .map((question: any) => {
          const row: any = recoveryByRecord.get(question.id);
          return { record_id: row.record_id, source_pdf: row.source_pdf, source_page: row.source_page,
            answer_pattern: row.answer_pattern, match_method: row.match_method,
            candidate_match_count: row.candidate_match_count, recovered: true };
        });
      payload.protectedPracticeIsolation = {
        missingRequiredVisual: MISSING_REQUIRED_SOURCE_VISUAL_IDS.size,
        leakedAnswerInOptions: LEAKED_ANSWER_IN_OPTIONS_IDS.size,
        excludedFromRotation: questions.results.length - safeQuestions.length,
      };
    }
    if (analysis) {
      const [canonicalIndex, reasonBreakdown, unmapped, legacyNodes, legacyLinks, chapters, conceptMappings, conceptReviews, canonicalLearningMappings, canonicalChapters, recoveryStatusRows, recoveryPdfRows] = analysis;
      const mappings = frozenMappings;
      const mapped = mappings.filter((m) => m.primary_node_id);
      const used = new Set(mapped.flatMap((m) => [m.primary_node_id, ...m.secondary_node_ids]));
      const nodes = frozenNodes.filter((node) => used.has(node.id)).map((node) => ({
        ...node, subtopics: [...new Set(mapped.filter((m) => m.primary_node_id === node.id).map((m) => m.subtopic).filter(Boolean))],
      }));
      const topicLinks = mappings.flatMap((m) => [
        ...(m.primary_node_id ? [{ question_id: m.question_id, node_id: m.primary_node_id, relation_type: "primary", weight: 1, mapping_status: m.mapping_status }] : []),
        ...m.secondary_node_ids.map((id) => ({ question_id: m.question_id, node_id: id, relation_type: "secondary", weight: .5 })),
      ]);
      const topicLinkedIds = new Set(topicLinks.filter((link) => activeIdSet.has(link.question_id)).map((link) => link.question_id));

      const bySource: Record<string, { total: number; unpracticeable: number; reasons: Record<string, number> }> = {};
      for (const row of reasonBreakdown.results as any[]) {
        const count = Number(row.count ?? 0);
        const key = sourceScopeKey(row.source_provider);
        const bucket = (bySource[key] ??= { total: 0, unpracticeable: 0, reasons: {} });
        bucket.total += count;
        if (row.reason) {
          bucket.reasons[row.reason] = (bucket.reasons[row.reason] ?? 0) + count;
          bucket.unpracticeable += count;
        }
      }
      const unmappedBySource: Record<string, { unmappedChapter: number; unmappedButPracticeable: number }> = {};
      for (const row of (unmapped.results ?? []) as any[]) {
        unmappedBySource[sourceScopeKey(row.source_provider)] = {
          unmappedChapter: Number(row.unmapped_total ?? 0),
          unmappedButPracticeable: Number(row.unmapped_practiceable ?? 0),
        };
      }
      const summariseSource = (key: string) => {
        const bucket = bySource[key] ?? { total: 0, unpracticeable: 0, reasons: {} };
        const gaps = unmappedBySource[key] ?? { unmappedChapter: 0, unmappedButPracticeable: 0 };
        return {
          total: bucket.total,
          practiceable: bucket.total - bucket.unpracticeable,
          unpracticeable: bucket.unpracticeable,
          reasons: bucket.reasons,
          ...gaps,
        };
      };

      payload.canonicalIndex = canonicalIndex.results.map((row: any) => ({
        record_id: row.record_id, stem: row.stem, domain: row.domain,
        sourceScope: sourceScopeKey(row.source_provider),
        // practiceability and canonicalChapterId are separate, independent facts
        practiceable: !row.practice_reason,
        practiceReason: row.practice_reason ?? null,
        visualIntegrityStatus: practiceExclusionStatus(row.record_id),
      }));
      payload.nodes = nodes;
      payload.links = topicLinks;
      payload.chapters = chapters.results;
      payload.conceptMappings = conceptMappings.results;
      payload.conceptReviews = conceptReviews.results;
      payload.canonicalLearningMappings = canonicalLearningMappings.results;
      payload.canonicalChapters = canonicalChapters.results;
      payload.practiceability = summariseSource("legacy");
      const combine = (keys: string[]) => {
        const totals = { total: 0, practiceable: 0, unpracticeable: 0, reasons: {} as Record<string, number>, unmappedChapter: 0, unmappedButPracticeable: 0 };
        for (const key of keys) {
          const part = summariseSource(key);
          totals.total += part.total;
          totals.practiceable += part.practiceable;
          totals.unpracticeable += part.unpracticeable;
          totals.unmappedChapter += part.unmappedChapter;
          totals.unmappedButPracticeable += part.unmappedButPracticeable;
          for (const [reason, count] of Object.entries(part.reasons)) totals.reasons[reason] = (totals.reasons[reason] ?? 0) + count;
        }
        return totals;
      };
      const allSources = combine(["legacy", "emidici"]);
      payload.practiceability = allSources;
      payload.sourcePracticeability = { all: allSources, legacy: summariseSource("legacy"), emidici: summariseSource("emidici") };
      const recoveryStatus: Record<string, number> = {};
      for (const row of recoveryStatusRows.results as any[]) recoveryStatus[row.status] = Number(row.count ?? 0);
      payload.recovery = {
        status: recoveryStatus,
        confirmed: recoveryStatus.CONFIRMED ?? 0,
        reviewRequired: recoveryStatus.REVIEW_REQUIRED ?? 0,
        noSourceAnswerAvailable: recoveryStatus.NO_SOURCE_ANSWER_AVAILABLE ?? 0,
        bySourcePdf: (recoveryPdfRows.results as any[]).map((row: any) => ({ pdf: row.source_pdf, confirmed: Number(row.count ?? 0) })),
      };
      payload.graph = {
        ...graphReport, canonical: mappings.length, mapped: mapped.length, unmapped: mappings.length - mapped.length,
        activeMapped: topicLinkedIds.size, active: activeIdSet.size,
        unresolvedIds: mappings.filter((m) => !m.primary_node_id).map((m) => m.question_id),
        stableNodeIds: true, aliasMerge: true,
        legacyNodes: legacyNodes.results.length, legacyLinks: legacyLinks.results.length, legacyReviews: legacyReviews.results.length,
      };
    }
    return Response.json(payload);
  } catch (error) {
    console.error("bootstrap_failed", error);
    return Response.json({ error: "Study data is temporarily unavailable. Your learning records have not been changed." }, { status: 503 });
  }
}
