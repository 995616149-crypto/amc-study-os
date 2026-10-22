/**
 * Minimal feature-flag layer.
 *
 * The project previously had no flag mechanism at all, so this reuses one tiny
 * `feature_flags` table (see drizzle/0057_current_answer_versions.sql) instead
 * of inventing a second subsystem.  A kill switch is a row update, and every
 * read fails *open* to the compile-time default so that a flag read can never
 * break the core practice flow.
 */

export const FEATURE_FLAGS = ["CURRENT_GUIDANCE_UI", "AI_COACH"] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export const FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  CURRENT_GUIDANCE_UI: true,
  AI_COACH: true,
};

type D1Like = {
  prepare(sql: string): {
    bind(...values: unknown[]): { all<T>(): Promise<{ results: T[] }> };
    all<T>(): Promise<{ results: T[] }>;
  };
};

export type FlagOverrides = Partial<Record<FeatureFlag, boolean>>;

let cache: { at: number; values: Record<FeatureFlag, boolean> } | null = null;
const CACHE_MS = 15_000;

function isFlag(value: unknown): value is FeatureFlag {
  return typeof value === "string" && (FEATURE_FLAGS as readonly string[]).includes(value);
}

/** Coarse process-local cache: a kill switch takes effect within 15 seconds. */
export function invalidateFeatureFlagCache(): void {
  cache = null;
}

export async function readFeatureFlags(
  database: D1Like | null,
  overrides: FlagOverrides = {},
): Promise<Record<FeatureFlag, boolean>> {
  const resolved: Record<FeatureFlag, boolean> = { ...FLAG_DEFAULTS };
  if (cache && Date.now() - cache.at < CACHE_MS) {
    Object.assign(resolved, cache.values);
  } else if (database) {
    try {
      const rows = await database.prepare(`SELECT flag,enabled FROM feature_flags`).all<{ flag: string; enabled: number }>();
      const values: Partial<Record<FeatureFlag, boolean>> = {};
      for (const row of rows.results ?? []) {
        if (isFlag(row.flag)) values[row.flag] = Number(row.enabled) === 1;
      }
      cache = { at: Date.now(), values: { ...FLAG_DEFAULTS, ...values } };
      Object.assign(resolved, cache.values);
    } catch {
      // Table not migrated yet, or the read failed: keep the defaults and never
      // let flag resolution throw into a practice request.
      cache = { at: Date.now(), values: { ...FLAG_DEFAULTS } };
    }
  }
  for (const flag of FEATURE_FLAGS) {
    if (typeof overrides[flag] === "boolean") resolved[flag] = overrides[flag] as boolean;
  }
  return resolved;
}

export function parseFlagOverride(raw: unknown): boolean | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim().toLowerCase();
  if (["0", "false", "off", "no", "disabled"].includes(value)) return false;
  if (["1", "true", "on", "yes", "enabled"].includes(value)) return true;
  return undefined;
}

/** Overrides sourced from the worker environment, e.g. AMC_FLAG_AI_COACH=0. */
export function flagOverridesFromEnv(runtime: Record<string, unknown> | null | undefined): FlagOverrides {
  if (!runtime) return {};
  const overrides: FlagOverrides = {};
  for (const flag of FEATURE_FLAGS) {
    const parsed = parseFlagOverride(runtime[`AMC_FLAG_${flag}`]);
    if (typeof parsed === "boolean") overrides[flag] = parsed;
  }
  return overrides;
}
