/**
 * Browser-usable owner session.
 *
 * Why this exists
 * ---------------
 * Every API route resolved its caller from platform-injected
 * `oai-authenticated-user-*` headers.  A real browser on the public URL never
 * receives them, so it got 401 and the app sat on its skeleton.  This module adds
 * the smallest identity a single-owner site needs and nothing more:
 *
 *   * one passcode, stored only as a PBKDF2 hash in D1 (never in the client, never
 *     in a URL, never in an environment variable that this deployment cannot set);
 *   * an opaque 256-bit session token, stored server-side as a SHA-256 hash, in an
 *     HttpOnly + Secure + SameSite=Lax cookie;
 *   * a deterministic mapping from the session to the EXISTING owner profile, so
 *     attempts, progress and review state keep belonging to the same learner.
 *
 * It is deliberately not an account system: one credential row, one session
 * table, no registration, no email, no OAuth.
 *
 * Identity resolution order (see `resolveRequestUser`):
 *   1. platform-injected headers (unchanged, still authoritative when present);
 *   2. a valid owner session cookie.
 */

import { CLOUD_AUTH_DATA_PLANE, CLOUD_PUBLISHABLE_KEY, CLOUD_RELEASE_ORIGIN } from "./cloud-config";

export const SESSION_COOKIE = "amc_owner_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const PBKDF2_ITERATIONS = 210_000;
const LOCK_AFTER_FAILURES = 10;
const LOCK_MINUTES = 15;
const LAST_SEEN_REFRESH_MS = 60 * 60 * 1000;

export type RequestUser = { userId: string; email: string; displayName: string };

export type CredentialRow = {
  id: string;
  owner_user_id: string;
  passcode_hash: string;
  passcode_salt: string;
  iterations: number;
  failed_attempts: number;
  locked_until: string | null;
};

type D1Like = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
    };
  };
  batch?(statements: unknown[]): Promise<unknown>;
};

const encoder = new TextEncoder();

/** WebCrypto in workers wants an ArrayBuffer-backed view, not a generic typed array. */
function utf8(value: string): ArrayBuffer {
  const bytes = encoder.encode(value);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function derivePasscode(passcode: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", utf8(passcode), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: toArrayBuffer(salt), iterations, hash: "SHA-256" }, key, 256);
  return bytesToBase64Url(new Uint8Array(bits));
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

/** Used by the setup script; never called on a request path with the raw passcode. */
export async function hashPasscode(passcode: string, saltBase64Url: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  return derivePasscode(passcode, base64UrlToBytes(saltBase64Url), iterations);
}

export function newSalt(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

export const DEFAULT_ITERATIONS = PBKDF2_ITERATIONS;

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || null;
  }
  return null;
}

export function serializeSessionCookie(token: string): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].join("; ");
}

