import { env } from "cloudflare:workers";
import { z } from "zod";
import { db, currentUser} from "../_shared";
import { chatValidated, parseModelJson } from "@/lib/ai-provider";

const Block = z.object({
  type: z.enum(["paragraph", "heading", "bullet-list", "ordered-list", "clinical-pathway", "table"]),
  text: z.string().max(20_000).optional(),
  items: z.array(z.string().max(8_000)).max(120).optional(),
  rows: z.array(z.array(z.string().max(4_000)).max(20)).max(120).optional(),
});
const TranslationRequest = z.object({
  kind: z.enum(["question", "answer", "current-evidence", "source-era", "ai-coach", "memory-rule", "knowledge-node", "chapter", "guideline-update", "targeted-reason", "word-lookup"]),
  sourceLanguage: z.literal("en").default("en"),
  targetLanguage: z.literal("zh-CN").default("zh-CN"),
  blocks: z.array(Block).min(1).max(120),
});
type BlockShape = z.infer<typeof Block>;
type Runtime = { DEEPSEEK_API_KEY?: string; DEEPSEEK_GUIDANCE_MODEL?: string };
const TRANSLATION_VERSION = "v12.1";

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function sameStructure(source: BlockShape[], translated: BlockShape[]) {
  return source.length === translated.length && source.every((block, index) => {
    const candidate = translated[index];
    return candidate?.type === block.type
      && (candidate.text === undefined) === (block.text === undefined)
      && (candidate.items?.length ?? -1) === (block.items?.length ?? -1)
      && (candidate.rows?.length ?? -1) === (block.rows?.length ?? -1)
      && (block.rows ?? []).every((row, rowIndex) => row.length === (candidate.rows?.[rowIndex]?.length ?? -1));
  });
}

function responseText(payload: any) {
  const value = payload?.choices?.[0]?.message?.content;
  return typeof value === "string" ? value.trim() : "";
}

function parseJson(value: string) {
  const cleaned = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned);
}

async function translate(runtime: Runtime, blocks: BlockShape[]) {
  void runtime; // the shared AI provider no longer needs a per-route runtime key
  const { value, provider } = await chatValidated([
    { role: "system", content: "Translate the supplied AMC medical-study content from English into precise Simplified Chinese. Return JSON only as {\"blocks\":[...]}. Preserve the exact array, block types, fields, item counts and table dimensions. Keep drug names, doses, abbreviations, IDs, guideline names and citation URLs unchanged where translation would reduce precision. Translate content only; never add clinical claims, evidence status or citations." },
    { role: "user", content: JSON.stringify({ blocks }) },
  ], (text) => {
    // The translated batch must keep the original shape exactly, otherwise the
    // learner would see a silently truncated question.
    const parsed = parseModelJson(text) as any;
    const candidate = z.array(Block).safeParse(parsed?.blocks);
    if (!candidate.success || !sameStructure(blocks, candidate.data)) throw new Error("TRANSLATION_STRUCTURE_INVALID");
    return candidate.data;
  }, { temperature: 0 });
  const checked = { success: true as const, data: value };
  if (!checked.success || !sameStructure(blocks, checked.data)) throw new Error("TRANSLATION_STRUCTURE_INVALID");
  return { blocks: checked.data, provider };
}

export async function POST(request: Request) {
  if (!await currentUser(request)) return Response.json({ error: "Sign in with ChatGPT is required." }, { status: 401 });
  const parsed = TranslationRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid translation request." }, { status: 400 });
  const sourceJson = JSON.stringify(parsed.data.blocks);
  if (sourceJson.length > 48_000) return Response.json({ error: "Translation batch is too large." }, { status: 413 });
  const contentHash = await digest(`${TRANSLATION_VERSION}|${sourceJson}`);
  const cacheKey = await digest(`${contentHash}|${parsed.data.sourceLanguage}|${parsed.data.targetLanguage}|${TRANSLATION_VERSION}`);
  const database = db();
  const cached = await database.prepare("SELECT translation_json,provider FROM translation_cache WHERE cache_key=?").bind(cacheKey).first<any>();
  if (cached) return Response.json({ blocks: JSON.parse(cached.translation_json), contentHash, cache: "hit", provider: cached.provider });
  try {
    const translated = await translate(env as unknown as Runtime, parsed.data.blocks);
    const now = new Date().toISOString();
    await database.prepare(`INSERT INTO translation_cache (cache_key,content_hash,source_language,target_language,content_kind,source_json,translation_json,provider,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(cacheKey, contentHash, parsed.data.sourceLanguage, parsed.data.targetLanguage, parsed.data.kind, sourceJson, JSON.stringify(translated.blocks), translated.provider, now, now).run();
    return Response.json({ blocks: translated.blocks, contentHash, cache: "miss", provider: translated.provider });
  } catch (error) {
    console.error("unified_translation_failed", error);
    return Response.json({ error: "统一翻译服务暂不可用；英文原文与学习记录均未改变。" }, { status: 503 });
  }
}
