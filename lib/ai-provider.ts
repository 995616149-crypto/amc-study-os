/**
 * The single server-side AI provider for this application.
 *
 * Every AI surface (translation, word lookup, question coach, AI tutor, current
 * guidance adjudication) goes through here. Historically each route talked to
 * DeepSeek directly with `DEEPSEEK_API_KEY` from the runtime environment, which the
 * production deployment never had — so one missing secret took down translation,
 * dictionary lookup and the tutor at once.
 *
 * This adapter uses the application's OWN WorkBuddy Cloud Service LLM data plane
 * instead. It is keyless: the publishable key identifies the app and carries no
 * permissions by itself, exactly as the cloud-service contract states. Nothing
 * secret is embedded here, and no provider API key is required at runtime.
 *
 * The data plane is streaming-only (a non-streaming request is rejected with
 * `request_stream_required`), so responses are consumed as SSE and concatenated.
 * Failures fall through to the next candidate model and then surface as a plain
 * error, leaving the caller free to fail closed.
 */
import { CLOUD_ENABLED, CLOUD_ENDPOINT, CLOUD_PUBLISHABLE_KEY } from "./cloud-config";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatOptions = {
  temperature?: number;
  timeoutMs?: number;
  maxBytes?: number;
  /**
   * How many catalogue models may be tried. Defaults to all of them, which is the
   * right trade-off for long-form work. A latency-bounded caller (word lookup) sets
   * 1 so its worst case is one timeout, not one per model.
   */
  maxAttempts?: number;
  /**
   * Preferred model order, restricted to the catalogue. A latency-sensitive caller
   * (word lookup) puts the fastest model first instead of inheriting the long-form
   * default order.
   */
  models?: string[];
};

/** Cheap, reasoning-capable and available in this app's model catalogue. */
const MODEL_CANDIDATES = ["hunyuan-chat", "glm-5.3-flash", "deepseek-v4-flash"];

export class AiProviderError extends Error {
  readonly code: string;
  constructor(code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "AiProviderError";
    this.code = code;
  }
}

/** Catalogue-restricted model order. Unknown names are ignored, never called. */
/**
 * Optional self-hosted LLM backend.
 *
 * Set `AI_API_KEY` (plus optionally `AI_BASE_URL` and `AI_MODEL`) to route every AI
 * surface to any OpenAI-compatible endpoint. This is the supported way to run the
 * project without the hosted cloud backend: no vendor account required beyond your
 * own provider key.
 */
const selfHosted = ((): { apiKey: string; baseUrl: string; model: string } => {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const env = proc?.env ?? {};
  return {
    apiKey: env.AI_API_KEY ?? "",
    baseUrl: (env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: env.AI_MODEL ?? "gpt-4o-mini",
  };
})();

const hasSelfHosted = (): boolean => selfHosted.apiKey.length > 0;

function resolveCandidates(options: ChatOptions): string[] {
  if (hasSelfHosted()) {
    const preferred = (options.models ?? []).filter((model) => model === selfHosted.model);
    return preferred.length ? preferred : [selfHosted.model];
  }
  const preferred = (options.models ?? []).filter((model) => MODEL_CANDIDATES.includes(model));
  return preferred.length ? preferred : MODEL_CANDIDATES;
}

async function readSse(body: ReadableStream<Uint8Array>, maxBytes: number): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) bytes += value.byteLength;
    if (bytes > maxBytes) {
      try { await reader.cancel(); } catch { /* already closing */ }
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const chunk = JSON.parse(payload);
          const delta = chunk?.choices?.[0]?.delta;
          // Some catalogue models always reason; only the answer text is wanted.
          if (typeof delta?.content === "string") text += delta.content;
        } catch {
          // A malformed frame must not kill an otherwise good stream.
        }
      }
    }
  }
  return text.trim();
}

