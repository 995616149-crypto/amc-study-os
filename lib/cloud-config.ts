/**
 * Optional cloud-service configuration.
 *
 * Every value here is empty by default, so a fresh clone runs with no external
 * services at all: content lives in the bundled D1 database and learner state is
 * written straight to it. Setting these variables enables the hosted variant
 * (cloud state mirroring, keyless LLM calls, hosted sign-in).
 *
 * None of these values are secret. The publishable key is designed to ship in the
 * browser bundle; authorisation is enforced server-side by the provider. Anything
 * genuinely secret belongs in a server-only environment variable, never here.
 *
 * Reads work in three contexts:
 *   - Vite client bundle: `import.meta.env.VITE_*` is inlined at build time
 *   - Worker runtime: `process.env` (available via `nodejs_compat`)
 *   - Node scripts: `process.env`
 */

function readEnv(name: string): string {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env;
  const fromVite = viteEnv?.[`VITE_${name}`];
  if (typeof fromVite === "string" && fromVite.length > 0) return fromVite;

  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const fromProc = proc?.env?.[name];
  if (typeof fromProc === "string" && fromProc.length > 0) return fromProc;

  return "";
}

/** Base URL of the app's own deployment. Empty means "same origin as the request". */
export const CLOUD_RELEASE_ORIGIN = readEnv("CLOUD_RELEASE_ORIGIN");

/** Data-plane base URL; falls back to the release origin when unset. */
export const CLOUD_ENDPOINT = readEnv("CLOUD_ENDPOINT") || CLOUD_RELEASE_ORIGIN;

export const CLOUD_AUTH_DATA_PLANE = CLOUD_ENDPOINT ? `${CLOUD_ENDPOINT}/.cloud/auth` : "";

/** OAuth relay used only by hosted QR sign-in. */
export const CLOUD_OAUTH_RELAY_BASE_URL = readEnv("CLOUD_OAUTH_RELAY_BASE_URL");

export const CLOUD_PUBLISHABLE_KEY = readEnv("CLOUD_PUBLISHABLE_KEY");
export const CLOUD_RESOURCE_ID = readEnv("CLOUD_RESOURCE_ID");
export const CLOUD_APP_ID = readEnv("CLOUD_APP_ID");

/**
 * True when a cloud backend is configured. Callers must treat `false` as the
 * normal local-only mode, not as an error.
 */
export const CLOUD_ENABLED = Boolean(CLOUD_ENDPOINT && CLOUD_PUBLISHABLE_KEY);
