"""
Emidici -> Murtagh chapter classification, fully LOCAL (no cloud LLM).

Why this replaces the cloud pipeline: the generative route cost ~165 s per question
(~30 h for 4900). A bi-encoder + cross-encoder does the same job as one batch pass,
because 4900 x 131 is a tiny search problem and the reranker only ever sees 8 pairs
per question.

    Stage A  bi-encoder     131 chapter representations -> embedded once, cached
                            4900 questions             -> embedded in batches
                            cosine similarity -> top 8 chapters per question
    Stage B  cross-encoder  (question, chapter) pairs for those 8 -> reranked
                            primary chapter = rerank rank 1

Models are taken from the local HF cache when present (offline mode), so the run never
depends on the network. Cost: 0. Writes `question_murtagh_chapter_map` with
mapping_version `murtagh_chapter_map_local_v1`.

Usage:
    python tools/emidici/local_chapter_classifier.py --benchmark 100
    python tools/emidici/local_chapter_classifier.py --full
    python tools/emidici/local_chapter_classifier.py --report
"""
from __future__ import annotations

import argparse
import collections
import csv
import glob
import json
import os
import sqlite3
import sys
import time

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIT = os.path.join(ROOT, "audit")
TABLE = "question_murtagh_chapter_map"
MAPPING_VERSION = "murtagh_chapter_map_local_v1"
CHECKPOINT = os.path.join(AUDIT, "emidici_local_chapter_checkpoint.json")
EMB_CACHE = os.path.join(AUDIT, "local_chapter_embeddings.npy")

BI_ENCODER = "sentence-transformers/all-MiniLM-L6-v2"
CROSS_ENCODER = "cross-encoder/ms-marco-MiniLM-L6-v2"
TOP_K = 8
SEED = 20261003

# Confidence thresholds calibrated against the observed ms-marco cross-encoder margin
# distribution (measured on the first 100 questions: p50 0.60, p75 1.04, p90 1.50,
# max 2.66). The previous 1.0 / 3.0 cut-offs were taken from an unrelated scale and
# made HIGH unreachable (0/100) while flagging 74% of rows as needing review, which
# destroys the flag's triage value.
CONF_HIGH = 1.5
CONF_MEDIUM = 0.6


