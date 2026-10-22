/**
 * Shared helpers for the deployable /api/textbook/* routes.
 *
 * Everything here reads the DEPLOYED D1 database — the readable textbook layer
 * added by `drizzle/0062_textbook_reader.sql` plus the search index from
 * `drizzle/0061_textbook_section_index.sql`.  There is deliberately no
 * `node:fs` / `node:sqlite` import anywhere in this folder: the corpus artefacts
 * (3.9 GB of page rasters and per-chapter assets) cannot ship with the Worker, and
 * the text that CAN ship lives in the database.  A route that touched the
 * filesystem would work locally and 500 in production, which is exactly the defect
 * this module removes.
 *
 * The textbook is copyrighted teaching material, so every content route requires
 * an authenticated caller and marks its responses `private`.
 */
import { env } from "cloudflare:workers";

import { currentUser, type RequestUser } from "../_shared";

export type D1 = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
    };
  };
};

export function json(data: unknown, status = 200, cache = "private, max-age=600") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}

export function bad(message: string, status = 400) {
  return json({ error: message }, status, "no-store");
}

/** Resolve the caller, or return the 401 the route should send back. */
export async function requireUser(request: Request): Promise<{ user: RequestUser } | { response: Response }> {
  let user: RequestUser | null = null;
  try {
    user = await currentUser(request);
  } catch {
    user = null;
  }
  if (!user) return { response: json({ error: "Sign in required" }, 401, "no-store") };
  return { user };
}

export function database(): D1 {
  const binding = (env as unknown as { DB?: D1 }).DB;
  if (!binding) throw new Error("D1 binding unavailable");
  return binding;
}

/** A section whose id collides with another one carries `@chapter_id` in its uid. */
export function decodeParam(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const BOOK_ID = "book:murtagh-gp-9e";
