import { env } from "cloudflare:workers";
import { z } from "zod";
import { db, ensureUser, currentUser} from "../_shared";
import { chatValidated, parseModelJson } from "@/lib/ai-provider";
import {
  COACH_VERSION, buildCoachRetryPrompt, buildCoachSystemPrompt, buildCoachUserPrompt, coachEvidence,
  enforceEvidenceBudget, findSourceEchoes, type AmcCoach, type CoachEvidence, type CoachInput,
} from "@/lib/amc-coach";

const RequestBody = z.object({ questionId: z.string().min(1).max(100) });
type Runtime = { DEEPSEEK_API_KEY?: string; DEEPSEEK_GUIDANCE_MODEL?: string };

const Plain = z.string().min(1).max(400);
const CoachSchema = z.object({
  diagnosis: z.string().min(1).max(80).nullable().default(null),
  // Minimum length 1, not 2: a thin-evidence question may legitimately carry a
  // single sharp cue instead of a padded set.
  cues: z.array(z.object({ cue: Plain, think: Plain })).min(1).max(5),
  cueDecisions: z.array(z.object({ cue: Plain, decision: Plain })).max(4).default([]),
  differentiators: z.array(z.object({ pair: Plain, discriminator: Plain, supporting: Plain, opposing: Plain })).max(3).default([]),
  trap: z.object({ option: z.string().max(4).nullable().default(null), why: Plain }).nullable().default(null),
  takeaway: Plain,
});

let modelCache: { id: string; expires: number } | null = null;

