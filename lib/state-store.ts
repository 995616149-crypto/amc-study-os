/**
 * Durable storage for MUTABLE learner state.
 *
 * THE PROBLEM THIS SOLVES (measured, not assumed)
 * ----------------------------------------------
 * The deployment ships its D1 file inside the uploaded project tree and starts
 * `wrangler dev --local --persist-to .wrangler/state`, so every publish replaces the
 * live database with the developer's local copy.  A marker row written on the live
 * site really did disappear after a republish, and the attempt count really did fall
 * back 28 -> 27.
 *
 * Content (questions, textbook sections/blocks, canonical tables) is immutable and
 * rebuildable, so it may keep travelling inside the bundled D1.  Anything a learner
 * produces may not.
 *
 * THE SHAPE
 * ---------
 * `contentDb`  — the bundled D1, unchanged.
 * `stateDb`    — WorkBuddy Cloud Database (PostgreSQL), reached over the app's own
 *                `/.cloud/database/rest` data plane.
 *
 * The cloud side stores one row per source table, holding that table's rows as JSON
 * (`app_state_snapshot`, see `cloud/0063_state_store.sql`).  That table is NOT
 * reachable with the publishable key — RLS is on with no policy and every table
 * privilege is revoked — and the only way in is the two SECURITY DEFINER functions,
 * both of which require a server-side secret.
 *
 * Why a row-level mirror instead of one Postgres column per SQLite column: the app's
 * mutable statements are written in SQLite dialect.  Hand-translating their WHERE /
 * ORDER BY / LIKE / subqueries into PostgREST would put the learner's record behind a
 * translator that can fail silently.  A JSON row cannot be mistranslated — whatever
 * was read is exactly what is written back, and the restore path is plain SQLite
 * again.  Field names, primary keys and semantics are preserved verbatim.
 *
 * GUARANTEES
 * ----------
 * 1. Nothing is uploaded until the live state has been read back at least once
 *    (`restoreState`).  Without that guard a failed restore after a republish would
 *    serve the developer's stale snapshot and then overwrite the live copy with it —
 *    the very data loss this module exists to stop.
 * 2. A write is durable before its request continues: `run()` uploads synchronously.
 * 3. Revisions only move forward, so a stale writer cannot win.
 *
 * Server-only.  It reads a secret and must never be imported from a client component.
 */
import { env } from "cloudflare:workers";

import { CLOUD_ENABLED, CLOUD_ENDPOINT, CLOUD_PUBLISHABLE_KEY } from "./cloud-config";

/**
 * Server-side secret that authorises the two `SECURITY DEFINER` RPCs.
 *
 * Set `STATE_SECRET` in the server environment to enable cloud state mirroring.
 * When it is absent the app runs in local-only mode: learner state is written
 * straight to the bundled D1 database and never leaves the deployment. That is
 * the intended default for self-hosted installs, which have no cloud backend.
 */
const STATE_SECRET = ((): string => {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.STATE_SECRET ?? "";
})();

/** Cloud mirroring is active only when both the endpoint and its secret exist. */
const cloudStateEnabled = (): boolean =>
  CLOUD_ENABLED && STATE_SECRET.length > 0 && CLOUD_ENDPOINT.length > 0;

const RPC_BASE = `${CLOUD_ENDPOINT}/.cloud/database/rest/rpc`;
const UPLOAD_TIMEOUT_MS = 15_000;

/**
 * Every table that holds mutable/learner-generated state.  A table is either here or
 * it is content; there is no third case, and no statement in the app joins across the
 * two sets (verified: the only cross-table joins are attempts×question_concept_map
 * and textbook_section×textbook_chapter, each wholly inside one set).
 */
export const STATE_TABLES = [
  "users",
  "owner_sessions",
  "owner_credentials",
  "owner_password_credentials",
  "owner_identity_bindings",
  "owner_login_settings",
  "attempts",
  "practice_position",
  "study_notes",
  "review_state",
  "concept_fsrs_state",
  "node_evidence",
  "vocabulary",
  "current_answer_versions",
  "guidance_evidence_cache",
  "guidance_node_evidence_cache",
  "guidance_verification_history",
  "guidance_source_metadata",
  "coach_runs",
  "translation_cache",
  "explanation_translations",
  "vocabulary_lookup_cache",
  "question_textbook_link",
  "question_concept_map",
  "daily_stats",
  "weekly_stats",
  "monthly_stats",
  "data_hygiene_migrations",
  "source_answer_recovery",
] as const;

