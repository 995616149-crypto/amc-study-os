/**
 * Start the built Worker preview.
 *
 * Two callers with different requirements:
 *
 *  - a developer running `npm start` locally, who wants the loopback preview the README
 *    documents (127.0.0.1, Wrangler's own port, extra args forwarded);
 *  - the publish platform, which injects `PORT` and requires the service to bind 0.0.0.0 on
 *    exactly that port, otherwise the reverse proxy reports "service not reachable".
 *
 * The previous inline script hardcoded `--ip 127.0.0.1` and no port, so a published build
 * started workerd on Wrangler's default 127.0.0.1:8787 and the platform could never reach it.
 * Here the binding follows `PORT`: present -> 0.0.0.0:$PORT, absent -> the local preview.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const deployed = Boolean(process.env.PORT);

// The publish platform appends `--host 0.0.0.0` (its generic Vite convention). Wrangler binds
// via `--ip`, so drop the alias to avoid passing an unknown flag through.
const forwarded = [];
const extra = process.argv.slice(2);
for (let i = 0; i < extra.length; i += 1) {
  if (extra[i] === "--host") {
    i += 1;
    continue;
  }
  forwarded.push(extra[i]);
}

const args = [
  "--import", "./scripts/sites-env.mjs",
  "./node_modules/wrangler/bin/wrangler.js", "dev",
  "--config", "dist/server/wrangler.json",
  "--local",
  "--persist-to", ".wrangler/state",
  "--ip", deployed ? "0.0.0.0" : "127.0.0.1",
  "--inspector-port", "0",
];
if (deployed) args.push("--port", process.env.PORT);
args.push(...forwarded);

const child = spawn(process.execPath, args, { cwd: projectRoot, stdio: "inherit", env: process.env });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