async function chatOnce(model: string, messages: ChatMessage[], options: ChatOptions): Promise<string> {
  if (!hasSelfHosted() && !CLOUD_ENABLED) {
    // Fail closed with an actionable code: callers render this as "AI disabled".
    throw new AiProviderError(
      "AI_NOT_CONFIGURED",
      "set AI_API_KEY (OpenAI-compatible) or CLOUD_PUBLISHABLE_KEY to enable AI features",
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);
  try {
    const target = hasSelfHosted()
      ? {
          url: `${selfHosted.baseUrl}/chat/completions`,
          headers: {
            authorization: `Bearer ${selfHosted.apiKey}`,
            "content-type": "application/json",
            accept: "text/event-stream",
          },
        }
      : {
          url: `${CLOUD_ENDPOINT}/.cloud/llm/chat/completions`,
          headers: {
            "x-wb-webapp-access-key": CLOUD_PUBLISHABLE_KEY,
            "content-type": "application/json",
            accept: "text/event-stream",
          },
        };
    const response = await fetch(target.url, {
      method: "POST",
      headers: target.headers,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: options.temperature ?? 0,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AiProviderError(`AI_HTTP_${response.status}`, detail.slice(0, 200));
    }
    if (!response.body) throw new AiProviderError("AI_NO_STREAM");
    const text = await readSse(response.body, options.maxBytes ?? 4_000_000);
    if (!text) throw new AiProviderError("AI_EMPTY_RESPONSE");
    return text;
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    const name = (error as { name?: string })?.name;
    if (name === "AbortError") throw new AiProviderError("AI_TIMEOUT");
    throw new AiProviderError("AI_NETWORK", String((error as Error)?.message ?? error).slice(0, 160));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the model and return its answer text.
 *
 * The first candidate that answers wins. A model that is unavailable or rejects the
 * request moves on to the next, so a catalogue change cannot take the whole
 * application offline.
 */
export async function chatText(messages: ChatMessage[], options: ChatOptions = {}): Promise<{ text: string; model: string; provider: string }> {
  let last: unknown = null;
  const candidates = resolveCandidates(options);
  for (const model of candidates.slice(0, Math.max(1, options.maxAttempts ?? candidates.length))) {
    try {
      const text = await chatOnce(model, messages, options);
      return { text, model, provider: hasSelfHosted() ? `openai-compatible:${model}` : `workbuddy-cloud:${model}` };
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error ? last : new AiProviderError("AI_UNAVAILABLE");
}

/**
 * Ask the model and require the answer to pass a caller-supplied validator,
 * trying each candidate model until one produces usable output.
 *
 * A fast model usually answers first, but a smaller model can also return JSON that
 * does not satisfy a strict schema (an exact block array, a fixed field set, a
 * comparison table shape). Without this retry such a response surfaced as a hard
 * failure even though a stronger model in the same catalogue would have succeeded.
 * Validation therefore decides which model is "good enough", not raw latency.
 */
export async function chatValidated<T>(
  messages: ChatMessage[],
  validate: (text: string) => T,
  options: ChatOptions = {},
): Promise<{ value: T; model: string; provider: string }> {
  let lastError: unknown = null;
  const candidates = resolveCandidates(options);
  for (const model of candidates.slice(0, Math.max(1, options.maxAttempts ?? candidates.length))) {
    let text: string;
    try {
      text = await chatOnce(model, messages, options);
    } catch (error) {
      lastError = error;
      continue;
    }
    try {
      return { value: validate(text), model, provider: `workbuddy-cloud:${model}` };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new AiProviderError("AI_UNAVAILABLE");
}

/** Tolerant JSON extraction for prompts that ask for "JSON only". */
export function parseModelJson(value: string): unknown {
  const cleaned = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
    throw new AiProviderError("AI_JSON_INVALID");
  }
}

let cachedHealth: { ok: boolean; model: string | null; checkedAt: number; error: string | null } | null = null;

/**
 * Shared provider health check covering every AI surface at once: if this passes,
 * translation, lookup, coach and tutor all have a working backend.
 */
export async function aiProviderHealth(force = false): Promise<{ ok: boolean; model: string | null; checkedAt: number; error: string | null }> {
  if (!force && cachedHealth && Date.now() - cachedHealth.checkedAt < 60_000) return cachedHealth;
  try {
    const result = await chatText([{ role: "user", content: "Reply with the single word: ok" }], { timeoutMs: 20_000, maxBytes: 200_000 });
    cachedHealth = { ok: true, model: result.model, checkedAt: Date.now(), error: null };
  } catch (error) {
    cachedHealth = { ok: false, model: null, checkedAt: Date.now(), error: error instanceof Error ? error.message.slice(0, 200) : "AI_UNAVAILABLE" };
  }
  return cachedHealth;
}
