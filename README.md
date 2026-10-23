# AMC Study OS

A self-hosted study system for the AMC (Australian Medical Council) multiple-choice
examination. It turns a question bank plus a reference textbook into a single
practice surface with spaced repetition, per-topic mastery tracking, and optional
AI coaching.

Built with Next.js App Router, React 19, Cloudflare Workers/D1, Drizzle ORM and
Tailwind CSS 4.

---

## What it does

| Area | Capability |
| --- | --- |
| Practice | Chapter- and topic-targeted question sets, exam-style single-best-answer stems, per-question detail view with figures and tables |
| Explanations | Source-era answer retained verbatim; current-guideline layer kept separate so a 2015 answer is never silently presented as today's answer |
| Spaced repetition | FSRS scheduling per concept, with due queues driven by actual attempt history |
| Mastery tracking | Knowledge graph over chapters → topics → concepts; coverage and accuracy per node; daily / weekly / monthly rollups |
| Textbook reader | Full-text search (SQLite FTS5) across the reference textbook, with section-level retrieval and question-to-chapter mapping |
| AI coaching | Question coach, follow-up tutor, explanation translation, and contextual word lookup — all behind one provider adapter |
| Study state | Notes, saved practice position, attempt log, review state |

The content layer (questions, options, textbook, mappings) is treated as immutable
and rebuildable. The learner layer is separate, so a content refresh never touches
a learner's record.

---

## Quick start

Requires Node.js >= 22.13 and pnpm 11.

```bash
pnpm install

# 1. Start once so Miniflare creates the local D1 file, then stop it.
npm run dev

# 2. Apply the schema migrations and import the textbook corpus.
node scripts/setup-db.mjs

# 3. Start again.
npm run dev
```

The app is now at <http://localhost:8787>.

`npm run dev` builds if `dist/` is missing or stale, then serves the built Worker
through Wrangler on `127.0.0.1:8787`. The first run therefore takes a minute or
two longer while it compiles; later runs reuse the build.

`scripts/setup-db.mjs` is idempotent: migrations are recorded in `d1_migrations`,
and the textbook seed is skipped when rows already exist. Pass `--force` to re-run
everything.

### Verify the database

```bash
node scripts/setup-db.mjs          # prints row counts for the key tables
```

Expected after a clean import: 6,345 questions, 31,720 options, 35,521 textbook
blocks.

### Production build

```bash
npm run build
npm start                          # serves the built Worker on 127.0.0.1
```

---

## Configuration

Everything is optional. With no `.env`, the app runs entirely locally: content and
learner state both live in the bundled D1 database.

Copy `.env.example` to `.env` to enable extras:

| Variable | Effect |
| --- | --- |
| `AI_API_KEY` | Enables every AI surface via any OpenAI-compatible endpoint |
| `AI_BASE_URL` | Provider base URL (default `https://api.openai.com/v1`) |
| `AI_MODEL` | Model name (default `gpt-4o-mini`) |
| `STATE_SECRET` | Enables mirroring learner state to a Postgres instance you control |
| `CLOUD_*` | Only for the hosted variant; leave empty when self-hosting |

Without `AI_API_KEY` the AI routes return a `not_configured` error and the rest of
the app is unaffected — practice, spacing, mastery and the textbook reader are all
local.

### Optional durable state mirror

A deployment that ships its D1 file inside the uploaded project tree will overwrite
live data on every republish. If that describes your host, run
`cloud/0063_state_store.sql` against a Postgres database (replacing the
`__SET_STATE_SECRET__` placeholder with your own random value) and set
`STATE_SECRET` to the same value. Learner state is then mirrored on every write,
and restored before the first read. Self-hosted installs with a persistent disk do
not need this.

---

## Data

The repository ships the content the app was built against:

| Path | Content |
| --- | --- |
| `drizzle/*.sql` | Schema plus the question bank (64 migrations) |
| `seed/textbook_seed.sql.gz` | Reference textbook: 131 chapters, 8,420 sections, 35,521 blocks, FTS index rebuilt on import |
| `textbooks/murtagh_gp_9e/` | Structured textbook source and figure assets |
| `public/emidici-assets/` | Question figures (1,125 images) |

**Licensing of the data is not the licensing of the code.** See `NOTICE` — the
question bank and the textbook are third-party published works, included here for
personal study and research only. If you are a rights holder and want something
removed, open an issue and it will be taken down.

If you do not want to use this content, replace the `drizzle/0003+` data migrations
and the textbook seed with your own; the schema and the application do not assume
any particular source.

---

## Architecture notes

- `app/` — routes. `app/api/*` are the data endpoints; `app/study-os.tsx` is the
  single-page practice surface.
- `lib/` — domain logic: FSRS scheduling, knowledge graph, textbook retrieval,
  answer governance, provider adapter, state store.
- `db/schema.ts` — 39 tables. Content tables are immutable; `STATE_TABLES` in
  `lib/state-store.ts` enumerates the mutable ones.
- `lib/ai-provider.ts` — the only place that talks to a model. Keyless hosted mode
  and BYO-key OpenAI-compatible mode both go through it.
- `cloud/` — optional Postgres schema for the state mirror.

The state store works by observing which table a write touches and mirroring that
table's rows as JSON. SQL is never rewritten, so SQLite semantics are preserved
exactly.

---

## Local development notes

- `npm run dev` — builds when needed, then serves the Worker at <http://localhost:8787>.
  No hot reload; re-run after a change.
- `npm start` — same server, skips the staleness check (assumes `dist/` is current).
- `npm run dev:hmr` — the upstream vinext dev server (port 5173) with hot reload.
  **Only works inside the hosting platform**: it forwards requests to a local
  `sites.test` service that does not exist on a normal machine, so it fails with
  `Error: read ECONNRESET` or HTTP 502. Use `npm run dev` unless you are debugging
  the framework itself.
- Restart after moving the checkout; Wrangler records the running server in `.wrangler/`
- `.wrangler/`, `.next/`, `.vinext/`, `dist/` are disposable

### Troubleshooting

**`npm run dev` prints `Error: read ECONNRESET` and exits.**
You are on the upstream HMR path. Since the fix in `scripts/run-framework.mjs`,
`npm run dev` no longer takes it; if you invoked `npm run dev:hmr` explicitly,
switch back. See the note above for why that path needs the hosting platform.

**`localhost` refuses the connection / nothing listens on the port.**
The dev server only binds after the build completes. Watch the terminal: you should
see `[ensure-built] build finished.` followed by `Ready on http://127.0.0.1:8787`.
If the process exits before that line, run `npm run build` on its own to surface
the real error.

**A proxy or VPN is running.**
`scripts/run-framework.mjs` clears `HTTP(S)_PROXY` for the HMR path because Vite's
dependency optimizer makes loopback requests that a proxy cannot serve. The default
`npm run dev` path does not use Vite's optimizer, so a proxy is harmless there.

---

## License

Code — `app/`, `lib/`, `components/`, `db/`, `scripts/`, `tools/`, `cloud/` — is
MIT licensed. See `LICENSE`.

Bundled content — `drizzle/` data migrations, `seed/`, `textbooks/`,
`public/emidici-assets/` — is **not** MIT licensed and remains the property of its
respective rights holders. See `NOTICE`.
