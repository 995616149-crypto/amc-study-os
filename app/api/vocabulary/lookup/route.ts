import { env } from "cloudflare:workers";
import { z } from "zod";
import { db, currentUser } from "../../_shared";
import { chatText, parseModelJson } from "@/lib/ai-provider";
import { LEXICON_VERSION, lookupLocal, normalizeSurface } from "@/lib/lexicon/clinical-lexicon";

/**
 * Word lookup route.
 *
 * Fast path first: the curated clinical lexicon answers locally, then the D1
 * lookup cache. Only a genuinely unknown word reaches the model, and that call is
 * bounded (a single short timeout instead of the provider's 3 x 60 s default) so a
 * cold word can never occupy a request for minutes.
 */
const Lookup = z.object({
  surface: z.string().min(1).max(100),
  questionId: z.string().max(100).nullable().optional(),
  context: z.string().max(1800).optional(),
});
type Runtime = { DEEPSEEK_API_KEY?: string; DEEPSEEK_GUIDANCE_MODEL?: string };
type WordResult = {
  lemma: string;
  translationZh: string;
  contextualMeaningZh: string;
  partOfSpeech: string;
  morphologyZh: string;
  etymologyZh: string;
  mnemonicZh: string;
  entityType: string;
  source: string;
};

/** Cold-path budget. The client gives up at 12 s; the server must finish sooner. */
const MODEL_TIMEOUT_MS = 5_000;
const TERMINOLOGY_TIMEOUT_MS = 900;

function digest(value: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((bytes) =>
    [...new Uint8Array(bytes)].map((item) => item.toString(16).padStart(2, "0")).join(""),
  );
}

function lemmaFor(normalized: string) {
  if (normalized === "been") return "be";
  if (normalized.endsWith("ies") && normalized.length > 4) return `${normalized.slice(0, -3)}y`;
  if (normalized.endsWith("ing") && normalized.length > 5) return normalized.slice(0, -3);
  return normalized;
}

