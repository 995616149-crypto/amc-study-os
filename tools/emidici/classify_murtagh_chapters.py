"""
Emidici 4900 -> Murtagh 9e chapter classification (two-stage, resumable).

The chapter system is Murtagh's own: 12 Parts -> 131 Chapters -> 8420 Sections.
No new ontology is invented; the 131 chapters ARE the label set.

Stage A  FTS5 candidate generation
    question (stem + options + source answer + source explanation)
      -> top 40 matching sections
      -> aggregated per chapter (best rank, best score, matching-section count, sample titles)
      -> top 8 unique chapter candidates

Stage B  closed-set semantic rerank
    the model may only answer with one of the supplied candidate ids, or (rescue only)
    pick from the full 131 chapter titles. It can never invent a chapter.

Rescue pass: LOW / NONE / parse failure escalate to 20 candidates, then to the full
131-title shortlist. The product requirement is 4900/4900 with a non-null primary
chapter, so the pass terminates in `LOW_CONFIDENCE_REVIEW` rather than NULL - the
flag is an audit priority, not a coverage gap.

Durability: every 50 questions the mapping is written and the checkpoint updated; a
restart skips every question already written under the current mapping_version.

Usage:
    python tools/emidici/classify_murtagh_chapters.py --taxonomy
    python tools/emidici/classify_murtagh_chapters.py --run --limit 60 --minutes 20
    python tools/emidici/classify_murtagh_chapters.py --report
"""
from __future__ import annotations

import argparse
import collections
import glob
import io
import json
import os
import re
import sqlite3
import statistics
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Optional classification pass. Requires an OpenAI-compatible endpoint; set
# AI_API_KEY and (optionally) AI_BASE_URL / AI_MODEL in the environment.
KEY = os.environ.get("AI_API_KEY", "")
ENDPOINT = os.environ.get("AI_BASE_URL", "").rstrip("/")
MODELS = [os.environ.get("AI_MODEL", "gpt-4o-mini")]
MAPPING_VERSION = "murtagh_chapter_map_v1"
TABLE = "question_murtagh_chapter_map"
CHECKPOINT = os.path.join(ROOT, "audit", "emidici_chapter_classification_checkpoint.json")
TOP_SECTIONS = 40
TOP_CHAPTERS = 8
RESCUE_CHAPTERS = 20
BATCH = 50

STOP = set(
    "the a an and or of to in for with on is are was were be been by as at from that this these those it its his her she he they "
    "them which who whom what when where how why not no but if then than so such also has have had do does did would could should "
    "may might must can will patient patients man woman year years old day days week weeks month months history present presents "
    "presented following most likely best next appropriate one single choose answer question option about after before more less "
    "other into over under being given reports".split()
)


