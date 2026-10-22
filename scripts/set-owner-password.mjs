#!/usr/bin/env node
/**
 * Set (or reset) the local owner password.
 *
 * The app is single-owner: every practice, note and review row belongs to one
 * principal, and the API refuses anonymous callers. A fresh clone therefore needs
 * one credential before it can be used.
 *
 * Usage:
 *   node scripts/set-owner-password.mjs --username you --password 'your-password'
 *   node scripts/set-owner-password.mjs            (prompts for both)
 *
 * Algorithm matches lib/owner-auth.ts: PBKDF2-SHA256, 210,000 iterations, 256-bit
 * output, base64url encoded — so the value written here verifies at runtime.
 */
import { createInterface } from "node:readline";
import { randomBytes, pbkdf2Sync } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ITERATIONS = 210_000;

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function findDatabase() {
  const dir = join(ROOT, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  if (!existsSync(dir)) return null;
  const candidates = readdirSync(dir)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => join(dir, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return candidates[0] ?? null;
}

const base64url = (buffer) =>
  buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function prompt(question, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (!hidden) {
    const answer = await new Promise((done) => rl.question(question, done));
    rl.close();
    return answer;
  }
  process.stdout.write(question);
  const stdin = process.stdin;
  const wasRaw = stdin.isRaw;
  stdin.setRawMode?.(true);
  let value = "";
  for await (const chunk of stdin) {
    const text = chunk.toString("utf8");
    if (text.includes("\r") || text.includes("\n")) break;
    if (text === "\u0003") {
      rl.close();
      process.exit(130);
    }
    if (text === "\u007f" || text === "\b") {
      value = value.slice(0, -1);
      continue;
    }
    value += text;
  }
  stdin.setRawMode?.(wasRaw ?? false);
  process.stdout.write("\n");
  rl.close();
  return value;
}

const dbPath = findDatabase();
if (!dbPath) {
  console.error("No local database found. Run `npm run dev` once, then re-run this script.");
  process.exit(1);
}

const username = arg("--username") ?? (await prompt("Owner username: ")).trim();
const password = arg("--password") ?? (await prompt("Owner password: ", { hidden: true }));

if (!username || !password) {
  console.error("Both username and password are required.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Use a password of at least 8 characters.");
  process.exit(1);
}

const salt = base64url(randomBytes(16));
const hash = base64url(pbkdf2Sync(password, Buffer.from(salt.replace(/-/g, "+").replace(/_/g, "/"), "base64"), ITERATIONS, 32, "sha256"));
const now = new Date().toISOString();

const db = new DatabaseSync(dbPath);
db.prepare(
  `INSERT INTO owner_password_credentials (id, username, password_hash, password_salt, algorithm, params, created_at, updated_at)
   VALUES ('owner', ?, ?, ?, 'pbkdf2-sha256', ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET username=excluded.username, password_hash=excluded.password_hash,
     password_salt=excluded.password_salt, algorithm=excluded.algorithm, params=excluded.params,
     updated_at=excluded.updated_at`,
).run(username, hash, salt, JSON.stringify({ iterations: ITERATIONS }), now, now);

db.prepare(
  `INSERT INTO owner_login_settings (id, password_login_enabled, expected_owner_email, updated_at)
   VALUES ('owner', 1, NULL, ?)
   ON CONFLICT(id) DO UPDATE SET password_login_enabled=1, updated_at=excluded.updated_at`,
).run(now);

db.prepare(
  `INSERT INTO users (id, identity_key, email, display_name, created_at, updated_at)
   VALUES ('user:preview-user', 'preview-user', 'owner@local', 'Owner', ?, ?)
   ON CONFLICT(id) DO NOTHING`,
).run(now, now);

db.close();
console.log(`owner password set for "${username}" — sign in at /login`);