export const STATE_TABLE_SET: ReadonlySet<string> = new Set(STATE_TABLES);

type Row = Record<string, unknown>;

/** Minimal D1 surface this module needs. */
type RawDb = {
  prepare(sql: string): any;
  batch?(statements: unknown[]): Promise<unknown>;
  exec?(sql: string): Promise<unknown>;
};

function rawDb(): RawDb | null {
  const binding = (env as unknown as { DB?: RawDb }).DB;
  return binding ?? null;
}

/* ------------------------------------------------------------------ */
/* cloud transport                                                     */
/* ------------------------------------------------------------------ */

async function rpc<T>(fn: string, body: unknown, timeoutMs = UPLOAD_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${RPC_BASE}/${fn}`, {
      method: "POST",
      headers: {
        "x-wb-webapp-access-key": CLOUD_PUBLISHABLE_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`STATE_HTTP_${response.status}: ${detail.slice(0, 200)}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* revision                                                            */
/* ------------------------------------------------------------------ */

let revision = 0;
export function stateRevision(): number {
  return revision;
}

/* ------------------------------------------------------------------ */
/* statement inspection (identify the table, never rewrite the SQL)     */
/* ------------------------------------------------------------------ */

const WRITE_RE = /^\s*(?:INSERT|REPLACE|UPDATE|DELETE)\b/i;
const TABLE_RE = /^\s*(?:INSERT\s+(?:OR\s+\w+\s+)?INTO|REPLACE\s+INTO|UPDATE|DELETE\s+FROM)\s+[`"[]?(\w+)/i;

function writtenTable(sql: string): string | null {
  if (!WRITE_RE.test(sql)) return null;
  const match = TABLE_RE.exec(sql);
  return match ? match[1] : null;
}

/* ------------------------------------------------------------------ */
/* restore                                                             */
/* ------------------------------------------------------------------ */

let ready: Promise<boolean> | null = null;

/**
 * Make sure the live learner state has been read back before anything is served or
 * written.  Idempotent; on failure it clears itself so the next request retries.
 */
export function ensureStateReady(): Promise<boolean> {
  // Local-only mode has nothing to restore: the bundled D1 database IS the state.
  if (!cloudStateEnabled()) return Promise.resolve(true);
  if (!ready) {
    ready = restoreState().catch((error) => {
      console.error("state_restore_failed", error);
      ready = null;
      return false;
    });
  }
  return ready;
}

async function restoreState(): Promise<boolean> {
  const rows = await rpc<any[]>("amc_state_load", { p_secret: STATE_SECRET });
  const db = rawDb();
  if (!db) return false;

  if (!Array.isArray(rows) || rows.length === 0) {
    // No durable copy yet: the bundled state is the seed, and this process becomes
    // the first writer.  Seeding here (rather than on the next write) means the very
    // first publish already leaves a restorable copy behind.
    revision = 1;
    await seedAll(db);
    return true;
  }

  let maxRevision = 0;
  let restored = 0;
  const statements: unknown[] = [
    // State tables reference each other (attempts -> question_concept_map, …), so a
    // table-by-table replace trips the foreign keys as soon as a parent is emptied.
    // Deferring the checks to the end of the batch is the supported way to swap a
    // consistent set of rows: the end state is consistent, and the intermediate one
    // is never observed.
    db.prepare("PRAGMA defer_foreign_keys = true"),
  ];

  for (const row of rows) {
    const table = String(row?.table_name ?? "");
    if (!STATE_TABLE_SET.has(table)) continue;
    maxRevision = Math.max(maxRevision, Number(row?.revision) || 0);
    const payload = Array.isArray(row?.payload) ? (row.payload as Row[]) : [];
    statements.push(db.prepare(`DELETE FROM ${table}`));
    // Column names come from the payload itself — it was produced by `SELECT *`, so
    // its keys ARE the table's columns, and no schema round trip is needed.
    for (const item of payload) {
      const columns = Object.keys(item ?? {});
      if (!columns.length) continue;
      const placeholders = columns.map(() => "?").join(",");
      statements.push(
        db
          .prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders})`)
          .bind(...columns.map((name) => normalize(item[name]))),
      );
    }
    restored += 1;
  }

  // One round trip for the whole restore: cheap enough that the first request of an
  // isolate pays for it once, and it cannot leave the tables half-swapped.
  await db.batch(statements);
  revision = maxRevision + 1;
  console.log("state_restored", JSON.stringify({ tables: restored, statements: statements.length, revision }));
  return true;
}

