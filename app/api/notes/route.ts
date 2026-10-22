import { z } from "zod";
import { db, ensureUser, currentUser} from "../_shared";

const Scope = z.object({
  noteType: z.enum(["question", "chapter"]),
  questionId: z.string().min(1).max(100).nullable().optional(),
  chapterId: z.string().min(1).max(100).nullable().optional(),
  sectionId: z.string().max(100).nullable().optional(),
});
const Save = Scope.extend({ body: z.string().max(20_000) });

function scopeKey(value: z.infer<typeof Scope>) {
  if (value.noteType === "question" && value.questionId) return `question:${value.questionId}`;
  if (value.noteType === "chapter" && value.chapterId) return `chapter:${value.chapterId}:${value.sectionId ?? "all"}`;
  return null;
}

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const userId = await ensureUser(user);
  const rows = await db().prepare("SELECT * FROM study_notes WHERE user_id=? ORDER BY updated_at DESC").bind(userId).all();
  return Response.json({ notes: rows.results });
}

export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const parsed = Save.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid note" }, { status: 400 });
  const key = scopeKey(parsed.data);
  if (!key) return Response.json({ error: "A note must target a question or chapter." }, { status: 400 });
  const userId = await ensureUser(user);
  const database = db();
  const now = new Date().toISOString();
  const existing = await database.prepare("SELECT id,created_at FROM study_notes WHERE user_id=? AND scope_key=?").bind(userId, key).first<any>();
  const id = existing?.id ?? crypto.randomUUID();
  await database.prepare(`INSERT INTO study_notes (id,user_id,scope_key,note_type,question_id,chapter_id,section_id,body,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id,scope_key) DO UPDATE SET body=excluded.body,question_id=excluded.question_id,chapter_id=excluded.chapter_id,section_id=excluded.section_id,updated_at=excluded.updated_at`)
    .bind(id, userId, key, parsed.data.noteType, parsed.data.questionId ?? null, parsed.data.chapterId ?? null, parsed.data.sectionId ?? null, parsed.data.body, existing?.created_at ?? now, now).run();
  const note = await database.prepare("SELECT * FROM study_notes WHERE user_id=? AND scope_key=?").bind(userId, key).first();
  return Response.json({ ok: true, note });
}

export async function DELETE(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const parsed = Scope.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid note scope" }, { status: 400 });
  const key = scopeKey(parsed.data);
  if (!key) return Response.json({ error: "Invalid note scope" }, { status: 400 });
  const userId = await ensureUser(user);
  await db().prepare("DELETE FROM study_notes WHERE user_id=? AND scope_key=?").bind(userId, key).run();
  return Response.json({ ok: true });
}
