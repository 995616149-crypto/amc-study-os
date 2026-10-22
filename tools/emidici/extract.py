#!/usr/bin/env python
"""Emidici (Emedici 2026) question-bank extractor.

Source: 34 image-only PDFs under  ...\\Emedici2026最新\\<range>+解析.pdf
The bank alternates QUESTION page -> ANSWER/EXPLANATION page.  Each PDF page is
built from stacked screenshot "bands" (embedded raster images); there is no text
layer at all, so every field has to come from a vision read of the rendered page.

This module only EXTRACTS.  It never writes to the application database.

Outputs (under OUT/):
  questions.jsonl   one JSON object per extracted question, append-only
  pages.jsonl       page -> {role, question_number} map, from every window
  progress.json     per-PDF resume pointer + run statistics
  run.log           unbuffered progress/diagnostic log
"""

from __future__ import annotations

import base64
import json
import os
import random
import sys
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout

import pymupdf

SRC = r"C:\Users\LIN\Downloads\新建文件夹\Emedici2026最新"
OUT = r"C:\AMC_Study_OS\_staging\emidici"
DPI = 130
# The cost of a call is dominated by fixed per-request overhead, not by the
# answer text: measured on this bank, 4 pages cost 16.4s for 2 questions while
# 16 pages cost 21.6s for 7 (8.2 -> 3.1 seconds per question).  But payload size
# scales with the window too, so a big window only pays off with fewer workers:
# 16-page windows at 24 parallel calls stalled with every request in flight,
# while the same window at low parallelism returns promptly.
CHUNK = 12                     # pages handed to the model per call
DEFAULT_WORKERS = 10
MODEL = "deepseek-flash"
# The model spends part of its budget on internal reasoning before emitting the
# JSON, so the cap has to leave room for two long explanations on top of that.
# Too low a cap silently produces an empty completion (observed at 8192).
MAX_TOKENS = 32768
CALL_TIMEOUT = 120             # socket timeout per attempt
CALL_WALL = 200                # hard wall-clock deadline per attempt
PROVIDER = "Emidici"

# The machine has a system HTTP proxy configured.  Routing the DeepSeek API
# through it made connections take ~5x longer to establish and occasionally
# hang indefinitely, so the extractor talks to the API directly.
_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
# Bounded so that a stalled request cannot accumulate abandoned payloads.
_POOL = ThreadPoolExecutor(max_workers=48)

_lock = threading.Lock()
_logfh = None

# --------------------------------------------------------------------------- #
# API
# --------------------------------------------------------------------------- #

def _api_key() -> str:
    for line in open(r"C:\AMC_Study_OS\.dev.vars", encoding="utf-8"):
        if line.startswith("DEEPSEEK_API_KEY"):
            return line.split('"')[1]
    raise RuntimeError("DEEPSEEK_API_KEY missing")


KEY = _api_key()
API = "https://api.deepseek.com/chat/completions"


def log(msg: str) -> None:
    global _logfh
    with _lock:
        if _logfh is None:
            _logfh = open(os.path.join(OUT, "run.log"), "a", encoding="utf-8")
        _logfh.write(f"{time.strftime('%H:%M:%S')} {msg}\n")
        _logfh.flush()


def _data_url(image_bytes: bytes) -> str:
    """JPEG is detected by magic bytes; anything else falls back to PNG."""
    mime = "image/jpeg" if image_bytes[:2] == b"\xff\xd8" else "image/png"
    return f"data:{mime};base64," + base64.b64encode(image_bytes).decode()


def _post(payload: bytes) -> dict:
    req = urllib.request.Request(
        API, data=payload,
        headers={"Content-Type": "application/json",
                 "Authorization": "Bearer " + KEY,
                 "Connection": "close"})
    with _OPENER.open(req, timeout=CALL_TIMEOUT) as r:
        return json.loads(r.read())


