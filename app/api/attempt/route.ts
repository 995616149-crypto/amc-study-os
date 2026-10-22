import { z } from "zod";
import { db, ensureUser, currentUser} from "../_shared";
import { ratingFor, scheduleFsrs, type FsrsCard } from "@/lib/fsrs";
import { practiceExclusionStatus } from "@/lib/visual-integrity";

const Attempt = z.object({ questionId: z.string().min(1), selectedAnswer: z.enum(["A","B","C","D","E"]), confidence: z.enum(["confident","uncertain","guess"]), elapsedMs: z.number().int().min(0).max(3_600_000), sessionId: z.string().min(1).max(100), clientAttemptId: z.string().uuid().optional() });

function cardFromRow(row: any): FsrsCard | null {
  if (!row) return null;
  return { dueAt: row.due_at, stability: row.stability, difficulty: row.difficulty, lastReviewedAt: row.last_reviewed_at, scheduledDays: row.scheduled_days, reps: row.reps, lapses: row.lapses, state: row.state, lastRating: row.last_rating, priority: row.priority };
}

export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const parsed = Attempt.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid attempt" }, { status: 400 });
  if (practiceExclusionStatus(parsed.data.questionId)) return Response.json({ error: "Question temporarily excluded from active practice pending source integrity repair" }, { status: 409 });
  try {
    const database = db();
    const userId = await ensureUser(user);
    const answer = await database.prepare(`SELECT answer_key FROM questions WHERE id=? AND active=1`).bind(parsed.data.questionId).first<{answer_key:string}>();
    if (!answer) return Response.json({ error: "Question not found" }, { status: 404 });
    const mapping = await database.prepare(`SELECT chapter_id,section_id,tested_concept_id,tested_concept_label,clinical_task,error_domain FROM question_concept_map WHERE question_id=?`).bind(parsed.data.questionId).first<any>();
    const correct = answer.answer_key === parsed.data.selectedAnswer;
    const rating = ratingFor(correct, parsed.data.confidence);
    const evidenceType = correct ? (parsed.data.confidence === "confident" ? "strong-positive" : parsed.data.confidence === "guess" ? "hidden-weakness" : "uncertain-correct") : (parsed.data.confidence === "confident" ? "misconception" : parsed.data.confidence === "guess" ? "knowledge-gap" : "clear-gap");
    const score = [0, -1.35, .15, .55, 1][rating];
    const now = new Date();
    const attemptedAt = now.toISOString();
    const attemptId = parsed.data.clientAttemptId ?? crypto.randomUUID();
    const existing = await database.prepare(`SELECT id,correct,error_type FROM attempts WHERE id=? AND user_id=?`).bind(attemptId,userId).first<any>();
    if (existing) return Response.json({ ok: true, attemptId, correct: !!existing.correct, answerKey: answer.answer_key, evidenceType: existing.error_type ?? evidenceType, replay: true,
      mapping: mapping ? { questionId: parsed.data.questionId, chapterId: mapping.chapter_id, sectionId: mapping.section_id, testedConceptId: mapping.tested_concept_id, testedConceptLabel: mapping.tested_concept_label, clinicalTask: mapping.clinical_task, errorDomain: mapping.error_domain } : null, fsrs: null });
    const nodes = await database.prepare(`SELECT node_id FROM question_node_links WHERE question_id=?`).bind(parsed.data.questionId).all<{node_id:string}>();
    let fsrs: FsrsCard | null = null;
    if (mapping) {
      const previous = await database.prepare(`SELECT * FROM concept_fsrs_state WHERE user_id=? AND tested_concept_id=?`).bind(userId,mapping.tested_concept_id).first<any>();
      fsrs = scheduleFsrs(cardFromRow(previous), rating, now);
    }
    const statements: D1PreparedStatement[] = [database.prepare(`INSERT INTO attempts (id,user_id,question_id,selected_answer,correct,confidence,elapsed_ms,attempted_at,session_id,error_type,chapter_id,section_id,tested_concept_id,error_domain) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(attemptId,userId,parsed.data.questionId,parsed.data.selectedAnswer,correct?1:0,parsed.data.confidence,parsed.data.elapsedMs,attemptedAt,parsed.data.sessionId,correct?null:evidenceType,mapping?.chapter_id??null,mapping?.section_id??null,mapping?.tested_concept_id??null,mapping?.error_domain??null)];
    if (mapping && fsrs) statements.push(database.prepare(`INSERT INTO concept_fsrs_state (user_id,tested_concept_id,chapter_id,section_id,due_at,stability,difficulty,last_reviewed_at,scheduled_days,reps,lapses,state,last_rating,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(user_id,tested_concept_id) DO UPDATE SET chapter_id=excluded.chapter_id,section_id=excluded.section_id,due_at=excluded.due_at,stability=excluded.stability,difficulty=excluded.difficulty,last_reviewed_at=excluded.last_reviewed_at,scheduled_days=excluded.scheduled_days,reps=excluded.reps,lapses=excluded.lapses,state=excluded.state,last_rating=excluded.last_rating,priority=excluded.priority`)
      .bind(userId,mapping.tested_concept_id,mapping.chapter_id,mapping.section_id,fsrs.dueAt,fsrs.stability,fsrs.difficulty,fsrs.lastReviewedAt,fsrs.scheduledDays,fsrs.reps,fsrs.lapses,fsrs.state,fsrs.lastRating,fsrs.priority));
    for (const node of nodes.results) {
      statements.push(database.prepare(`INSERT INTO node_evidence (id,user_id,node_id,question_id,attempt_id,evidence_score,evidence_type,created_at) VALUES (?,?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(),userId,node.node_id,parsed.data.questionId,attemptId,score,evidenceType,attemptedAt));
      if (fsrs) statements.push(database.prepare(`INSERT INTO review_state (user_id,node_id,due_at,stability,difficulty,interval_days,last_reviewed_at,lapse_count,priority) VALUES (?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id,node_id) DO UPDATE SET due_at=excluded.due_at,stability=excluded.stability,difficulty=excluded.difficulty,interval_days=excluded.interval_days,last_reviewed_at=excluded.last_reviewed_at,lapse_count=excluded.lapse_count,priority=excluded.priority`)
        .bind(userId,node.node_id,fsrs.dueAt,fsrs.stability,fsrs.difficulty,Math.max(0,Math.round(fsrs.scheduledDays)),attemptedAt,fsrs.lapses,fsrs.priority));
    }
    await database.batch(statements);
    return Response.json({ ok: true, attemptId, correct, answerKey: answer.answer_key, evidenceType, mapping: mapping ? { questionId: parsed.data.questionId, chapterId: mapping.chapter_id, sectionId: mapping.section_id, testedConceptId: mapping.tested_concept_id, testedConceptLabel: mapping.tested_concept_label, clinicalTask: mapping.clinical_task, errorDomain: mapping.error_domain } : null, fsrs });
  } catch (error) {
    console.error("attempt_failed", error);
    return Response.json({ error: "Your answer could not be saved. Please retry; no partial result was recorded." }, { status: 503 });
  }
}