function parseJson(value: string) {
  return JSON.parse(value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
}
function contentText(payload: any) {
  const value = payload?.choices?.[0]?.message?.content;
  return typeof value === "string" ? value.trim() : "";
}
function clean(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\*\*|__|`{1,3}|^#{1,6}\s*|^\s*[-*]\s+/gm, "").replace(/\|/g, " · ").replace(/\s+/g, " ").trim();
}
function cleanCoach(coach: AmcCoach, answerKey: string): AmcCoach {
  const cues = coach.cues.map((item) => ({ cue: clean(item.cue), think: clean(item.think) })).filter((item) => item.cue && item.think);
  const option = coach.trap?.option && /^[A-E]$/i.test(coach.trap.option.trim()) ? coach.trap.option.trim().toUpperCase() : null;
  const why = coach.trap ? clean(coach.trap.why) : "";
  return {
    diagnosis: coach.diagnosis ? clean(coach.diagnosis) : null,
    cues,
    cueDecisions: coach.cueDecisions.map((item) => ({ cue: clean(item.cue), decision: clean(item.decision) })).filter((item) => item.cue && item.decision),
    differentiators: coach.differentiators.map((item) => ({ pair: clean(item.pair), discriminator: clean(item.discriminator), supporting: clean(item.supporting), opposing: clean(item.opposing) }))
      .filter((item) => item.pair && item.discriminator && item.supporting && item.opposing),
    // A trap that points at the keyed answer is not a trap.
    trap: why ? { option: option && option !== answerKey.toUpperCase() ? option : null, why } : null,
    takeaway: clean(coach.takeaway),
  };
}
async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function generate(runtime: Runtime, input: CoachInput, evidence: CoachEvidence, retryEchoes: string[] = []) {
  void runtime; // the shared AI provider owns model selection
  const messages = [
    { role: "system", content: buildCoachSystemPrompt(evidence) },
    { role: "user", content: buildCoachUserPrompt(input, evidence) },
    ...(retryEchoes.length ? [{ role: "user", content: buildCoachRetryPrompt(retryEchoes) }] : []),
  ];
  // `chatValidated`, not `chatText`: a fast catalogue model can answer with prose
  // that does not satisfy this schema, and taking its first reply turned that into
  // a hard failure even though another model in the same catalogue would have
  // produced valid JSON.  Validation now decides which model is good enough.
  const completion = await chatValidated(
    messages as any,
    (text) => {
      const checked = CoachSchema.safeParse(parseModelJson(text));
      if (!checked.success) throw new Error("COACH_STRUCTURE_INVALID");
      return checked.data as AmcCoach;
    },
    { temperature: 0.2 },
  );
  return { coach: enforceEvidenceBudget(cleanCoach(completion.value, input.answerKey), evidence), provider: completion.provider };
}

export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in with ChatGPT is required." }, { status: 401 });
  const parsed = RequestBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid coach request." }, { status: 400 });
  try {
    await ensureUser(user);
    const database = db();
    const question = await database.prepare(`SELECT id,domain,topic,stem_en,answer_key,source_explanation_en,memory_rule_en FROM questions WHERE id=? AND active=1`).bind(parsed.data.questionId).first<any>();
    if (!question) return Response.json({ error: "Question not found." }, { status: 404 });
    const options = await database.prepare(`SELECT option_key,text_en FROM question_options WHERE question_id=? ORDER BY sort_order`).bind(question.id).all<any>();
    const input: CoachInput = {
      stem: String(question.stem_en ?? "").slice(0, 4_000),
      options: options.results.map((row: any) => ({ key: String(row.option_key), text: String(row.text_en ?? "").slice(0, 600) })),
      answerKey: String(question.answer_key ?? ""),
      sourceExplanation: String(question.source_explanation_en ?? "").slice(0, 4_000),
      memoryRule: question.memory_rule_en ?? null,
      topic: question.topic ?? question.domain ?? null,
    };
    const evidence = coachEvidence(input);
    const fingerprint = await digest(JSON.stringify([COACH_VERSION, input.stem, input.options, input.answerKey, input.sourceExplanation, input.memoryRule ?? ""]));
    const cacheKey = `${COACH_VERSION}:${fingerprint.slice(0, 32)}`;
    const cached = await database.prepare(`SELECT result_json FROM coach_runs WHERE question_id=? AND cache_key=? LIMIT 1`).bind(question.id, cacheKey).first<any>();
    if (cached) {
      try {
        const stored = JSON.parse(cached.result_json);
        if (stored?.coach && Array.isArray(stored.coach.cues)) return Response.json({ ...stored, cache: "hit", fingerprint: cacheKey });
      } catch { /* fall through and regenerate */ }
    }
    const runtime = env as unknown as Runtime;
    const first = await generate(runtime, input, evidence);
    let coach = first.coach;
    const echoes = findSourceEchoes(coach, input.sourceExplanation);
    if (echoes.length) {
      try { coach = (await generate(runtime, input, evidence, echoes)).coach; } catch { /* keep the first result */ }
    }
    const payload = { version: COACH_VERSION, coach, evidence };
    try {
      await database.prepare(`INSERT OR REPLACE INTO coach_runs (id,user_id,question_id,created_at,evidence_status,source_comparison_status,result_json,source_list_json,searched_at,cache_key) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .bind(`coach:${question.id}:${fingerprint.slice(0, 32)}`, "system", question.id, new Date().toISOString(), `source-era-only:${evidence.level}`, "not-applicable", JSON.stringify(payload), "[]", null, cacheKey).run();
    } catch (error) { console.error("coach_cache_write_failed", error); }
    return Response.json({ ...payload, cache: "miss", fingerprint: cacheKey, echoes: findSourceEchoes(coach, input.sourceExplanation).length, provider: first.provider });
  } catch (error) {
    // A real error state, not the old catch-all that blamed the learner's records.
    // The learner's attempt and notes are untouched by a failed generation, but that
    // is a reassurance, never the reason the coach is missing.
    console.error("coach_failed", error);
    const detail = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: `AI Coach 生成失败（${detail.slice(0, 160)}）。这是模型侧的失败，不是你作答的问题。`, code: "AI_COACH_GENERATION_FAILED" },
      { status: 503 },
    );
  }
}