export function clearSessionCookie(): string {
  return [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax", "Max-Age=0"].join("; ");
}

export type PasswordCredentialRow = {
  id: string;
  username: string;
  password_hash: string;
  password_salt: string;
  algorithm: string;
  params: string;
};

const SCRYPT_DEFAULTS = { N: 16384, r: 8, p: 1, keylen: 32 };
export const SCRYPT_DEFAULTS_EXPORT = SCRYPT_DEFAULTS;

async function scryptDerive(password: string, salt: Uint8Array, params: typeof SCRYPT_DEFAULTS): Promise<string | null> {
  try {
    // Preferred KDF.  `node:crypto`'s scrypt is not guaranteed on every Workers
    // runtime, so an unavailable implementation falls back to PBKDF2 rather than
    // adding a native dependency to the deployment.
    const nodeCrypto = await import("node:crypto");
    const scrypt = (nodeCrypto as { scryptSync?: Function }).scryptSync;
    if (typeof scrypt !== "function") return null;
    const derived = scrypt(password, salt, params.keylen, { N: params.N, r: params.r, p: params.p, maxmem: 256 * 1024 * 1024 }) as Uint8Array;
    return bytesToBase64Url(new Uint8Array(derived));
  } catch {
    return null;
  }
}

/**
 * Hashes a password with the strongest KDF this runtime actually provides, and
 * reports which one was used so verification never has to guess.
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string; algorithm: "scrypt" | "pbkdf2-sha256"; params: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const scryptHash = await scryptDerive(password, salt, SCRYPT_DEFAULTS);
  if (scryptHash) {
    return { hash: scryptHash, salt: bytesToBase64Url(salt), algorithm: "scrypt", params: JSON.stringify(SCRYPT_DEFAULTS) };
  }
  const iterations = 210_000;
  const hash = await derivePasscode(password, salt, iterations);
  return { hash, salt: bytesToBase64Url(salt), algorithm: "pbkdf2-sha256", params: JSON.stringify({ iterations }) };
}

export async function verifyPassword(password: string, row: PasswordCredentialRow): Promise<boolean> {
  const salt = base64UrlToBytes(row.password_salt);
  if (row.algorithm === "scrypt") {
    const params = { ...SCRYPT_DEFAULTS, ...(JSON.parse(row.params || "{}") as object) } as typeof SCRYPT_DEFAULTS;
    const candidate = await scryptDerive(password, salt, params);
    return candidate ? timingSafeEqual(candidate, row.password_hash) : false;
  }
  const iterations = Number((JSON.parse(row.params || "{}") as { iterations?: number }).iterations ?? 210_000);
  const candidate = await derivePasscode(password, salt, iterations);
  return timingSafeEqual(candidate, row.password_hash);
}

export async function readPasswordCredentials(database: D1Like): Promise<PasswordCredentialRow | null> {
  return database.prepare(`SELECT id,username,password_hash,password_salt,algorithm,params FROM owner_password_credentials WHERE id='owner'`)
    .bind().first<PasswordCredentialRow>();
}

export async function setPasswordCredentials(database: D1Like, username: string, password: string): Promise<{ algorithm: string }> {
  const { hash, salt, algorithm, params } = await hashPassword(password);
  const now = new Date().toISOString();
  await database.prepare(`INSERT INTO owner_password_credentials (id,username,password_hash,password_salt,algorithm,params,created_at,updated_at)
    VALUES ('owner',?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET username=excluded.username, password_hash=excluded.password_hash,
      password_salt=excluded.password_salt, algorithm=excluded.algorithm, params=excluded.params, updated_at=excluded.updated_at`)
    .bind(username, hash, salt, algorithm, params, now, now).run();
  return { algorithm };
}

/**
 * Verifies the local username/password and issues a session bound to the existing
 * owner profile.  The credential itself never decides which learner it is.
 */
export async function signInWithLocalPassword(
  database: D1Like, username: string, password: string, userAgent: string | null,
): Promise<{ ok: true; token: string; user: RequestUser } | { ok: false; reason: "no_credentials" | "locked" | "invalid" }> {
  const credentials = await readPasswordCredentials(database);
  if (!credentials) return { ok: false, reason: "no_credentials" };
  const settings = await readLoginSettings(database);
  const guard = await readCredentials(database);
  if (guard?.locked_until && new Date(guard.locked_until).getTime() > Date.now()) return { ok: false, reason: "locked" };

  const sameUser = timingSafeEqual(username.trim().toLowerCase(), credentials.username.trim().toLowerCase());
  const passwordOk = await verifyPassword(password, credentials);
  if (!sameUser || !passwordOk) {
    if (guard) {
      const failures = Number(guard.failed_attempts ?? 0) + 1;
      const locked = failures >= LOCK_AFTER_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
      await database.prepare(`UPDATE owner_credentials SET failed_attempts=?, locked_until=?, updated_at=? WHERE id='owner'`)
        .bind(locked ? 0 : failures, locked, new Date().toISOString()).run();
    }
    return { ok: false, reason: "invalid" };
  }
  if (guard) {
    await database.prepare(`UPDATE owner_credentials SET failed_attempts=0, locked_until=NULL, updated_at=? WHERE id='owner'`)
      .bind(new Date().toISOString()).run();
  }
  const ownerUserId = guard?.owner_user_id ?? "user:preview-user";
  const profile = await ownerProfile(database, ownerUserId);
  const user = ownerIdentity(ownerUserId, profile.email, profile.displayName);
  const token = await startOwnerSession(database, user, userAgent);
  return { ok: true, token, user };
}

export async function readCredentials(database: D1Like): Promise<CredentialRow | null> {
  return database.prepare(`SELECT id,owner_user_id,passcode_hash,passcode_salt,iterations,failed_attempts,locked_until FROM owner_credentials WHERE id='owner'`).bind().first<CredentialRow>();
}

/**
 * Verifies the passcode and, on success, creates a session bound to the existing
 * owner profile.  A failed attempt is recorded so a long random passcode is not
 * the only thing standing between a stranger and the learner's history.
 */
export async function signIn(database: D1Like, passcode: string, userAgent: string | null): Promise<
  { ok: true; token: string; user: RequestUser } | { ok: false; reason: "no_credentials" | "locked" | "invalid" }
> {
  const credentials = await readCredentials(database);
  if (!credentials) return { ok: false, reason: "no_credentials" };
  if (credentials.locked_until && new Date(credentials.locked_until).getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }
  const candidate = await derivePasscode(passcode, base64UrlToBytes(credentials.passcode_salt), Number(credentials.iterations) || PBKDF2_ITERATIONS);
  if (!timingSafeEqual(candidate, credentials.passcode_hash)) {
    const failures = Number(credentials.failed_attempts ?? 0) + 1;
    const locked = failures >= LOCK_AFTER_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
    await database.prepare(`UPDATE owner_credentials SET failed_attempts=?, locked_until=?, updated_at=? WHERE id='owner'`)
      .bind(locked ? 0 : failures, locked, new Date().toISOString()).run();
    return { ok: false, reason: "invalid" };
  }
  await database.prepare(`UPDATE owner_credentials SET failed_attempts=0, locked_until=NULL, updated_at=? WHERE id='owner'`)
    .bind(new Date().toISOString()).run();

  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const now = new Date();
  await database.prepare(`INSERT INTO owner_sessions (token_hash,user_id,created_at,expires_at,last_seen_at,user_agent) VALUES (?,?,?,?,?,?)`)
    .bind(await sha256Hex(token), credentials.owner_user_id, now.toISOString(),
      new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString(), now.toISOString(), userAgent).run();
  // One cleanup per sign-in keeps the table bounded without a scheduled job.
  await database.prepare(`DELETE FROM owner_sessions WHERE expires_at < ?`).bind(now.toISOString()).run();
  const profile = await ownerProfile(database, credentials.owner_user_id);
  return { ok: true, token, user: ownerIdentity(credentials.owner_user_id, profile.email, profile.displayName) };
}

/**
 * Maps a stored owner profile id onto the request identity.
 *
 * `users.id` is `user:<identity_key>` while `headerIdentity` exposes the bare
 * identity key, and `ensureUser` re-adds the prefix.  Returning the stored row id
 * unchanged would therefore create a SECOND learner (`user:user:...`) and the
 * browser's attempts would land outside the existing history.  Strip the prefix
 * so a browser session resolves to the very same row the learner already has.
 */
export const CLOUD_PROVIDER = "workbuddy";

/**
 * Verifies a WorkBuddy cloud access token against the application's own Auth data
 * plane and returns the stable identity subject.
 *
 * The request mirrors exactly what the SDK sends for `getUser()`: the
 * publishable key in `x-wb-webapp-access-key`, the end-user token in
 * `Authorization`.  The signing key never leaves the cloud backend, so this is
 * the documented way for the app's own server to trust a browser session.
 */
/**
 * Binds a cloud-authenticated identity to the EXISTING owner profile, or refuses.
 *
 * The first identity to sign in becomes the owner.  Every later identity that does
 * not match is refused, which is what keeps a single learner's attempts, progress
 * and review state reachable by exactly one account.
 */
export async function bindOwnerIdentity(
  database: D1Like,
  identity: { subject: string; email: string | null },
): Promise<{ ok: true; user: RequestUser } | { ok: false; reason: "no_owner_credentials" | "bound_to_another_identity" | "email_not_allowed" }> {
  const credentials = await readCredentials(database);
  if (!credentials) return { ok: false, reason: "no_owner_credentials" };

  // When the deployment names the owner mailbox, only that mailbox may bind.  This
  // is what stops a stranger who happens to reach the login page first from
  // claiming the learner's history.
  const settings = await readLoginSettings(database);
  if (settings.expectedOwnerEmail) {
    const presented = (identity.email ?? "").trim().toLowerCase();
    if (!presented || presented !== settings.expectedOwnerEmail) return { ok: false, reason: "email_not_allowed" };
  }

  const rows = await database.prepare(`SELECT provider_subject, owner_user_id FROM owner_identity_bindings WHERE provider=?`)
    .bind(CLOUD_PROVIDER).all<{ provider_subject: string; owner_user_id: string }>();
  const bindings = rows.results ?? [];
  const now = new Date().toISOString();

  if (bindings.length) {
    const match = bindings.find((row) => row.provider_subject === identity.subject);
    if (!match) return { ok: false, reason: "bound_to_another_identity" };
    await database.prepare(`UPDATE owner_identity_bindings SET last_seen_at=?, email=COALESCE(?,email) WHERE provider=? AND provider_subject=?`)
      .bind(now, identity.email, CLOUD_PROVIDER, identity.subject).run();
  } else {
    await database.prepare(`INSERT INTO owner_identity_bindings (provider,provider_subject,owner_user_id,email,created_at,last_seen_at) VALUES (?,?,?,?,?,?)`)
      .bind(CLOUD_PROVIDER, identity.subject, credentials.owner_user_id, identity.email, now, now).run();
  }

  const profile = await ownerProfile(database, credentials.owner_user_id);
  return { ok: true, user: ownerIdentity(credentials.owner_user_id, profile.email, profile.displayName) };
}

/** Issues a session for an already-authenticated identity (email login path). */
export async function startOwnerSession(database: D1Like, user: RequestUser, userAgent: string | null): Promise<string> {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const now = new Date();
  await database.prepare(`INSERT INTO owner_sessions (token_hash,user_id,created_at,expires_at,last_seen_at,user_agent) VALUES (?,?,?,?,?,?)`)
    .bind(await sha256Hex(token), user.userId, now.toISOString(),
      new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString(), now.toISOString(), userAgent).run();
  await database.prepare(`DELETE FROM owner_sessions WHERE expires_at < ?`).bind(now.toISOString()).run();
  return token;
}

/** The passcode path stays available only while the rollback switch allows it. */
export async function passwordLoginEnabled(database: D1Like): Promise<boolean> {
  const settings = await readLoginSettings(database);
  return settings.passwordLoginEnabled;
}

export type LoginSettings = { passwordLoginEnabled: boolean; expectedOwnerEmail: string | null };

export async function readLoginSettings(database: D1Like): Promise<LoginSettings> {
  const row = await database.prepare(`SELECT password_login_enabled, expected_owner_email FROM owner_login_settings WHERE id='owner'`)
    .bind().first<{ password_login_enabled: number; expected_owner_email: string | null }>();
  const expected = typeof row?.expected_owner_email === "string" && row.expected_owner_email.trim()
    ? row.expected_owner_email.trim().toLowerCase()
    : null;
  return { passwordLoginEnabled: Number(row?.password_login_enabled ?? 1) === 1, expectedOwnerEmail: expected };
}

export type CloudTokenCheck =
  | { ok: true; subject: string; email: string | null; context: string }
  | { ok: false; stage: "token_missing" | "request_failed" | "rejected" | "no_subject"; status: number; code: string | null; context: string };

/**
 * Verifies a WorkBuddy cloud access token against the application's own Auth data
 * plane and returns the stable identity subject.
 *
 * The request mirrors exactly what the SDK sends for `getUser()`: the publishable
 * key in `x-wb-webapp-access-key`, the end-user token in `Authorization`.  The
 * signing key never leaves the cloud backend, so this is the documented way for the
 * app's own server to trust a browser session.
 *
 * Failures are reported as a stage plus the data plane's error code — never the
 * token — so a real failure can be diagnosed without leaking credentials.
 */
export async function verifyCloudAccessToken(accessToken: string): Promise<CloudTokenCheck> {
  if (!accessToken || accessToken.length > 4096) return { ok: false, stage: "token_missing", status: 0, code: null, context: "none" };

  const sdkHeaders: Record<string, string> = {
    "x-wb-webapp-access-key": CLOUD_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`,
  };
  const base: Record<string, string> = { ...sdkHeaders, Accept: "application/json" };
  /**
   * The SDK documents that a session handle is bound to the application AND to the
   * Origin, and that the server side matches the Origin exactly.  A browser request
   * to this same endpoint always carries Origin/Referer/Sec-Fetch-*; a plain
   * server-side fetch carries none, which is answered as `invalid_grant`
   * ("issued for another client") even for a perfectly valid session.
   *
   * So the verifier reproduces the browser's application context and tries the
   * shapes in order of decreasing fidelity to the official `getUser()` request,
   * stopping at the first acceptance.  Every attempt targets the SAME official
   * endpoint — only the surrounding context differs.
   */
  const variants: { name: string; headers: Record<string, string> }[] = [
    { name: "app_context", headers: { ...base, Origin: CLOUD_RELEASE_ORIGIN, Referer: `${CLOUD_RELEASE_ORIGIN}/login`, "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty" } },
    { name: "origin_only", headers: { ...base, Origin: CLOUD_RELEASE_ORIGIN } },
    { name: "sdk_exact", headers: sdkHeaders },
    { name: "bare", headers: base },
  ];

  let last: Extract<CloudTokenCheck, { ok: false }> = { ok: false, stage: "request_failed", status: 0, code: null, context: variants[0].name };
  for (const variant of variants) {
    let response: Response;
    try {
      response = await fetch(`${CLOUD_AUTH_DATA_PLANE}/v1/user/me`, { headers: variant.headers });
    } catch {
      last = { ok: false, stage: "request_failed", status: 0, code: null, context: variant.name };
      continue;
    }
    const payload: any = await response.json().catch(() => null);
    if (!response.ok) {
      const code = typeof payload?.error === "string" ? payload.error : typeof payload?.code === "string" ? payload.code : null;
      last = { ok: false, stage: "rejected", status: response.status, code, context: variant.name };
      continue;
    }
    // The data plane returns the user object directly; accept a `data` wrapper too
    // so the check cannot silently pass on a shape change.
    const raw = payload?.data ?? payload ?? {};
    const subject = typeof raw.sub === "string" ? raw.sub : typeof raw.uid === "string" ? raw.uid : "";
    if (!subject) {
      last = { ok: false, stage: "no_subject", status: response.status, code: null, context: variant.name };
      continue;
    }
    const email = typeof raw.email === "string" ? raw.email : typeof raw.user_metadata?.email === "string" ? raw.user_metadata.email : null;
    return { ok: true, subject, email, context: variant.name };
  }
  return last;
}

export function ownerIdentity(userId: string, email?: string | null, displayName?: string | null): RequestUser {
  const bare = userId.startsWith("user:") ? userId.slice(5) : userId;
  return { userId: bare, email: email ?? `${bare}@local`, displayName: displayName ?? "Owner" };
}

/** Cached for the isolate: the owner's profile row does not change while running. */
let cachedProfile: { key: string; email: string | null; displayName: string | null } | null = null;

async function ownerProfile(database: D1Like, ownerUserId: string): Promise<{ email: string | null; displayName: string | null }> {
  if (cachedProfile?.key === ownerUserId) return cachedProfile;
  let row: { email?: string | null; display_name?: string | null } | null = null;
  try {
    row = await database.prepare(`SELECT email,display_name FROM users WHERE id=?`).bind(ownerUserId).first<{ email: string | null; display_name: string | null }>();
  } catch {
    row = null;
  }
  cachedProfile = { key: ownerUserId, email: row?.email ?? null, displayName: row?.display_name ?? null };
  return cachedProfile;
}

/** Server-side session lookup.  Returns null for a missing, unknown or expired session. */
export async function sessionUser(database: D1Like, request: Request): Promise<RequestUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || token.length > 200) return null;
  const row = await database.prepare(`SELECT token_hash,user_id,expires_at,last_seen_at FROM owner_sessions WHERE token_hash=?`)
    .bind(await sha256Hex(token)).first<{ token_hash: string; user_id: string; expires_at: string; last_seen_at: string }>();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await database.prepare(`DELETE FROM owner_sessions WHERE token_hash=?`).bind(row.token_hash).run();
    return null;
  }
  if (Date.now() - new Date(row.last_seen_at).getTime() > LAST_SEEN_REFRESH_MS) {
    await database.prepare(`UPDATE owner_sessions SET last_seen_at=? WHERE token_hash=?`).bind(new Date().toISOString(), row.token_hash).run();
  }
  const profile = await ownerProfile(database, row.user_id);
  return ownerIdentity(row.user_id, profile.email, profile.displayName);
}

export async function signOut(database: D1Like, request: Request): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || token.length > 200) return;
  await database.prepare(`DELETE FROM owner_sessions WHERE token_hash=?`).bind(await sha256Hex(token)).run();
}