def vision(png_bytes: list[bytes], prompt: str, retries: int = 8) -> tuple[str, dict]:
    """One vision call, bounded in wall-clock time and resilient to throttling.

    The provider answers image requests with HTTP 402 when too many are in flight
    at once (the account balance itself is healthy — a text call succeeds while
    the storm is happening).  A window that gives up loses whole questions, so
    throttling is retried far more patiently than a genuine error, and one
    attempt is deliberately given up rather than blocking the whole run.
    """
    content = [
        {"type": "image_url", "image_url": {"url": _data_url(b)}}
        for b in png_bytes
    ]
    content.append({"type": "text", "text": prompt})
    body = {"model": MODEL, "messages": [{"role": "user", "content": content}],
            "max_tokens": MAX_TOKENS, "temperature": 0,
            # This is a transcription task, not a reasoning task: measured output
            # length is the same with reasoning off (2959 vs 3069 chars) while the
            # call is ~2.3x faster and no longer spends its budget on hidden
            # reasoning.  The frozen Coach style lives in lib/amc-coach.ts and is
            # not touched by this.
            "reasoning_effort": "none"}
    payload = json.dumps(body).encode()
    stat = {"attempts": 0, "seconds": 0.0, "throttled": 0}
    last = None
    t0 = time.time()
    for attempt in range(retries):
        stat["attempts"] += 1
        try:
            out = _POOL.submit(_post, payload).result(timeout=CALL_WALL)
            stat["seconds"] = round(time.time() - t0, 1)
            stat["usage"] = out.get("usage", {})
            return out["choices"][0]["message"]["content"], stat
        except Exception as exc:                                  # noqa: BLE001
            last = exc
            text = str(exc)
            throttled = "402" in text or "429" in text
            if throttled:
                stat["throttled"] += 1
                time.sleep(min(4 + attempt * 4, 30) + random.uniform(0, 4))
            else:
                time.sleep(min(2 ** attempt * 2, 15))
            if attempt == retries - 1:
                log(f"    giving up after {retries}: {type(exc).__name__}: {text[:120]}")
            elif attempt == 0:
                log(f"    retry: {type(exc).__name__}: {text[:100]}")
    stat["seconds"] = round(time.time() - t0, 1)
    raise RuntimeError(f"vision call failed after {retries} attempts: {last}")