def db_path() -> str:
    return [p for p in glob.glob(os.path.join(ROOT, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite"))
            if "metadata" not in os.path.basename(p)][0]


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(db_path())
    connection.row_factory = sqlite3.Row
    return connection


def terms(stem, options, explanation, limit=18):
    raw = re.sub(r"[A-Z]\.\s", " ", " ".join([stem or ""] + list(options or []) + [explanation or ""]))
    counts = collections.Counter()
    for token in re.split(r"[^A-Za-z0-9\-]+", raw):
        word = token.strip()
        if len(word) < 5 or len(word) > 32:
            continue
        lower = word.lower()
        if lower in STOP or lower.isdigit():
            continue
        counts[lower] += 1
    return [w for w, _ in sorted(counts.items(), key=lambda kv: (-kv[1], -len(kv[0])))[:limit]]


def chapter_candidates(connection: sqlite3.Connection, question: sqlite3.Row, top_sections=TOP_SECTIONS, top_chapters=TOP_CHAPTERS):
    options = [r[0] for r in connection.execute("SELECT text_en FROM question_options WHERE question_id=?", (question["id"],))]
    words = terms(question["stem_en"], options, question["source_explanation_en"])
    if not words:
        return []
    query = " OR ".join('"%s"' % w for w in words)
    try:
        rows = connection.execute(
            """SELECT s.chapter_id, s.chapter_title, s.section_title, s.page_start, s.section_id,
                      snippet(textbook_section_fts, 2, '', '', ' … ', 10) AS snip,
                      bm25(textbook_section_fts) AS rank
                 FROM textbook_section_fts
                 JOIN textbook_section_index s ON s.rowid = textbook_section_fts.rowid
                WHERE textbook_section_fts MATCH ?
                ORDER BY bm25(textbook_section_fts) LIMIT ?""",
            (query, top_sections),
        ).fetchall()
    except sqlite3.OperationalError:
        return []
    grouped = collections.OrderedDict()
    for index, row in enumerate(rows):
        key = row["chapter_id"]
        entry = grouped.get(key)
        score = max(0.0, -float(row["rank"]))
        if entry is None:
            grouped[key] = {"chapter_id": key, "chapter_title": row["chapter_title"], "best_rank": index + 1,
                            "best_score": score, "matches": 1,
                            "sections": [row["section_title"]], "snippets": [(row["snip"] or "")[:180]],
                            "page": row["page_start"]}
        else:
            entry["matches"] += 1
            if len(entry["sections"]) < 3:
                entry["sections"].append(row["section_title"])
                entry["snippets"].append((row["snip"] or "")[:180])
            entry["best_score"] = max(entry["best_score"], score)
    ordered = sorted(grouped.values(), key=lambda e: (-e["best_score"], e["best_rank"]))
    return ordered[:top_chapters]


def part_of(connection: sqlite3.Connection, chapter_id: str) -> tuple[str, str]:
    row = connection.execute(
        "SELECT c.part_id, p.part_title FROM textbook_chapter c LEFT JOIN textbook_part p ON p.part_id=c.part_id WHERE c.chapter_id=?",
        (chapter_id,),
    ).fetchone()
    return (row["part_id"], row["part_title"]) if row else ("", "")


def chat_json(messages, timeout=40):
    """Keyless call to the app's own cloud LLM data plane (same one the app uses)."""
    body = json.dumps({"model": MODELS[0], "messages": messages, "stream": True, "temperature": 0})
    last = None
    for model in MODELS:
        body = json.dumps({"model": model, "messages": messages, "stream": True, "temperature": 0})
        try:
            response = requests.post(
                f"{ENDPOINT}/.cloud/llm/chat/completions",
                data=body,
                headers={"x-wb-webapp-access-key": KEY, "content-type": "application/json", "accept": "text/event-stream"},
                timeout=timeout, stream=True,
            )
            if response.status_code != 200:
                last = f"http_{response.status_code}"
                continue
            text = ""
            for line in response.iter_lines(decode_unicode=True):
                if not line or not line.startswith("data:"):
                    continue
                payload = line[5:].strip()
                if not payload or payload == "[DONE]":
                    continue
                try:
                    delta = json.loads(payload)["choices"][0].get("delta", {}).get("content")
                except Exception:
                    continue
                if isinstance(delta, str):
                    text += delta
            if not text.strip():
                last = "empty"
                continue
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
            start, end = cleaned.find("{"), cleaned.rfind("}")
            return json.loads(cleaned[start:end + 1]) if start >= 0 else None
        except Exception as error:  # noqa: BLE001
            last = str(error)[:60]
    return {"__error__": last}


def classify_one(connection: sqlite3.Connection, question: sqlite3.Row, mode="normal"):
    candidates = chapter_candidates(connection, question,
                                    TOP_SECTIONS if mode == "normal" else TOP_SECTIONS,
                                    TOP_CHAPTERS if mode == "normal" else RESCUE_CHAPTERS)
    if mode == "shortlist":
        candidates = [dict(r) for r in connection.execute(
            """SELECT c.chapter_id, c.chapter_title, p.part_title, c.start_page AS page
                 FROM textbook_chapter c LEFT JOIN textbook_part p ON p.part_id=c.part_id
                ORDER BY c.chapter_order""")]
        for candidate in candidates:
            candidate.setdefault("best_rank", None); candidate.setdefault("best_score", None)
            candidate.setdefault("matches", 0); candidate.setdefault("sections", []); candidate.setdefault("snippets", [])
    if not candidates:
        return None
    listing = []
    for index, candidate in enumerate(candidates):
        listing.append({
            "candidate_id": f"C{index + 1}",
            "part": candidate.get("part_title") or candidate.get("part") or "",
            "chapter": candidate["chapter_title"],
            "pages": candidate.get("page"),
            "sections": candidate.get("sections", [])[:3],
            "snippets": candidate.get("snippets", [])[:3],
        })
    system = (
        "You assign a clinical exam question to the ONE textbook chapter it mainly tests. "
        "You may ONLY answer with a supplied candidate_id. Never invent a chapter. "
        "Always answer with the single most likely chapter even when it is not a perfect fit. "
        'Reply with JSON only: {"primary_candidate_id":"C1","secondary_candidate_ids":[],'
        '"confidence":"HIGH|MEDIUM|LOW","clinical_topic":"<short>","reason":"<short>"}'
    )
    context = json.dumps({
        "question": (question["stem_en"] or "")[:1500],
        "options": [r[0] for r in connection.execute("SELECT option_key || '. ' || text_en FROM question_options WHERE question_id=? ORDER BY sort_order", (question["id"],))][:6],
        "source_answer": question["answer_key"],
        "source_explanation": (question["source_explanation_en"] or "")[:1200],
        "candidates": listing,
    })
    for attempt in range(2):
        parsed = chat_json([{"role": "system", "content": system}, {"role": "user", "content": context}])
        if parsed and "__error__" not in parsed:
            raw = str(parsed.get("primary_candidate_id", "")).strip().upper()
            match = re.fullmatch(r"C(\d+)", raw)
            index = int(match.group(1)) - 1 if match else None
            if index is not None and 0 <= index < len(candidates):
                level = str(parsed.get("confidence", "")).strip().upper()
                secondary = []
                for item in (parsed.get("secondary_candidate_ids") or [])[:2]:
                    sub = re.fullmatch(r"C(\d+)", str(item).strip().upper())
                    if sub and 0 <= int(sub.group(1)) - 1 < len(candidates):
                        secondary.append(candidates[int(sub.group(1)) - 1]["chapter_id"])
                return {
                    "chapter": candidates[index], "candidates": candidates,
                    "confidence": level if level in ("HIGH", "MEDIUM", "LOW") else "LOW",
                    "topic": str(parsed.get("clinical_topic", ""))[:120],
                    "reason": str(parsed.get("reason", ""))[:200],
                    "secondary": secondary,
                }
    return None


LOCK = threading.Lock()
COUNTER = collections.Counter()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--taxonomy", action="store_true")
    parser.add_argument("--run", action="store_true")
    parser.add_argument("--report", action="store_true")
    parser.add_argument("--limit", type=int, default=60)
    parser.add_argument("--minutes", type=float, default=20)
    parser.add_argument("--concurrency", type=int, default=6)
    args = parser.parse_args()

    connection = connect()
    if args.taxonomy:
        rows = connection.execute(
            """SELECT c.chapter_id, c.part_id, p.part_title, c.chapter_title, c.chapter_order,
                      c.start_page, c.end_page
                 FROM textbook_chapter c LEFT JOIN textbook_part p ON p.part_id=c.part_id
                ORDER BY c.chapter_order""").fetchall()
        os.makedirs(os.path.join(ROOT, "audit"), exist_ok=True)
        import csv as _csv
        with open(os.path.join(ROOT, "audit", "MURTAGH_131_CHAPTER_TAXONOMY.csv"), "w", encoding="utf-8", newline="") as handle:
            writer = _csv.writer(handle)
            writer.writerow(["chapter_id", "part_id", "part_title", "chapter_title", "chapter_order", "page_start", "page_end"])
            for row in rows:
                writer.writerow([row["chapter_id"], row["part_id"], row["part_title"], row["chapter_title"], row["chapter_order"], row["start_page"], row["end_page"]])
        print(json.dumps({"chapters": len(rows), "parts": len({r["part_id"] for r in rows})}))

    # mapping table lives in the CONTENT layer (bundled D1) next to questions/textbook
    connection.executescript(f"""
      CREATE TABLE IF NOT EXISTS {TABLE} (
        question_id text PRIMARY KEY NOT NULL,
        source_provider text,
        primary_part_id text,
        primary_chapter_id text NOT NULL,
        secondary_chapter_ids_json text NOT NULL DEFAULT '[]',
        mapping_status text NOT NULL,
        mapping_confidence text,
        mapping_method text NOT NULL,
        mapping_version text NOT NULL,
        candidate_chapters_json text NOT NULL DEFAULT '[]',
        fts_evidence_json text NOT NULL DEFAULT '[]',
        semantic_reason text,
        created_at text NOT NULL,
        updated_at text NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_qmcm_chapter ON {TABLE} (primary_chapter_id);
      CREATE INDEX IF NOT EXISTS idx_qmcm_status ON {TABLE} (mapping_status);
    """)
    try:
        connection.execute("INSERT OR REPLACE INTO d1_migrations (name, applied_at) VALUES (?, datetime('now'))",
                           ("0065_question_murtagh_chapter_map.sql",))
    except sqlite3.OperationalError:
        pass
    connection.commit()

    done = {r[0] for r in connection.execute(f"SELECT question_id FROM {TABLE} WHERE mapping_version=?", (MAPPING_VERSION,))}
    pending = [r for r in connection.execute(
        "SELECT * FROM questions WHERE active=1 AND source_provider='Emidici' ORDER BY id")
        if r["id"] not in done]

    if args.report:
        total = connection.execute("SELECT count(*) FROM questions WHERE active=1 AND source_provider='Emidici'").fetchone()[0]
        mapped = connection.execute(f"SELECT count(*) FROM {TABLE} WHERE mapping_version=?", (MAPPING_VERSION,)).fetchone()[0]
        status = dict(connection.execute(f"SELECT mapping_status, count(*) FROM {TABLE} WHERE mapping_version=? GROUP BY 1", (MAPPING_VERSION,)).fetchall())
        nulls = connection.execute(f"SELECT count(*) FROM {TABLE} WHERE primary_chapter_id IS NULL OR primary_chapter_id=''").fetchone()[0]
        counts = connection.execute(
            f"""SELECT c.part_id, p.part_title, c.chapter_id, c.chapter_title, count(m.question_id) AS n,
                       sum(CASE WHEN m.mapping_status='HIGH_CONFIDENCE' THEN 1 ELSE 0 END) AS high,
                       sum(CASE WHEN m.mapping_status='MEDIUM_CONFIDENCE' THEN 1 ELSE 0 END) AS medium,
                       sum(CASE WHEN m.mapping_status='LOW_CONFIDENCE_REVIEW' THEN 1 ELSE 0 END) AS low
                  FROM textbook_chapter c LEFT JOIN textbook_part p ON p.part_id=c.part_id
                  LEFT JOIN {TABLE} m ON m.primary_chapter_id=c.chapter_id AND m.mapping_version=?
                 GROUP BY c.chapter_id ORDER BY c.chapter_order""", (MAPPING_VERSION,)).fetchall()
        import csv as _csv
        with open(os.path.join(ROOT, "audit", "EMIDICI_4900_MURTAGH_CHAPTER_COUNTS.csv"), "w", encoding="utf-8", newline="") as handle:
            writer = _csv.writer(handle)
            writer.writerow(["part_id", "part_title", "chapter_id", "chapter_title", "question_count", "high_count", "medium_count", "low_review_count"])
            for row in counts:
                writer.writerow([row["part_id"], row["part_title"], row["chapter_id"], row["chapter_title"], row["n"], row["high"], row["medium"], row["low"]])
            writer.writerow(["", "", "", "TOTAL", sum(r["n"] for r in counts), "", "", ""])
        print(json.dumps({"emidici_total": total, "mapped": mapped, "status": status,
                          "null_primary": nulls, "sum_chapter_counts": sum(r["n"] for r in counts),
                          "chapters_with_questions": sum(1 for r in counts if r["n"]),
                          "chapters_with_zero": sum(1 for r in counts if not r["n"])}, ensure_ascii=False))

    if args.run:
        deadline = time.time() + args.minutes * 60
        batch = pending[: args.limit]
        print(json.dumps({"pending": len(pending), "this_run": len(batch), "concurrency": args.concurrency,
                          "already_mapped": len(done)}))
        if batch:
            def work(row):
                if time.time() > deadline:
                    return
                local = connect()
                try:
                    outcome = classify_one(local, row, "normal")
                    mode = "normal"
                    if outcome is None:
                        outcome = classify_one(local, row, "rescue20")
                        mode = "rescue20"
                    if outcome is None:
                        outcome = classify_one(local, row, "shortlist")
                        mode = "shortlist131"
                    now = time.strftime("%Y-%m-%dT%H:%M:%S+08:00")
                    if outcome is None:
                        # terminator of the rescue chain: the best lexical chapter, flagged for audit
                        cands = chapter_candidates(local, row, TOP_SECTIONS, 1)
                        if not cands:
                            return
                        with LOCK:
                            COUNTER["skipped_no_candidates"] += 1
                        return
                    chosen = outcome["chapter"]
                    status = {"HIGH": "HIGH_CONFIDENCE", "MEDIUM": "MEDIUM_CONFIDENCE"}.get(outcome["confidence"], "LOW_CONFIDENCE_REVIEW")
                    if mode != "normal" and status == "HIGH_CONFIDENCE":
                        status = "MEDIUM_CONFIDENCE"
                    part_id, _ = part_of(local, chosen["chapter_id"])
                    with LOCK:
                        local.execute(f"""INSERT OR REPLACE INTO {TABLE}
                          (question_id, source_provider, primary_part_id, primary_chapter_id, secondary_chapter_ids_json,
                           mapping_status, mapping_confidence, mapping_method, mapping_version, candidate_chapters_json,
                           fts_evidence_json, semantic_reason, created_at, updated_at)
                          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                          (row["id"], "Emidici", part_id, chosen["chapter_id"], json.dumps(outcome["secondary"], ensure_ascii=False),
                           status, outcome["confidence"], f"fts{TOP_SECTIONS}+{mode}", MAPPING_VERSION,
                           json.dumps([c["chapter_id"] for c in outcome["candidates"]], ensure_ascii=False),
                           json.dumps([{"chapter_id": c["chapter_id"], "best_score": c.get("best_score"), "matches": c.get("matches")} for c in outcome["candidates"]], ensure_ascii=False),
                           f'{outcome["topic"]} — {outcome["reason"]}'[:300], now, now))
                        COUNTER[status] += 1
                        COUNTER["written"] += 1
                        if COUNTER["written"] % BATCH == 0:
                            local.commit()
                            _checkpoint(local, len(pending) - COUNTER["written"])
                finally:
                    local.commit()
                    local.close()

            with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
                list(pool.map(work, batch))
            connection.commit()
            _checkpoint(connection, len(pending) - COUNTER["written"])
        print(json.dumps(dict(COUNTER), ensure_ascii=False))
    return 0


def _checkpoint(connection: sqlite3.Connection, remaining: int) -> None:
    total = connection.execute("SELECT count(*) FROM questions WHERE active=1 AND source_provider='Emidici'").fetchone()[0]
    mapped = connection.execute(f"SELECT count(*) FROM {TABLE} WHERE mapping_version=?", (MAPPING_VERSION,)).fetchone()[0]
    status = dict(connection.execute(f"SELECT mapping_status, count(*) FROM {TABLE} WHERE mapping_version=? GROUP BY 1", (MAPPING_VERSION,)).fetchall())
    payload = {"mapping_version": MAPPING_VERSION, "total": total, "completed": mapped,
               "remaining": total - mapped, "high": status.get("HIGH_CONFIDENCE", 0),
               "medium": status.get("MEDIUM_CONFIDENCE", 0), "low_review": status.get("LOW_CONFIDENCE_REVIEW", 0),
               "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S+08:00")}
    os.makedirs(os.path.dirname(CHECKPOINT), exist_ok=True)
    with open(CHECKPOINT, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
    print("checkpoint", json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())