def db_path() -> str:
    return [p for p in glob.glob(os.path.join(ROOT, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite"))
            if "metadata" not in os.path.basename(p)][0]


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(db_path())
    connection.row_factory = sqlite3.Row
    return connection


def build_chapters(connection: sqlite3.Connection):
    """One representation per chapter: Part, Chapter, and the titles of its sections.

    Deliberately not the OCR body text — the goal is to define what the chapter is
    about, and section titles do that far more cheaply than 40 pages of prose.
    """
    chapters = connection.execute(
        """SELECT c.chapter_id, c.chapter_title, c.chapter_order, p.part_title,
                  c.start_page, c.end_page
             FROM textbook_chapter c LEFT JOIN textbook_part p ON p.part_id=c.part_id
            ORDER BY c.chapter_order""").fetchall()
    sections = collections.defaultdict(list)
    for row in connection.execute(
            "SELECT chapter_id, section_title FROM textbook_section ORDER BY chapter_id, section_order"):
        title = (row["section_title"] or "").strip()
        if title and len(title) < 120:
            sections[row["chapter_id"]].append(title)
    out = []
    for chapter in chapters:
        titles = sections.get(chapter["chapter_id"], [])
        # de-duplicate while keeping order, and cap so a 200-section chapter does not drown the rest
        seen, unique = set(), []
        for title in titles:
            key = title.lower()
            if key in seen:
                continue
            seen.add(key)
            unique.append(title)
        text = (f"PART: {chapter['part_title'] or 'General'}\n"
                f"CHAPTER: {chapter['chapter_title']}\n"
                f"SECTIONS: " + "; ".join(unique[:60]))
        out.append({"chapter_id": chapter["chapter_id"], "chapter_title": chapter["chapter_title"],
                    "part_title": chapter["part_title"], "page_start": chapter["start_page"],
                    "page_end": chapter["end_page"], "text": text, "section_count": len(unique)})
    return out


def build_questions(connection: sqlite3.Connection):
    options = collections.defaultdict(list)
    for row in connection.execute("SELECT question_id, option_key, text_en FROM question_options ORDER BY question_id, sort_order"):
        options[row["question_id"]].append(f"{row['option_key']}. {row['text_en']}")
    rows = connection.execute(
        """SELECT id, stem_en, answer_key, source_explanation_en
             FROM questions WHERE active=1 AND source_provider='Emidici' ORDER BY id""").fetchall()
    out = []
    for row in rows:
        text = (f"QUESTION: {row['stem_en'] or ''}\n"
                f"OPTIONS: " + " | ".join(options.get(row["id"], [])[:6]) + "\n"
                f"CORRECT ANSWER: {row['answer_key'] or ''}\n"
                f"EXPLANATION: {(row['source_explanation_en'] or '')[:800]}")
        out.append({"id": row["id"], "text": text[:3000]})
    return out


def ensure_table(connection: sqlite3.Connection):
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
    connection.commit()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--benchmark", type=int, default=0)
    parser.add_argument("--full", action="store_true")
    parser.add_argument("--limit", type=int, default=0,
                        help="with --full, classify only the first N questions (foreground gate); 0 = all")
    parser.add_argument("--report", action="store_true")
    parser.add_argument("--batch", type=int, default=32)
    parser.add_argument("--pair-chars", type=int, default=1200,
                        help="cross-encoder inputs are truncated at 512 tokens anyway; feeding it 60 section titles means encoding text that is silently discarded")
    args = parser.parse_args()

    import numpy as np
    from sentence_transformers import SentenceTransformer, CrossEncoder

    connection = connect()
    ensure_table(connection)
    chapters = build_chapters(connection)
    questions = build_questions(connection)
    print(json.dumps({"chapters": len(chapters), "emidici_questions": len(questions),
                      "bi_encoder": BI_ENCODER, "cross_encoder": CROSS_ENCODER, "device": "cpu"}))

    t0 = time.time()
    bi = SentenceTransformer(BI_ENCODER)
    cross = CrossEncoder(CROSS_ENCODER)
    load_s = time.time() - t0

    t0 = time.time()
    if os.path.exists(EMB_CACHE) and not args.benchmark:
        chapter_vectors = np.load(EMB_CACHE)
    else:
        chapter_vectors = bi.encode([c["text"] for c in chapters], batch_size=args.batch,
                                    normalize_embeddings=True, show_progress_bar=False)
        np.save(EMB_CACHE, chapter_vectors)
    embed_chapters_s = time.time() - t0

    pool = questions[: args.benchmark] if args.benchmark else (questions if args.full else questions[:100])
    if args.full and not args.benchmark:
        if args.limit:
            pool = pool[: args.limit]
        _run_full_chunked(connection, bi, cross, chapters, pool, args.batch)
        _report(connection, chapters)
        return 0

    t0 = time.time()
    question_vectors = bi.encode([q["text"] for q in pool], batch_size=args.batch,
                                 normalize_embeddings=True, show_progress_bar=False)
    embed_questions_s = time.time() - t0

    t0 = time.time()
    similarity = question_vectors @ chapter_vectors.T          # (n, 131) cosine, vectors are normalised
    top_idx = np.argsort(-similarity, axis=1)[:, :TOP_K]
    retrieve_s = time.time() - t0

    t0 = time.time()
    pairs, owners = [], []
    for qi, row in enumerate(top_idx):
        question_text = pool[qi]["text"][: args.pair_chars]
        for ci in row:
            pairs.append((question_text, chapters[ci]["text"][: args.pair_chars]))
            owners.append((qi, int(ci)))
    scores = cross.predict(pairs, batch_size=args.batch, show_progress_bar=False)
    rerank_s = time.time() - t0

    grouped = collections.defaultdict(list)
    for (qi, ci), score in zip(owners, scores):
        grouped[qi].append((float(score), ci))
    rows, t1t2_margins = [], []
    for qi, items in grouped.items():
        items.sort(reverse=True)
        best = items[0]
        second = items[1] if len(items) > 1 else (0.0, None)
        embed_best = int(top_idx[qi][0]); embed_second = int(top_idx[qi][1])
        margin = float(similarity[qi][embed_best] - similarity[qi][embed_second])
        t1t2_margins.append(float(best[0] - second[0]))
        rows.append({
            "question_id": pool[qi]["id"],
            "primary_chapter_id": chapters[best[1]]["chapter_id"],
            "secondary": [chapters[ci]["chapter_id"] for _, ci in items[1:3]],
            "embedding_top1": chapters[embed_best]["chapter_id"],
            "embedding_top1_score": float(similarity[qi][embed_best]),
            "embedding_top2_score": float(similarity[qi][embed_second]),
            "embedding_margin": margin,
            "reranker_top1_score": float(best[0]),
            "reranker_top2_score": float(second[0]),
            "reranker_margin": float(best[0] - second[0]),
            "reranker_changed": bool(chapters[best[1]]["chapter_id"] != chapters[embed_best]["chapter_id"]),
        })

    total = load_s + embed_chapters_s + embed_questions_s + retrieve_s + rerank_s
    per_question = total / max(1, len(pool))
    report = {
        "model_load_s": round(load_s, 1),
        "chapter_embed_s": round(embed_chapters_s, 2),
        "question_embed_s": round(embed_questions_s, 2),
        "retrieval_s": round(retrieve_s, 3),
        "crossencoder_s": round(rerank_s, 2),
        "total_s": round(total, 2),
        "questions": len(pool),
        "s_per_question": round(per_question, 3),
        "estimated_4900_min": round(per_question * 4900 / 60, 1),
        "cloud_api_cost": 0,
        "reranker_changed_primary_pct": round(100 * sum(1 for r in rows if r["reranker_changed"]) / max(1, len(rows)), 1),
    }
    print("LOCAL_FAST_BENCHMARK " + json.dumps(report, ensure_ascii=False))

    if args.benchmark:
        with open(os.path.join(AUDIT, "LOCAL_FAST_BENCHMARK.json"), "w", encoding="utf-8") as handle:
            json.dump(report, handle, ensure_ascii=False, indent=2)
        for qid in ("0058a75009b80e0b93bb", "0001307dead8cf"):
            pass
        known = {"0058a75009b80e0b93bb": "Raynaud", "0001307dead8ab3c6523": "Atypical ischaemia"}
        for row in rows:
            if row["question_id"] in known:
                print(f'KNOWN {known[row["question_id"]]}: primary={row["primary_chapter_id"]} '
                      f'embed_top1={row["embedding_top1"]} rerank_changed={row["reranker_changed"]}')
        return 0

    # UNREACHABLE: both `--full` (early return above) and `--benchmark` (return above)
    # have already exited, so this branch can never run. It is kept only as a record of
    # the original single-shot write; do NOT revive it without routing through
    # _row_tuple(), since its inline payload predates the candidate/confidence fixes.
    if args.full and rows:
        now = time.strftime("%Y-%m-%dT%H:%M:%S+08:00")
        chapter_meta = {c["chapter_id"]: c for c in chapters}
        for index, row in enumerate(rows, 1):
            connection.execute(
                f"""INSERT OR REPLACE INTO {TABLE}
                  (question_id, source_provider, primary_part_id, primary_chapter_id, secondary_chapter_ids_json,
                   mapping_status, mapping_confidence, mapping_method, mapping_version, candidate_chapters_json,
                   fts_evidence_json, semantic_reason, created_at, updated_at)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (row["question_id"], "Emidici",
                 next((c["part_title"] for c in chapters if c["chapter_id"] == row["primary_chapter_id"]), None),
                 row["primary_chapter_id"], json.dumps(row["secondary"], ensure_ascii=False),
                 "LOCAL_MODEL_ASSIGNED",
                 "HIGH" if row["reranker_margin"] > 3 else "MEDIUM" if row["reranker_margin"] > 1 else "LOW_CONFIDENCE_REVIEW",
                 "local:bge-minilm+cross-encoder", MAPPING_VERSION,
                 json.dumps([row["embedding_top1"], row["primary_chapter_id"]], ensure_ascii=False),
                 json.dumps({"embedding_margin": row["embedding_margin"], "reranker_margin": row["reranker_margin"]}, ensure_ascii=False),
                 f'local rerank; embed_top1={row["embedding_top1"]}', now, now))
            if index % 250 == 0:
                connection.commit()
                _checkpoint(connection)
        connection.commit()
        _checkpoint(connection)

    if args.report:
        _report(connection, chapters)
    return 0


def _row_tuple(question_id, items, embed_top_chapter_id, chapters, method):
    """Build the INSERT payload for one question (single source of truth).

    `items` is [(rerank_score, chapter_index), ...] sorted descending.

    Two defects this fixes, both observed on the 100-question gate:
      * `candidate_chapters_json` was `[embed_top1, primary]`, not the candidate set,
        so it was always 2 entries and contained the SAME chapter twice in 32/100 rows
        (whenever the reranker agreed with the bi-encoder). It now holds the full
        deduped reranked candidate set, primary first.
      * `mapping_confidence` used thresholds that made HIGH unreachable.
    """
    best = items[0]
    second = items[1] if len(items) > 1 else (best[0], best[1])
    margin = float(best[0] - second[0])
    primary = chapters[best[1]]["chapter_id"]

    candidates = []
    for _, ci in items:
        chapter_id = chapters[ci]["chapter_id"]
        if chapter_id not in candidates:
            candidates.append(chapter_id)
    if primary in candidates:
        candidates.remove(primary)
    candidates.insert(0, primary)

    confidence = ("HIGH" if margin > CONF_HIGH
                  else "MEDIUM" if margin > CONF_MEDIUM
                  else "LOW_CONFIDENCE_REVIEW")
    now = time.strftime("%Y-%m-%dT%H:%M:%S+08:00")
    evidence = {
        "retrieval_stage": "bi-encoder-cosine-top%d + ms-marco-cross-encoder-rerank" % TOP_K,
        "embed_top1_chapter": embed_top_chapter_id,
        "reranker_agrees_with_embed_top1": embed_top_chapter_id == primary,
        "reranker_margin": margin,
        "candidates_reranked": len(items),
    }
    return (
        question_id, "Emidici", chapters[best[1]]["part_title"], primary,
        json.dumps(candidates[1:3], ensure_ascii=False),
        "LOCAL_MODEL_ASSIGNED", confidence, method, MAPPING_VERSION,
        json.dumps(candidates, ensure_ascii=False),
        json.dumps(evidence, ensure_ascii=False),
        "embed_top1=%s; rerank_rank1=%s; margin=%.3f" % (embed_top_chapter_id, primary, margin),
        now, now,
    )


def _run_full_chunked(connection, bi, cross, chapters, pool, batch, chunk=200):
    """Chunked so a checkpoint appears almost immediately and rows land every 50.

    The first version of this script reranked all 4900 pairs and only then wrote
    anything, so no checkpoint could exist before the very end - which is exactly why
    the earlier background attempt looked dead.
    """
    import numpy as np
    chapter_vectors = np.load(EMB_CACHE)
    done = {r[0] for r in connection.execute(f"SELECT question_id FROM {TABLE} WHERE mapping_version=?", (MAPPING_VERSION,))}
    todo = [q for q in pool if q["id"] not in done]
    started = time.time()
    written = 0
    print(json.dumps({"already_done": len(done), "todo": len(todo)}), flush=True)
    for start in range(0, len(todo), chunk):
        window = todo[start:start + chunk]
        qv = bi.encode([q["text"] for q in window], batch_size=batch, normalize_embeddings=True, show_progress_bar=False)
        top = np.argsort(-(qv @ chapter_vectors.T), axis=1)[:, :TOP_K]
        pairs, owners = [], []
        for qi, row in enumerate(top):
            qt = window[qi]["text"][:1200]
            for ci in row:
                pairs.append((qt, chapters[ci]["text"][:1200]))
                owners.append((qi, int(ci)))
        scores = cross.predict(pairs, batch_size=batch, show_progress_bar=False)
        grouped = collections.defaultdict(list)
        for (qi, ci), score in zip(owners, scores):
            grouped[qi].append((float(score), ci))
        for qi, items in sorted(grouped.items()):
            items.sort(reverse=True)
            embed_best = chapters[int(top[qi][0])]["chapter_id"]
            connection.execute(
                f"""INSERT OR REPLACE INTO {TABLE}
                  (question_id, source_provider, primary_part_id, primary_chapter_id, secondary_chapter_ids_json,
                   mapping_status, mapping_confidence, mapping_method, mapping_version, candidate_chapters_json,
                   fts_evidence_json, semantic_reason, created_at, updated_at)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                _row_tuple(window[qi]["id"], items, embed_best, chapters,
                           f"local:minilm+cross-encoder(batch={batch})"))
            written += 1
            if written == 1 or written % 50 == 0:
                connection.commit()
                _checkpoint(connection, started)
        connection.commit()
        _checkpoint(connection, started)
        print(json.dumps({"written": written, "elapsed_s": round(time.time() - started, 1)}), flush=True)
    print(json.dumps({"done": written, "elapsed_s": round(time.time() - started, 1)}), flush=True)


def _checkpoint(connection: sqlite3.Connection, started: float | None = None) -> None:
    total = connection.execute("SELECT count(*) FROM questions WHERE active=1 AND source_provider='Emidici'").fetchone()[0]
    mapped = connection.execute(f"SELECT count(*) FROM {TABLE} WHERE mapping_version=?", (MAPPING_VERSION,)).fetchone()[0]
    status = dict(connection.execute(f"SELECT mapping_status, count(*) FROM {TABLE} WHERE mapping_version=? GROUP BY 1", (MAPPING_VERSION,)).fetchall())
    elapsed = (time.time() - started) if started else None
    rate = (mapped / elapsed * 60) if elapsed and mapped else None
    payload = {"mapping_version": MAPPING_VERSION, "backend": "pytorch-cpu", "model": CROSS_ENCODER,
               "total": total, "completed": mapped, "remaining": total - mapped,
               "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+08:00", time.localtime(started)) if started else None,
               "questions_per_minute": round(rate, 2) if rate else None,
               "estimated_remaining_minutes": round((total - mapped) / rate, 1) if rate else None,
               **{k.lower(): v for k, v in status.items()},
               "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S+08:00")}
    with open(CHECKPOINT, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
    print("checkpoint " + json.dumps(payload, ensure_ascii=False), flush=True)


def _report(connection: sqlite3.Connection, chapters) -> None:
    total = connection.execute("SELECT count(*) FROM questions WHERE active=1 AND source_provider='Emidici'").fetchone()[0]
    mapped = connection.execute(f"SELECT count(*) FROM {TABLE} WHERE mapping_version=?", (MAPPING_VERSION,)).fetchone()[0]
    nulls = connection.execute(f"SELECT count(*) FROM {TABLE} WHERE primary_chapter_id IS NULL OR primary_chapter_id=''").fetchone()[0]
    invalid = connection.execute(
        f"SELECT count(*) FROM {TABLE} m LEFT JOIN textbook_chapter c ON c.chapter_id=m.primary_chapter_id "
        f"WHERE m.mapping_version=? AND c.chapter_id IS NULL", (MAPPING_VERSION,)).fetchone()[0]
    status = dict(connection.execute(f"SELECT mapping_status, count(*) FROM {TABLE} WHERE mapping_version=? GROUP BY 1", (MAPPING_VERSION,)).fetchall())
    counts = connection.execute(
        f"""SELECT c.part_id, p.part_title, c.chapter_id, c.chapter_title, count(m.question_id) AS n
             FROM textbook_chapter c LEFT JOIN textbook_part p ON p.part_id=c.part_id
             LEFT JOIN {TABLE} m ON m.primary_chapter_id=c.chapter_id AND m.mapping_version=?
            GROUP BY c.chapter_id ORDER BY c.chapter_order""", (MAPPING_VERSION,)).fetchall()
    with open(os.path.join(AUDIT, "EMIDICI_4900_MURTAGH_CHAPTER_COUNTS_LOCAL.csv"), "w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["part_id", "part_title", "chapter_id", "chapter_title", "question_count"])
        for row in counts:
            writer.writerow([row["part_id"], row["part_title"], row["chapter_id"], row["chapter_title"], row["n"]])
        writer.writerow(["", "", "", "TOTAL", sum(r["n"] for r in counts)])
    with open(os.path.join(AUDIT, "EMIDICI_LOCAL_CHAPTER_MAP_ALL.csv"), "w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["question_id", "primary_chapter", "mapping_status", "candidate_chapters", "evidence", "model"])
        for row in connection.execute(f"SELECT question_id, primary_chapter_id, mapping_status, candidate_chapters_json, fts_evidence_json, mapping_method FROM {TABLE} WHERE mapping_version=?", (MAPPING_VERSION,)):
            writer.writerow([row["question_id"], row["primary_chapter_id"], row["mapping_status"],
                             row["candidate_chapters_json"], row["fts_evidence_json"], row["mapping_method"]])
    print(json.dumps({"emidici_total": total, "mapped": mapped, "null_primary": nulls, "invalid_chapter": invalid,
                      "status": status, "sum_chapter_counts": sum(r["n"] for r in counts),
                      "chapters_with_questions": sum(1 for r in counts if r["n"]),
                      "chapters_with_zero": sum(1 for r in counts if not r["n"])}, ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())