async function rxNormCandidate(term: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TERMINOLOGY_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=1`,
      { signal: controller.signal },
    );
    if (!response.ok) return null;
    const body: any = await response.json();
    return body?.approximateGroup?.candidate?.[0]?.name ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function contextualFallback(
  runtime: Runtime,
  surface: string,
  lemma: string,
  context: string,
  terminology: string | null,
): Promise<WordResult> {
  void runtime; // the shared AI provider no longer needs a per-route runtime key
  const { text } = await chatText(
    [
      {
        role: "system",
        content:
          "Return JSON only. Give a precise Chinese learner dictionary entry for the highlighted English word in the supplied medical context. Do not invent morphology or etymology; explicitly say when no reliable helpful split exists.",
      },
      {
        role: "user",
        content: `Surface: ${surface}\nLemma: ${lemma}\nOpen terminology candidate: ${terminology ?? "none"}\nContext: ${context}\nReturn exactly: {"translationZh":"","contextualMeaningZh":"","partOfSpeech":"","morphologyZh":"","etymologyZh":"","mnemonicZh":"","entityType":""}`,
      },
    ],
    { temperature: 0, timeoutMs: MODEL_TIMEOUT_MS, maxBytes: 200_000, maxAttempts: 2, models: ["glm-5.3-flash", "deepseek-v4-flash"] },
  );
  const parsed = parseModelJson(text) as any;
  const textOf = (key: string) => (typeof parsed?.[key] === "string" ? parsed[key].trim() : "");
  // The meaning of the word is the one field that must be real: without it there is
  // nothing to show, so the route keeps failing closed. Supporting fields may be
  // blank when no reliable morphology or etymology exists.
  if (!textOf("translationZh")) throw new Error("INVALID_TRANSLATION");
  const NO_RELIABLE_SPLIT = "暂无可可靠拆解或来源依据，不对该词做推测性拆分。";
  const fields = ["contextualMeaningZh", "partOfSpeech", "morphologyZh", "etymologyZh", "mnemonicZh", "entityType"];
  for (const key of fields) if (!textOf(key)) parsed[key] = NO_RELIABLE_SPLIT;
  return {
    lemma,
    translationZh: textOf("translationZh"),
    contextualMeaningZh: parsed.contextualMeaningZh,
    partOfSpeech: parsed.partOfSpeech,
    morphologyZh: parsed.morphologyZh,
    etymologyZh: parsed.etymologyZh,
    mnemonicZh: parsed.mnemonicZh,
    entityType: parsed.entityType,
    source: terminology ? "rxnorm+contextual-translation" : "contextual-translation",
  };
}

export async function POST(request: Request) {
  const started = Date.now();
  if (!(await currentUser(request))) return Response.json({ error: "Sign in required" }, { status: 401 });
  const parsed = Lookup.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid lookup" }, { status: 400 });
  const normalized = normalizeSurface(parsed.data.surface);
  if (!normalized) return Response.json({ error: "Select an English word" }, { status: 400 });

  const database = db();
  let context = parsed.data.context?.trim() ?? "";
  if (!context && parsed.data.questionId) {
    const row = await database
      .prepare(`SELECT stem_en FROM questions WHERE id=?`)
      .bind(parsed.data.questionId)
      .first<{ stem_en: string }>();
    context = row?.stem_en ?? "";
  }

  const lemma = lemmaFor(normalized);
  const contextHash = (await digest(context.toLowerCase().replace(/\s+/g, " "))).slice(0, 24);

  // 1. Curated local lexicon: no network, no model.
  const local = lookupLocal(normalized, context);
  if (local) {
    return Response.json({
      word: local,
      cache: "local",
      layer: "local-lexicon",
      provider: local.source,
      lexiconVersion: LEXICON_VERSION,
      normalizedSurface: normalized,
      contextHash,
      serverLatencyMs: Date.now() - started,
    });
  }

  // 2. Existing D1 cache, versioned so a lexicon change cannot serve stale senses.
  const cacheKey = (await digest(`${LEXICON_VERSION}|${normalized}|${lemma}|${contextHash}`)).slice(0, 40);
  const cached = await database
    .prepare(`SELECT result_json,provider FROM vocabulary_lookup_cache WHERE cache_key=?`)
    .bind(cacheKey)
    .first<any>();
  if (cached) {
    return Response.json({
      word: JSON.parse(cached.result_json),
      cache: "hit",
      layer: "server-cache",
      provider: cached.provider,
      normalizedSurface: normalized,
      contextHash,
      serverLatencyMs: Date.now() - started,
    });
  }

  // 3. Cold word: terminology lookup and the contextual model run concurrently, so
  // the learner waits for the slower of the two (the model) rather than their sum.
  try {
    const [terminology, entry] = await Promise.all([
      rxNormCandidate(normalized),
      contextualFallback(env as unknown as Runtime, parsed.data.surface, lemma, context, null),
    ]);
    const word: WordResult = terminology
      ? { ...entry, source: "rxnorm+contextual-translation", entityType: `${entry.entityType} · RxNorm: ${terminology}` }
      : entry;
    const now = new Date().toISOString();
    try {
      await database
        .prepare(
          `INSERT INTO vocabulary_lookup_cache (cache_key,normalized_surface,lemma,context_hash,result_json,provider,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`,
        )
        .bind(cacheKey, normalized, word.lemma, contextHash, JSON.stringify(word), word.source, now, now)
        .run();
    } catch (error) {
      console.error("vocabulary_lookup_cache_write_failed", error);
    }
    return Response.json({
      word,
      cache: "miss",
      layer: "api",
      provider: word.source,
      normalizedSurface: normalized,
      contextHash,
      serverLatencyMs: Date.now() - started,
    });
  } catch (error) {
    console.error("vocabulary_lookup_failed", error);
    return Response.json(
      { error: "No reliable dictionary result is available right now. Please retry later; no placeholder was saved." },
      { status: 503 },
    );
  }
}
