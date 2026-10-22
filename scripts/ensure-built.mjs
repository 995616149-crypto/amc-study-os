/**
 * Ensure `dist/` exists AND matches the current source before anything starts.
 *
 * Why this is needed for publishing: the publish sandbox uploads source only - build output
 * (`/dist/`) is excluded - and the start command (`npm start`) reads
 * `dist/server/wrangler.json`, which Wrangler refuses to start without. Building inside the
 * start command cannot work either: a full vinext build takes ~185 s here, far beyond the
 * ~60 s window the publish platform waits for the port to open.
 *
 * So the build is moved into the npm install phase (`prepare`), which has a generous timeout.
 *
 * IMPORTANT: a reused sandbox keeps the `dist/` produced by its FIRST publish. Checking only
 * for `dist/server/wrangler.json` therefore made every later publish silently serve the old
 * build - the site stayed on the previous UI while the deploy reported success. The guard is
 * now a source fingerprint: the build is skipped only when `dist/.build-inputs` matches the
 * uploaded source, and is re-run (after clearing the stale `.next` cache) otherwise.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const marker = fileURLToPath(new URL("../dist/server/wrangler.json", import.meta.url));
const stampPath = fileURLToPath(new URL("../dist/.build-inputs", import.meta.url));

/** Everything that can change the produced bundle. */
const INPUTS = [
  "app", "lib", "components", "db", "drizzle", "hooks", "scripts", "public",
  "package.json", "next.config.ts", "vite.config.ts", "tsconfig.json",
  "postcss.config.mjs", "components.json", "cloudflare-env.d.ts",
];
const SKIP = new Set(["node_modules", ".next", "dist", ".git", ".wrangler", "_staging", "_tmp", "research", "runtime_bundle"]);

function walk(path, hash) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    for (const name of readdirSync(path).sort()) {
      if (SKIP.has(name)) continue;
      walk(join(path, name), hash);
    }
    return;
  }
  hash.update(path.slice(projectRoot.length));
  hash.update("|");
  hash.update(String(stats.size));
  hash.update("|");
  hash.update(String(Math.round(stats.mtimeMs)));
  hash.update("\n");
}

function sourceFingerprint() {
  const hash = createHash("sha256");
  for (const input of INPUTS) {
    const path = join(projectRoot, input);
    if (existsSync(path)) walk(path, hash);
  }
  return hash.digest("hex").slice(0, 32);
}

const current = sourceFingerprint();
const recorded = existsSync(stampPath) ? readFileSync(stampPath, "utf8").trim() : "";

if (existsSync(marker) && recorded === current) {
  console.log("[ensure-built] dist matches the uploaded source - skipping build.");
  process.exit(0);
}

if (existsSync(marker)) {
  console.log(`[ensure-built] dist is stale (${recorded || "no fingerprint"} -> ${current}); rebuilding.`);
  // A stale `.next` cache is what let the old module graph survive a rebuild.
  try { rmSync(join(projectRoot, ".next"), { recursive: true, force: true }); } catch { /* best effort */ }
}

const result = spawnSync(process.execPath, ["scripts/run-framework.mjs", "build"], {
  cwd: projectRoot,
  stdio: ["ignore", "pipe", "pipe"],
  maxBuffer: 64 * 1024 * 1024,
  // The host may inject a node-language shim that breaks build-output cleanup; clear it.
  env: { ...process.env, NODE_OPTIONS: "" },
});

const stdout = (result.stdout ?? "").toString();
const stderr = (result.stderr ?? "").toString();
if (result.error) {
  console.error("[ensure-built] build could not be spawned:", result.error.message);
  process.exit(1);
}
if ((result.status ?? 1) !== 0) {
  // The publish platform truncates agent-visible output to a small budget, and the install
  // preamble already consumes most of it. Emit the shortest possible high-signal string.
  const all = (stderr + "\n" + stdout).split("\n").map((line) => line.trim()).filter(Boolean);
  const at = all.findIndex((line) => /Build failed|(?:^|\W)Error:|error during build/i.test(line));
  const block = all.slice(at >= 0 ? at : Math.max(0, all.length - 4),
                          (at >= 0 ? at : all.length) + 5).join(" / ");
  console.error("E[" + result.status + "] " + block.replace(/\s+/g, " ").slice(0, 260));
  process.exit(result.status ?? 1);
}

try { writeFileSync(stampPath, current, "utf8"); } catch { /* a missing stamp only costs one rebuild */ }
console.log("[ensure-built] build finished.");
process.exit(0);
