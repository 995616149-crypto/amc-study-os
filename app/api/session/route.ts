import { db } from "../_shared";
import {
  bindOwnerIdentity,
  readPasswordCredentials,
  setPasswordCredentials,
  signInWithLocalPassword,
  clearSessionCookie,
  passwordLoginEnabled,
  readCredentials,
  serializeSessionCookie,
  sessionUser,
  signIn,
  signOut,
  startOwnerSession,
  verifyCloudAccessToken,
} from "@/lib/owner-auth";

export const dynamic = "force-dynamic";

/**
 * Owner session endpoint.
 *
 * POST { accessToken }  -> verifies a WorkBuddy cloud token server-side, binds the
 *                          authenticated identity to the existing owner profile and
 *                          sets an HttpOnly session cookie.  This is the normal
 *                          browser path (native email login).
 * POST { passcode }     -> the previous passcode path, kept only as a rollback
 *                          channel while `owner_login_settings` allows it.
 * GET                   -> which login methods are available right now.
 * DELETE                -> revokes the session and clears the cookie.
 */
export async function GET(request: Request) {
  try {
    const database = db();
    const [user, credentials, passwordEnabled] = await Promise.all([
      sessionUser(database, request),
      readCredentials(database),
      passwordLoginEnabled(database),
    ]);
    const localCredentials = await readPasswordCredentials(database);
    return Response.json({
      authenticated: Boolean(user),
      configured: Boolean(credentials),
      // The normal login chain is local username + password. The older routes are
      // reported only so the page can offer them as a rollback while they remain on.
      localPassword: true,
      localPasswordConfigured: Boolean(localCredentials),
      passwordLogin: Boolean(credentials) && passwordEnabled,
    });
  } catch (error) {
    console.error("session_status_failed", error);
    return Response.json({ authenticated: false, configured: false, localPassword: true, localPasswordConfigured: false, passwordLogin: false, error: "SESSION_UNAVAILABLE" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { accessToken?: unknown; passcode?: unknown } | null;
  const userAgent = request.headers.get("user-agent");

  // ---------------------------------------------------------------- email login
  if (typeof body?.accessToken === "string" && body.accessToken) {
    try {
      const identity = await verifyCloudAccessToken(body.accessToken);
      if (!identity.ok) {
        // Diagnostics carry a stage and the data plane's error code only — never a
        // token — so a real failure can be attributed without leaking credentials.
        console.error("session_cloud_token_check_failed", identity.stage, identity.status, identity.code, identity.context);
        return Response.json(
          { error: "登录凭证无效，请重新登录。", stage: identity.stage, upstreamStatus: identity.status, upstreamCode: identity.code, context: identity.context },
          { status: 401 },
        );
      }
      const database = db();
      const bound = await bindOwnerIdentity(database, identity);
      if (!bound.ok) {
        const message = bound.reason === "bound_to_another_identity"
          ? "该账号不是本站点的 owner，无法访问已有学习数据。"
          : "站点尚未完成 owner 配置。";
        return Response.json({ error: message, reason: bound.reason }, { status: 403 });
      }
      const token = await startOwnerSession(database, bound.user, userAgent);
      return Response.json(
        { ok: true, user: { userId: bound.user.userId, displayName: bound.user.displayName } },
        { headers: { "set-cookie": serializeSessionCookie(token), "cache-control": "no-store" } },
      );
    } catch (error) {
      console.error("session_cloud_signin_failed", error);
      return Response.json({ error: "登录暂时不可用。" }, { status: 503 });
    }
  }

  // ------------------------------------------- local username + password (normal)
  const username = typeof (body as any)?.username === "string" ? String((body as any).username).trim() : "";
  const password = typeof (body as any)?.password === "string" ? String((body as any).password) : "";
  if (username && password) {
    try {
      const result = await signInWithLocalPassword(db(), username, password, userAgent);
      if (!result.ok) {
        const message = result.reason === "no_credentials"
          ? "尚未设置登录账号。请在项目目录运行：node scripts/set-owner-password.mjs --username owner"
          : result.reason === "locked"
            ? "尝试次数过多，请稍后再试。"
            : "用户名或密码不正确。";
        return Response.json({ error: message, reason: result.reason }, { status: result.reason === "no_credentials" ? 503 : 401 });
      }
      return Response.json({ ok: true, user: { userId: result.user.userId, displayName: result.user.displayName } },
        { headers: { "set-cookie": serializeSessionCookie(result.token), "cache-control": "no-store" } });
    } catch (error) {
      console.error("session_local_signin_failed", error);
      return Response.json({ error: "登录暂时不可用。" }, { status: 503 });
    }
  }

  // ------------------------------------------------------------ passcode (rollback)
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";
  if (!passcode || passcode.length > 256) return Response.json({ error: "请输入邮箱验证码登录。" }, { status: 400 });
  try {
    if (!(await passwordLoginEnabled(db()))) {
      return Response.json({ error: "口令登录已停用，请使用邮箱登录。", reason: "password_login_disabled" }, { status: 403 });
    }
    const result = await signIn(db(), passcode, userAgent);
    if (!result.ok) {
      const message = result.reason === "no_credentials"
        ? "尚未配置访问口令。"
        : result.reason === "locked"
          ? "尝试次数过多，请稍后再试。"
          : "口令不正确。";
      return Response.json({ error: message, reason: result.reason }, { status: result.reason === "no_credentials" ? 503 : 401 });
    }
    return Response.json({ ok: true, user: { userId: result.user.userId, displayName: result.user.displayName } },
      { headers: { "set-cookie": serializeSessionCookie(result.token), "cache-control": "no-store" } });
  } catch (error) {
    console.error("session_signin_failed", error);
    return Response.json({ error: "登录暂时不可用。" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    await signOut(db(), request);
  } catch (error) {
    console.error("session_signout_failed", error);
  }
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(), "cache-control": "no-store" } });
}

/**
 * Sets or rotates the local username and password.
 *
 * Only reachable from an already-authenticated owner session, which is what keeps
 * the site safe: there is no "first visitor becomes the owner" path.
 */
export async function PUT(request: Request) {
  try {
    const database = db();
    const user = await sessionUser(database, request);
    if (!user) return Response.json({ error: "请先在已登录状态下设置。" }, { status: 401 });
    const body = await request.json().catch(() => null) as { username?: unknown; password?: unknown } | null;
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) {
      return Response.json({ error: "用户名需为 3-32 位字母、数字、点、下划线或短横线。" }, { status: 400 });
    }
    if (password.length < 10 || password.length > 200) {
      return Response.json({ error: "密码至少 10 位。" }, { status: 400 });
    }
    const { algorithm } = await setPasswordCredentials(database, username, password);
    // Once a local credential exists, the legacy passcode stops being a login route.
    await database.prepare(`UPDATE owner_login_settings SET password_login_enabled=0, updated_at=? WHERE id='owner'`)
      .bind(new Date().toISOString()).run();
    return Response.json({ ok: true, username, algorithm });
  } catch (error) {
    console.error("session_credentials_setup_failed", error);
    return Response.json({ error: "设置失败，请重试。" }, { status: 503 });
  }
}
