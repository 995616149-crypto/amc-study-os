/**
 * Word lookup core: cache, dedupe and fallback ordering.
 *
 * Deliberately free of React, DOM and server imports so the same logic can be
 * unit-tested in Node and reused by the client panel.
 *
 * Order of resolution (fastest first):
 *   1. in-memory LRU
 *   2. persistent client cache (localStorage)
 *   3. lazy-loaded local lexicon
 *   4. existing server API (server-side D1 cache, then RxNorm + contextual model)
 */

import { LEXICON_VERSION, lemmaFor, normalizeSurface } from "./lexicon/tokenize";

export { extractTokens } from "./lexicon/tokenize";

export type WordEntry = {
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

export type LookupLayer = "memory" | "persistent" | "lexicon" | "server-cache" | "api";

export type LookupOutcome =
  | { ok: true; word: WordEntry; layer: LookupLayer; latencyMs: number }
  | { ok: false; error: string; retryable: boolean; latencyMs: number; offline?: boolean };

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key?(index: number): string | null;
  readonly length?: number;
};

export type ServerLookupPayload = {
  word: WordEntry;
  cache?: string;
  layer?: string;
  provider?: string;
  latencyMs?: number;
};

export const CACHE_PREFIX = "amc.word.v1.";
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const MEMORY_CAPACITY = 400;
export const PERSIST_LIMIT = 600;

/** Stable 32-bit context signature. Only needs to be stable within one browser. */
export function contextSignature(context: string): string {
  const normalized = String(context ?? "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 1200);
  if (!normalized) return "0-0";
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(index)) | 0;
  }
  return `${(hash >>> 0).toString(36)}-${normalized.length}`;
}

/** Cache key includes token, lemma, context and lexicon version. */
export function wordCacheKey(surface: string, context = ""): string {
  const token = normalizeSurface(surface);
  return `${CACHE_PREFIX}${LEXICON_VERSION}|${token}|${lemmaFor(token)}|${contextSignature(context)}`;
}

type CacheRecord = { word: WordEntry; at: number };

/**
 * Two-tier cache. Memory is an LRU; persistence is one localStorage entry per
 * key, so a write can never rewrite the whole dictionary.
 */
export class WordCache {
  private readonly memory = new Map<string, CacheRecord>();
  private readonly capacity: number;
  private readonly ttlMs: number;
  private readonly storage: StorageLike | null;
  private readonly now: () => number;

  constructor(options: { capacity?: number; ttlMs?: number; storage?: StorageLike | null; now?: () => number } = {}) {
    this.capacity = options.capacity ?? MEMORY_CAPACITY;
    this.ttlMs = options.ttlMs ?? CACHE_TTL_MS;
    this.storage = options.storage ?? null;
    this.now = options.now ?? Date.now;
  }

  get(key: string): { word: WordEntry; layer: "memory" | "persistent" } | null {
    const current = this.now();
    const inMemory = this.memory.get(key);
    if (inMemory && current - inMemory.at <= this.ttlMs) {
      // refresh LRU order
      this.memory.delete(key);
      this.memory.set(key, inMemory);
      return { word: inMemory.word, layer: "memory" };
    }
    if (inMemory) this.memory.delete(key);
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheRecord;
      if (!parsed?.word?.translationZh || typeof parsed.at !== "number" || current - parsed.at > this.ttlMs) {
        this.storage.removeItem(key);
        return null;
      }
      this.remember(key, parsed);
      return { word: parsed.word, layer: "persistent" };
    } catch {
      return null;
    }
  }

  set(key: string, word: WordEntry): void {
    const record = { word, at: this.now() };
    this.remember(key, record);
    if (!this.storage) return;
    try {
      this.storage.setItem(key, JSON.stringify(record));
      this.trimStorage();
    } catch {
      // Quota errors must never break a lookup.
    }
  }

  /** Number of entries currently in the memory tier (for tests/diagnostics). */
  get memorySize(): number {
    return this.memory.size;
  }

  private remember(key: string, record: CacheRecord): void {
    this.memory.delete(key);
    this.memory.set(key, record);
    while (this.memory.size > this.capacity) {
      const oldest = this.memory.keys().next().value;
      if (oldest === undefined) break;
      this.memory.delete(oldest);
    }
  }

  private trimStorage(): void {
    const storage = this.storage;
    if (!storage || typeof storage.key !== "function" || typeof storage.length !== "number") return;
    const keys: Array<{ key: string; at: number }> = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key || !key.startsWith(CACHE_PREFIX)) continue;
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "null") as CacheRecord | null;
        keys.push({ key, at: typeof parsed?.at === "number" ? parsed.at : 0 });
      } catch {
        keys.push({ key, at: 0 });
      }
    }
    if (keys.length <= PERSIST_LIMIT) return;
    keys.sort((a, b) => a.at - b.at);
    for (const entry of keys.slice(0, keys.length - PERSIST_LIMIT)) {
      try { storage.removeItem(entry.key); } catch { /* ignore */ }
    }
  }
}

