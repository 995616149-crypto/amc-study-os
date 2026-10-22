import { z } from "zod";
import { db, ensureUser, currentUser} from "../_shared";

// The cursor is keyed by (user, practice scope).  Adding a question source must
// never move another source's cursor, so every read and write names its scope.
const Body = z.object({
  questionId: z.string().min(1).max(100),
  practiceScope: z.string().min(1).max(160).default("all"),
});

const DEFAULT_SCOPE = "all";

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const userId = await ensureUser(user);
    const rows = await db()
      .prepare(`SELECT question_id,practice_scope,updated_at FROM practice_position WHERE user_id=?`)
      .bind(userId).all<any>();
    const positions: Record<string, { questionId: string; practiceScope: string; updatedAt: string }> = {};
    for (const row of rows.results ?? []) {
      positions[row.practice_scope] = {
        questionId: row.question_id, practiceScope: row.practice_scope, updatedAt: row.updated_at,
      };
    }
    return Response.json({
      positions,
      // Backwards-compatible single-value view of the all-sources cursor.
      position: positions[DEFAULT_SCOPE] ?? null,
    });
  } catch (error) {
    console.error("practice_position_read_failed", error);
    return Response.json({ error: "练习位置暂时不可用。" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid position" }, { status: 400 });
  try {
    const userId = await ensureUser(user);
    const now = new Date().toISOString();
    await db()
      .prepare(
        `INSERT INTO practice_position (user_id,question_id,practice_scope,updated_at) VALUES (?,?,?,?)
         ON CONFLICT(user_id,practice_scope) DO UPDATE SET question_id=excluded.question_id, updated_at=excluded.updated_at`,
      )
      .bind(userId, parsed.data.questionId, parsed.data.practiceScope, now).run();
    return Response.json({
      ok: true,
      position: { questionId: parsed.data.questionId, practiceScope: parsed.data.practiceScope, updatedAt: now },
    });
  } catch (error) {
    console.error("practice_position_write_failed", error);
    return Response.json({ error: "练习位置暂时不可用。" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const scope = new URL(request.url).searchParams.get("scope");
  try {
    const userId = await ensureUser(user);
    if (scope) {
      // Clears every cursor inside one source scope, including its queue cursors.
      await db()
        .prepare(`DELETE FROM practice_position WHERE user_id=? AND (practice_scope=? OR practice_scope LIKE ?)`)
        .bind(userId, scope, `${scope}|%`).run();
    } else {
      await db().prepare(`DELETE FROM practice_position WHERE user_id=?`).bind(userId).run();
    }
    return Response.json({ ok: true, cleared: scope ?? "all" });
  } catch (error) {
    console.error("practice_position_clear_failed", error);
    return Response.json({ error: "练习位置暂时不可用。" }, { status: 503 });
  }
}