function normalize(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

async function selectAll(db: RawDb, table: string): Promise<Row[]> {
  const result = await db.prepare(`SELECT * FROM ${table}`).all<any>();
  return (result?.results ?? []) as Row[];
}

/* ------------------------------------------------------------------ */
/* upload                                                              */
/* ------------------------------------------------------------------ */

const dirty = new Set<string>();
let uploadChain: Promise<void> | null = null;

function markDirty(table: string | null): void {
  if (table && STATE_TABLE_SET.has(table)) dirty.add(table);
}

function requestUpload(): Promise<void> {
  if (!cloudStateEnabled()) {
    dirty.clear();
    return Promise.resolve();
  }
  if (uploadChain) return uploadChain;
  uploadChain = (async () => {
    try {
      // Never publish before the live state is known — see GUARANTEES §1.
      if (!(await ensureStateReady())) return;
      while (dirty.size) {
        const table = [...dirty][0];
        dirty.delete(table);
        await uploadTable(table);
      }
    } catch (error) {
      console.error("state_upload_failed", error);
    } finally {
      uploadChain = null;
    }
  })();
  return uploadChain;
}

async function uploadTable(table: string): Promise<void> {
  const db = rawDb();
  if (!db) return;
  const rows = await selectAll(db, table);
  const next = revision + 1;
  await rpc("amc_state_sync", {
    p_secret: STATE_SECRET,
    p_table: table,
    p_revision: next,
    p_rows: rows.length,
    p_payload: rows,
  });
  revision = next;
}

async function seedAll(db: RawDb): Promise<void> {
  for (const table of STATE_TABLES) {
    try {
      await uploadTable(table);
    } catch (error) {
      console.error("state_seed_failed", table, error);
    }
  }
}

/* ------------------------------------------------------------------ */
/* the thin adapter                                                    */
/* ------------------------------------------------------------------ */

const WRAPPED = Symbol.for("amc.state.wrapped");

/**
 * Wrap the D1 binding so that a write to a state table also makes that table's row
 * set durable in the cloud.  The SQL is never rewritten — the wrapper only *observes*
 * which table a statement writes.
 */
export function wrapStateDb(raw: any): any {
  if (!raw || typeof raw.prepare !== "function" || raw[WRAPPED]) return raw;

  const makeStatement = (sql: string, table: string | null, bound: any) => {
    const exec = () => (bound ? bound : raw.prepare(sql));
    return {
      __sql: sql,
      __table: table,
      async run() {
        // Gate every statement on the live state being known, so no read can serve a
        // stale bundled snapshot and no write can land before the restore.
        await ensureStateReady();
        const result = await exec().run();
        if (table) {
          markDirty(table);
          await requestUpload();
        }
        return result;
      },
      async first(column?: string) {
        await ensureStateReady();
        return exec().first(column);
      },
      async all() {
        await ensureStateReady();
        return exec().all();
      },
      raw() {
        return bound;
      },
    };
  };

  const wrapped = {
    [WRAPPED]: true,
    prepare(sql: string) {
      const table = writtenTable(sql);
      return {
        ...makeStatement(sql, table, null),
        bind(...values: unknown[]) {
          return makeStatement(sql, table, raw.prepare(sql).bind(...values));
        },
      };
    },
    async batch(statements: unknown[]) {
      await ensureStateReady();
      const tables = new Set<string>();
      for (const statement of statements ?? []) {
        const table = (statement as { __table?: string | null })?.__table;
        if (table) tables.add(table);
      }
      const bound = (statements ?? []).map((statement) => {
        const raw0 = (statement as { raw?: () => unknown })?.raw?.();
        return raw0 ?? statement;
      });
      const result = raw.batch ? await raw.batch(bound) : await Promise.all(bound.map((s: any) => s.run()));
      if (tables.size) {
        for (const table of tables) markDirty(table);
        await requestUpload();
      }
      return result;
    },
    async exec(sql: string) {
      await ensureStateReady();
      return raw.exec ? raw.exec(sql) : undefined;
    },
  };
  return wrapped;
}