export type LookupRequest = { surface: string; context: string; questionId: string | null };

export type LookupFetch = (
  request: LookupRequest,
  signal: AbortSignal,
) => Promise<ServerLookupPayload>;

export type LexiconProvider = (surface: string, context: string) => WordEntry | null;

const OFFLINE_MESSAGE = "网络不可用：已保留本地结果，恢复网络后可重试。";
const TIMEOUT_MESSAGE = "查询超时：已保留本地结果，可稍后重试。";

/** Map a server payload layer onto the client-visible layer. */
export function normalizeServerLayer(payload: ServerLookupPayload): LookupLayer {
  if (payload.layer === "local-lexicon") return "lexicon";
  if (payload.cache === "hit") return "server-cache";
  return "api";
}

export class WordLookupEngine {
  private readonly cache: WordCache;
  private readonly fetcher: LookupFetch;
  private readonly lexicon: LexiconProvider;
  private readonly timeoutMs: number;
  private readonly now: () => number;
  private readonly inflight = new Map<string, Promise<LookupOutcome>>();
  /** Diagnostics: number of network calls actually issued. */
  networkCalls = 0;

  constructor(options: {
    fetcher: LookupFetch;
    cache?: WordCache;
    lexicon?: LexiconProvider;
    timeoutMs?: number;
    now?: () => number;
  }) {
    this.fetcher = options.fetcher;
    this.cache = options.cache ?? new WordCache();
    this.lexicon = options.lexicon ?? (() => null);
    this.timeoutMs = options.timeoutMs ?? 12_000;
    this.now = options.now ?? Date.now;
  }

  async lookup(surface: string, context: string, questionId: string | null = null): Promise<LookupOutcome> {
    const started = this.now();
    const token = normalizeSurface(surface);
    if (!token) {
      return { ok: false, error: "请选择一个英文单词。", retryable: false, latencyMs: this.now() - started };
    }
    const key = wordCacheKey(token, context);
    const cached = this.cache.get(key);
    if (cached) return { ok: true, word: cached.word, layer: cached.layer, latencyMs: this.now() - started };

    const local = this.lexicon(token, context);
    if (local) {
      this.cache.set(key, local);
      return { ok: true, word: local, layer: "lexicon", latencyMs: this.now() - started };
    }

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const request = this.lookupRemote({ surface: token, context, questionId }, key, started);
    this.inflight.set(key, request);
    try {
      return await request;
    } finally {
      this.inflight.delete(key);
    }
  }

  /** Diagnostics: keys currently coalesced. */
  get inflightCount(): number {
    return this.inflight.size;
  }

  private async lookupRemote(request: LookupRequest, key: string, started: number): Promise<LookupOutcome> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    this.networkCalls += 1;
    try {
      const payload = await this.fetcher(request, controller.signal);
      if (!payload?.word?.translationZh) {
        return { ok: false, error: "词典暂未返回可用释义，可重试。", retryable: true, latencyMs: this.now() - started };
      }
      this.cache.set(key, payload.word);
      return { ok: true, word: payload.word, layer: normalizeServerLayer(payload), latencyMs: this.now() - started };
    } catch (error: any) {
      const aborted = timedOut || error?.name === "AbortError";
      const offline = !aborted && (error?.name === "TypeError" || /network|fetch|offline/i.test(String(error?.message ?? "")));
      return {
        ok: false,
        error: aborted ? TIMEOUT_MESSAGE : offline ? OFFLINE_MESSAGE : "词典服务暂不可用，可重试。",
        retryable: true,
        offline,
        latencyMs: this.now() - started,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Latest-request-wins guard. Shared by the panel and the unit tests so "an older
 * response can never overwrite a newer word" is verified against the same code
 * that ships, not a re-implementation.
 */
export function createSequenceGuard() {
  let current = 0;
  return {
    next(): number { current += 1; return current; },
    isCurrent(id: number): boolean { return id === current; },
    invalidate(): void { current += 1; },
    get value(): number { return current; },
  };
}
