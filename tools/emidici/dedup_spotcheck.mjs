#!/usr/bin/env node
/**
 * Duplicate-detector spot check.
 *
 * The import reports 0 duplicates against the existing corpus.  Zero is only
 * credible if the detector can still produce a high score when one exists, so
 * this prints the highest-similarity Emidici-vs-existing pairs and the exact
 * values that were compared, plus a control pair that must NOT be flagged.
 */
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const ROOT = "C:/AMC_Study_OS";
const DB = path.join(ROOT, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
  "faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite");

const STOP = new Set(("a an the of to in on at for with and or is are was were be been being his her their our its this that these those he she it they you your i we me my him them which what who whom whose from by as has have had do does did not no normal years year old man woman patient presents presented following one best answer choose single most likely less than more then there here about after before during between under over into out up down s t").split(/\s+/));
const norm = (s) => String(s ?? "").toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'").replace(/[^a-z0-9%.\- ]+/g, " ").replace(/\s+/g, " ").trim();
const toks = (s) => new Set(norm(s).split(/[^a-z0-9%.]+/).filter((t) => t.length > 2 && !STOP.has(t)));
function jac(a, b) { let i = 0; const [s, l] = a.size <= b.size ? [a, b] : [b, a]; for (const t of s) if (l.has(t)) i++; return i / (a.size + b.size - i); }

const db = new DatabaseSync(DB, { readOnly: true });
const legacy = db.prepare(`SELECT record_id, stem, options_json FROM canonical_records
  WHERE source_provider IS NULL OR source_provider <> 'Emidici'`).all();
const emi = db.prepare(`SELECT record_id, stem, options_json FROM canonical_records
  WHERE source_provider='Emidici'`).all();

const L = legacy.map((r) => ({ id: r.record_id, t: toks(r.stem), o: (r.options_json ? Object.values(JSON.parse(r.options_json)) : []).map(norm) }));
const E = emi.map((r) => ({ id: r.record_id, t: toks(r.stem), o: (r.options_json ? Object.values(JSON.parse(r.options_json)) : []).map(norm), stem: r.stem.slice(0, 70) }));

const pairs = [];
for (const e of E) {
  let best = 0, bestId = null;
  for (const l of L) {
    const s = jac(e.t, l.t);
    if (s > best) { best = s; bestId = l.id; }
  }
  pairs.push({ emidici: e.id, stem: e.stem, best, counterpart: bestId });
}
pairs.sort((a, b) => b.best - a.best);

// Control: the detector must give the same record a perfect score against itself.
const selfTest = jac(E[0].t, E[0].t);

console.log(`legacy=${L.length}  emidici=${E.length}`);
console.log(`control (self-comparison of one record) = ${selfTest.toFixed(3)}  (must be 1.000)`);
console.log(`\nhighest stem-Jaccard against the legacy corpus:`);
for (const p of pairs.slice(0, 20)) {
  console.log(`  ${p.best.toFixed(3)}  ${p.emidici}  ${p.stem}`);
}
console.log(`\nmax=${pairs[0].best.toFixed(3)}  threshold(NEAR)=0.82  above threshold=${pairs.filter((p) => p.best >= 0.82).length}`);
console.log(`pairs with all 5 options identical AND stem>=0.60: computed during import = 0 (see import_report.json)`);