def _json_object(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end < 0:
        raise ValueError("no JSON object in model output: " + text[:400])
    # strict=False tolerates raw control characters (literal newlines) that the
    # model occasionally leaves inside string values.
    return json.loads(text[start:end + 1], strict=False)


# --------------------------------------------------------------------------- #
# Page rendering / bands
# --------------------------------------------------------------------------- #

def render(doc: pymupdf.Document, page_no: int) -> bytes:
    """Rendered page as JPEG.

    These pages are screenshots, so PNG produced ~2-3 MB per page and the
    base64 wrapper pushed a 4-page request to ~30 MB.  JPEG at quality 88 keeps
    the text crisp for OCR while cutting the payload by roughly a factor of ten,
    which is what keeps a parallel run inside memory.
    """
    return doc[page_no].get_pixmap(dpi=DPI).tobytes("jpeg", jpg_quality=88)


def bands(doc: pymupdf.Document, page_no: int) -> list[dict]:
    """Embedded raster bands of a page, in reading order (top -> bottom)."""
    infos = doc[page_no].get_image_info(xrefs=True)
    out = []
    for im in sorted(infos, key=lambda i: (round(i["bbox"][1], 1), i["bbox"][0])):
        out.append({"xref": im.get("xref"), "bbox": [round(v, 2) for v in im["bbox"]],
                    "px": [im["width"], im["height"]]})
    return out


# --------------------------------------------------------------------------- #
# Extraction prompt
# --------------------------------------------------------------------------- #

PROMPT = """You are extracting questions from a scanned medical MCQ question bank used for AMC exam
preparation. You are given {n} consecutive page images from this bank, labelled IMAGE 1 .. IMAGE {n}.

Layout of the bank:
 * Every question has a QUESTION page: the clinical vignette stem, the question line, and exactly 5
   answer options. NO answer is marked on it.
 * The very next page is that question's ANSWER/EXPLANATION page: the same options with community
   statistics percentages, the CORRECT option marked with a green tick, the explanation, often one or
   two "key takeaway" lines marked with a lightbulb, and often an anatomical/clinical illustration.
 * A question with a very long stem can spill onto one extra page ("continuation").
 * Because of those continuations, a window does not always begin on a question page.

STEP 1 - classify every image. Reply with "page_roles": one entry per image, in order:
   {{"image_index": <1-based>, "role": "question" | "answer" | "continuation" | "other",
     "question_number": <integer printed at the top of a question page, else null>}}
   Use "continuation" only for a page that just carries the tail of the previous question's stem.
   Use "other" for a cover, blank, or anything else.

STEP 2 - extract EVERY question whose QUESTION page and ANSWER page are BOTH inside the window.
   A window that starts on an orphan "answer" page: ignore that orphan and extract every later
   complete pair. Never silently drop a complete pair that lies inside the window.

Reply with ONE JSON object with exactly two keys, "page_roles" and "questions".

Each element of "questions" has EXACTLY these keys:

 "question_number"            integer printed at the top of the question page (null if not visible)
 "question_image_index"       1-based index of the image holding the stem/options
 "answer_image_index"         1-based index of the image holding that question's answer/explanation page
 "stem"                       VERBATIM transcription of the clinical vignette, then the question line
                              (e.g. "Which one of the following is the most likely diagnosis?"), then the
                              "Choose the single best answer." line. Original wording, order and language,
                              character for character. Separate paragraphs with \\n\\n.
                              Do NOT include the "Question N" heading. Do NOT include the options.
                              Never summarise, correct, translate or rephrase.
 "options"                    array of EXACTLY 5 strings: the option texts verbatim in display order,
                              with radio-button glyphs and any percentage figures removed.
 "correct_answer"             single uppercase letter A-E for the option marked with the green tick on
                              the answer page (A = 1st option, B = 2nd, ...). null if no green tick.
 "correct_answer_source"      "green_tick" if a green tick was seen, otherwise "not_found"
 "respondent_answer"          letter A-E of an option separately labelled "Your Answer" when that label
                              sits on a DIFFERENT option from the green tick; otherwise null
 "explanation"                VERBATIM transcription of the whole explanation from the answer page,
                              including its key-takeaway bullet lines at the end. Do NOT include the
                              option statistics list, the green-tick option list, or any page heading.
                              Never summarise, condense, translate or rephrase.
 "key_takeaways"              array of the lightbulb key-takeaway lines, verbatim, WITHOUT the emoji.
                              [] when there are none.
 "has_clinical_image"         true if a page of THIS question holds a clinical figure the question
                              depends on (ECG, X-ray, CT, MRI, ultrasound, photograph, histology, graph,
                              table, anatomical diagram). else false
 "clinical_image_image_index" 1-based image index holding that clinical figure, else null
 "source_category"            a specialty/subtopic label actually PRINTED on either of this question's
                              pages, verbatim. null when no such label is printed. Never guess.
 "notes"                      short note about any anomaly (not 5 options, no explanation, unreadable
                              text, stem continues onto a later page, ...), else null

Absolute rules:
 - Transcribe only. Never answer the question yourself, never add medical facts.
 - Never invent a field that is not printed in the source. Use null / [] when absent.
 - The answer page does not repeat the question number; associate it by position.
 - If a value is unreadable write "[unreadable]".

Output ONLY the JSON object. No markdown fences, no commentary.
"""


# --------------------------------------------------------------------------- #
# Per-PDF worker
# --------------------------------------------------------------------------- #

def pdf_key(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def start_question(path: str) -> int:
    head = os.path.basename(path).split("+")[0]
    return int(head.split("-")[0]) if head.split("-")[0].isdigit() else 0


def extract_window(doc: pymupdf.Document, idx: list[int], key: str) -> dict:
    """One model call over `idx` pages. Returns {'page_roles': [...], 'questions': [...]}

    A malformed reply is retried here rather than skipped, because skipping a
    window silently drops whole questions.
    """
    imgs = [render(doc, p) for p in idx]
    data = None
    last = None
    for attempt in range(3):
        raw, stat = vision(imgs, PROMPT.format(n=len(idx)))
        try:
            data = _json_object(raw)
            break
        except Exception as exc:                                   # noqa: BLE001
            last = exc
            log(f"    bad JSON (attempt {attempt + 1}): {str(exc)[:160]}")
            time.sleep(2)
    if data is None:
        raise ValueError(f"unparseable model output: {last}")
    roles = data.get("page_roles") or []
    qs = data.get("questions") or []
    for it in qs:
        ai, qi = it.get("answer_image_index"), it.get("question_image_index")
        if isinstance(ai, int) and 1 <= ai <= len(idx):
            it["answer_page_pdf_index"] = idx[ai - 1]
        if isinstance(qi, int) and 1 <= qi <= len(idx):
            it["question_page_pdf_index"] = idx[qi - 1]
    log(f"  [{key}] pages {idx[0]}-{idx[-1]}  {stat['seconds']}s attempts={stat['attempts']} "
        f"out={stat.get('usage', {}).get('completion_tokens', '?')}tok "
        f"qnums={[q.get('question_number') for q in qs]} roles={[r.get('role') for r in roles]}")
    return {"page_roles": roles, "questions": qs, "window": idx}


def process_pdf(path: str, sink, prog: dict, pagesink, stop_after: int | None = None) -> None:
    key = pdf_key(path)
    doc = pymupdf.open(path)
    n = doc.page_count
    i = prog.setdefault(key, {}).get("page", 0)
    got = prog[key].get("extracted", 0)
    while i < n:
        if stop_after is not None and got >= stop_after:
            break
        idx = list(range(i, min(i + CHUNK, n)))
        try:
            res = extract_window(doc, idx, key)
        except Exception as exc:                                   # noqa: BLE001
            log(f"  [{key}] FAILED window {idx[0]}-{idx[-1]}: {exc}")
            with _lock:
                prog.setdefault("errors", []).append({"pdf": key, "page": i, "error": str(exc)})
            i += 2
            prog[key] = {"page": i, "extracted": got}
            continue
        pagesink(key, idx, res["page_roles"])
        # Advance to just past the last ANSWER page this window actually produced.
        # Using the per-question answer index (a direct association) rather than
        # the page-role labels makes the stride immune to a page being labelled
        # "continuation" or "other".
        answers = [q["answer_image_index"] for q in res["questions"]
                   if isinstance(q.get("answer_image_index"), int)]
        if not answers:
            answers = [r["image_index"] for r in res["page_roles"]
                       if r.get("role") == "answer" and isinstance(r.get("image_index"), int)]
        advance = max(answers) if answers else 2
        advance = max(2, min(advance, len(idx)))
        for it in res["questions"]:
            if it.get("question_number") is None:
                continue
            it["source_pdf"] = os.path.basename(path)
            it["source_pdf_key"] = key
            it["source_provider"] = PROVIDER
            # The printed number restarts at 1 in EVERY pdf, so it is only unique
            # inside its own file.  The stable identity is therefore file + number;
            # the printed number is preserved verbatim alongside it.
            it["source_question_id"] = f"{key}#{it['question_number']}"
            it["source_question_number"] = it["question_number"]
            it["source_declared_range"] = os.path.basename(path).split("+")[0]
            it.setdefault("notes", None)
            sink(it)
            got += 1
        i += advance
        prog[key] = {"page": i, "extracted": got}
    doc.close()


def _qkey(it: dict) -> str:
    return f'{it.get("source_pdf_key")}#{it.get("question_number")}'


def run(pdfs: list[str], workers: int = 12, stop_after: int | None = None) -> None:
    os.makedirs(OUT, exist_ok=True)
    qpath, ppath = os.path.join(OUT, "questions.jsonl"), os.path.join(OUT, "progress.json")
    pgpath = os.path.join(OUT, "pages.jsonl")
    prog = {}
    if os.path.exists(ppath):
        try:
            prog = json.load(open(ppath, encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            # A truncated pointer only costs re-reading some windows; questions
            # already extracted are deduped, so nothing is lost.
            log(f"  progress.json unreadable ({exc}); starting from the question log")
    seen = set()
    if os.path.exists(qpath):
        for line in open(qpath, encoding="utf-8"):
            if line.strip():
                try:
                    seen.add(_qkey(json.loads(line)))
                except Exception:                                  # noqa: BLE001
                    pass
    fh = open(qpath, "a", encoding="utf-8")
    pgh = open(pgpath, "a", encoding="utf-8")
    semi = threading.Semaphore(workers)

    def sink(it):
        k = _qkey(it)
        if k in seen:
            return
        seen.add(k)
        with _lock:
            fh.write(json.dumps(it, ensure_ascii=False) + "\n")
            fh.flush()

    def pagesink(k, idx, roles):
        with _lock:
            for r in roles:
                gi = r.get("image_index")
                if isinstance(gi, int) and 1 <= gi <= len(idx):
                    pgh.write(json.dumps({"pdf": k, "page": idx[gi - 1],
                                          "role": r.get("role"),
                                          "question_number": r.get("question_number")},
                                         ensure_ascii=False) + "\n")
            pgh.flush()

    def work(p):
        with semi:
            try:
                process_pdf(p, sink, prog, pagesink, stop_after)
            except Exception as exc:                               # noqa: BLE001
                log(f"  [{pdf_key(p)}] FATAL {exc}")
                with _lock:
                    prog.setdefault("errors", []).append({"pdf": pdf_key(p), "fatal": str(exc)})

    # Progress is flushed on a timer as well as at PDF boundaries, so an
    # interrupted run resumes from the last window instead of the last file.
    # Written to a sibling and swapped in, so a crash mid-write cannot leave a
    # truncated progress file behind.
    def save_progress():
        with _lock:
            tmp = ppath + ".tmp"
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(prog, fh, ensure_ascii=False, indent=1)
            os.replace(tmp, ppath)

    def saver():
        while not stop_saver.wait(15):
            try:
                save_progress()
            except OSError as exc:
                log(f"    progress save failed: {exc}")

    stop_saver = threading.Event()
    threading.Thread(target=saver, daemon=True).start()

    threads = [threading.Thread(target=work, args=(p,)) for p in pdfs]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    stop_saver.set()
    fh.close()
    pgh.close()
    save_progress()


# The OCR lane scheduler owns this file.  The flag lives outside the repo's
# normal output tree so that clearing it is an explicit operator action.
LANE_PAUSE_FLAG = r"C:\AMC_Study_OS\orchestration\ocr_scheduler\flags\PAUSE_emidici.json"


def _pause_guard() -> None:
    """Honour the OCR lane scheduler's pause flag for the `emidici` lane.

    Deliberately inside main() rather than in a wrapper: a bare
    `python extract.py` -- or a concurrent agent session launching it -- must be
    stopped too, not only the callers that cooperate with run_lane.py.
    Pausing is lossless: progress.json, questions.jsonl and pages.jsonl are
    left exactly as they are, so a later resume continues from the same window.
    """
    if not os.path.exists(LANE_PAUSE_FLAG):
        return
    try:
        info = json.load(open(LANE_PAUSE_FLAG, encoding="utf-8"))
    except Exception:                                              # noqa: BLE001
        info = {"reason": "pause flag present (unreadable)"}
    reason = info.get("reason")
    log(f"=== RUN REFUSED: lane emidici is PAUSED by ocr_scheduler ({reason})")
    print(f"[emidici-ocr] PAUSED by ocr_scheduler: {reason}", flush=True)
    print("[emidici-ocr] resume with: python orchestration/ocr_scheduler/scheduler.py "
          "resume emidici", flush=True)
    raise SystemExit(75)


def main() -> None:
    _pause_guard()
    stop_after = None
    workers = 12
    only = None
    for a in sys.argv[1:]:
        if a.startswith("--stop-after="):
            stop_after = int(a.split("=")[1])
        elif a.startswith("--workers="):
            workers = int(a.split("=")[1])
        elif a.startswith("--only="):
            only = a.split("=")[1]
    pdfs = sorted((os.path.join(SRC, f) for f in os.listdir(SRC) if f.lower().endswith(".pdf")),
                  key=start_question)
    if only:
        pdfs = [p for p in pdfs if only in os.path.basename(p)]
    log(f"=== RUN pdfs={len(pdfs)} workers={workers} stop_after={stop_after} dpi={DPI} only={only}")
    run(pdfs, workers, stop_after)
    log("=== RUN COMPLETE")


if __name__ == "__main__":
    main()
