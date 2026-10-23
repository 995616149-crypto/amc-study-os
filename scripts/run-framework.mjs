import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);

// Vite's dependency optimizer issues loopback HTTP requests to the dev server it
// just started. When the shell exports HTTP_PROXY/HTTPS_PROXY (common behind a
// corporate proxy or a local VPN client), Vite routes those requests through the
// proxy, which cannot reach localhost and resets the connection — the dev server
// then dies with ECONNRESET before it ever binds. NO_PROXY is not honoured by
// Vite's resolver, so drop the proxy variables for this process instead: the dev
// server only serves loopback traffic and needs no proxy.
if (!managedLinux && command === "dev") {
  for (const key of [
    "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY",
    "http_proxy", "https_proxy", "all_proxy", "no_proxy",
  ]) {
    delete process.env[key];
  }
}

process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);
