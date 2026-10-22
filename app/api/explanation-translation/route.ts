import { db, currentUser} from "../_shared";

type ExplanationType = "source-era" | "memory-rule" | "ai-coach" | "knowledge-node" | "chapter-review";
type Payload = {
  type: "paragraph" | "heading" | "bullet-list" | "ordered-list" | "clinical-pathway" | "table";
  text?: string;
  items?: string[];
  rows?: string[][];
};

const allowedTypes = new Set<ExplanationType>(["source-era", "memory-rule", "ai-coach", "knowledge-node", "chapter-review"]);
const allowedBlockTypes = new Set<Payload["type"]>(["paragraph", "heading", "bullet-list", "ordered-list", "clinical-pathway", "table"]);

function validBlocks(value: unknown): value is Payload[] {
  if (!Array.isArray(value) || !value.length || value.length > 100) return false;
  let characters = 0;
  for (const block of value) {
    if (!block || typeof block !== "object" || !allowedBlockTypes.has((block as Payload).type)) return false;
    const candidate = block as Payload;
    if (candidate.text !== undefined && typeof candidate.text !== "string") return false;
    if (candidate.items !== undefined && (!Array.isArray(candidate.items) || candidate.items.some((item) => typeof item !== "string"))) return false;
    if (candidate.rows !== undefined && (!Array.isArray(candidate.rows) || candidate.rows.some((row) => !Array.isArray(row) || row.some((cell) => typeof cell !== "string")))) return false;
    characters += candidate.text?.length ?? 0;
    characters += candidate.items?.reduce((sum, item) => sum + item.length, 0) ?? 0;
    characters += candidate.rows?.reduce((sum, row) => sum + row.reduce((inner, cell) => inner + cell.length, 0), 0) ?? 0;
  }
  return characters > 0 && characters <= 40000;
}

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sameStructure(source: Payload[], translated: Payload[]) {
  if (source.length !== translated.length) return false;
  return source.every((block, index) => {
    const candidate = translated[index];
    if (!candidate || candidate.type !== block.type) return false;
    if ((block.text === undefined) !== (candidate.text === undefined)) return false;
    if ((block.items?.length ?? -1) !== (candidate.items?.length ?? -1)) return false;
    if ((block.rows?.length ?? -1) !== (candidate.rows?.length ?? -1)) return false;
    return (block.rows ?? []).every((row, rowIndex) => row.length === (candidate.rows?.[rowIndex]?.length ?? -1));
  });
}

export async function POST(request: Request) {
  if (!await currentUser(request)) return Response.json({ error: "Sign in with ChatGPT is required." }, { status: 401 });
  try {
    const body = await request.json() as { questionId?: string; explanationType?: ExplanationType; contentHash?: string; content?: Payload[]; translated?: Payload[] };
    if (!body.questionId || !body.explanationType || !allowedTypes.has(body.explanationType) || !validBlocks(body.content)) {
      return Response.json({ error: "Invalid translation request." }, { status: 400 });
    }
    const question = await db().prepare("SELECT id FROM questions WHERE id=? AND active=1").bind(body.questionId).first();
    if (!question) return Response.json({ error: "Question not found." }, { status: 404 });

    const sourceContent = JSON.stringify(body.content);
    const contentHash = await hash(sourceContent);
    if (body.contentHash && body.contentHash !== contentHash) return Response.json({ error: "Content changed; refresh and try again." }, { status: 409 });

    const cached = await db().prepare("SELECT translation_json FROM explanation_translations WHERE question_id=? AND explanation_type=? AND content_hash=?")
      .bind(body.questionId, body.explanationType, contentHash).first<{ translation_json: string }>();
    if (cached) return Response.json({ contentHash, blocks: JSON.parse(cached.translation_json), cached: true });

    if (!body.translated) return Response.json({ contentHash, cached: false, translationRequired: true });
    if (!validBlocks(body.translated) || !sameStructure(body.content, body.translated)) {
      return Response.json({ error: "Translation structure validation failed." }, { status: 422 });
    }
    await db().prepare("INSERT OR IGNORE INTO explanation_translations (id,question_id,explanation_type,content_hash,source_content,translation_json,created_at) VALUES (?,?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), body.questionId, body.explanationType, contentHash, sourceContent, JSON.stringify(body.translated), new Date().toISOString()).run();
    return Response.json({ contentHash, blocks: body.translated, cached: false });
  } catch (error) {
    console.error("whole_explanation_translation_failed", error);
    const detail = process.env.NODE_ENV === "production" ? "" : `（${error instanceof Error ? error.message : "unknown error"}）`;
    return Response.json({ error: `全文翻译暂时不可用，请稍后重试；英文原文未受影响。${detail}` }, { status: 503 });
  }
}
