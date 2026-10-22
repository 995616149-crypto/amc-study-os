#!/usr/bin/env python
"""Emidici figure pass.

Splits each image-bearing question page into its embedded bands and keeps ONLY
the bands that really are the clinical figure the question needs.

Two hard rules from the brief are enforced here:
  * a band that carries answer or explanation text is never used as a question
    image (answer-leak guard);
  * when a band mixes stem text and the figure, only the figure's own rectangle
    is cropped, so no answer page and no explanation is ever re-exposed.

Produces:
  _staging/emidici/figures.json           source_question_id -> [asset urls]
  public/emidici-assets/<record_id>-<n>.jpg
"""

from __future__ import annotations

import hashlib
import io
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import pymupdf
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract as E  # noqa: E402

ASSETS = r"C:\AMC_Study_OS\public\emidici-assets"
FIGJSON = os.path.join(E.OUT, "figures.json")
PROVIDER = "Emidici"

_lock = threading.Lock()


def record_id(sid: str) -> str:
    return hashlib.sha1(f"{PROVIDER}|{sid}".encode()).hexdigest()[:20]


BAND_PROMPT = """You are shown the {n} stacked screenshot bands that make up ONE question page of a
medical MCQ bank (band 1 is at the top). The page contains the clinical vignette, the question line,
exactly 5 options, and possibly a clinical figure. It does NOT contain any answer, green tick,
percentage statistics or explanation (those live on the following page).

For EVERY band, output one entry in a JSON array, in order:
{{"band": <1-based>,
  "kind": <choose exactly one>:
      "clinical_figure"       - the band actually DISPLAYS a figure: an ECG trace, X-ray, CT, MRI,
                                ultrasound, clinical photograph, histology slide, graph, chart,
                                table or anatomical diagram.
      "stem_and_options_text" - the band is the vignette text plus the 5 options.
      "stem_text_only"        - the band is vignette text only.
      "options_text_only"     - the band is the 5 options only.
      "other"                 - a header, footer, blank area or anything else.
  "contains_answer_or_explanation": <true|false - the band shows an answer marking, a green tick,
                                     an option-percentage list, "Your Answer", or explanation prose>,
  "figure_bbox_normalised": [x0,y0,x1,y1] or null - only when kind is "clinical_figure" AND the band
                                     also contains text: the figure's own rectangle as fractions of
                                     the band (0..1). When the whole band is the figure use
                                     [0,0,1,1]. Otherwise null.
  "caption": "<any caption printed with the figure, verbatim, else null>"}}

Critical rule: a band is "clinical_figure" ONLY when a figure is actually DRAWN in it. A band that
merely mentions an investigation in words (for example "an ECG showed ...") is text, not a figure.
Each band must get exactly one kind, and the kinds must be consistent with what is drawn.

Output ONLY the JSON array. No commentary."""


def classify(question: dict, band_images: list[bytes]) -> list[dict]:
    raw, _ = E.vision(band_images, BAND_PROMPT.format(n=len(band_images)))
    text = raw.strip()
    start, end = text.find("["), text.rfind("]")
    if start < 0 or end < 0:
        raise ValueError("no JSON array: " + text[:200])
    return json.loads(text[start:end + 1], strict=False)


def crop_band(band_bytes: bytes, bbox: list | None) -> bytes:
    img = Image.open(io.BytesIO(band_bytes)).convert("RGB")
    if bbox and len(bbox) == 4:
        w, h = img.size
        x0, y0, x1, y1 = bbox
        if not (x0 == 0 and y0 == 0 and x1 == 1 and y1 == 1):
            box = (max(0, int(x0 * w)), max(0, int(y0 * h)),
                   min(w, int(x1 * w)), min(h, int(y1 * h)))
            if box[2] - box[0] > 40 and box[3] - box[1] > 40:
                img = img.crop(box)
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=88, optimize=True)
    return out.getvalue()


def process(question: dict, docs: dict) -> dict:
    sid = question["source_question_id"]
    rid = record_id(sid)
    if not (question.get("has_clinical_image")
            and question.get("clinical_image_image_index") == question.get("question_image_index")):
        # A figure that only exists on the answer page is deliberately NOT used as
        # a question image: the question does not need it and it would leak the
        # diagnosis before the learner answers.
        return {"sid": sid, "rid": rid, "assets": [], "reason": "figure_on_answer_page_only"
                if question.get("has_clinical_image") else "no_figure"}

    key = question["source_pdf"]
    doc = docs.get(key) or docs.setdefault(key, pymupdf.open(os.path.join(E.SRC, key)))
    page = question["question_page_pdf_index"]
    bands = E.bands(doc, page)
    if not bands:
        return {"sid": sid, "rid": rid, "assets": [], "reason": "no_bands"}

    band_bytes = []
    for b in bands:
        try:
            band_bytes.append(doc.extract_image(b["xref"])["image"])
        except Exception:                                          # noqa: BLE001
            band_bytes.append(b"")
    try:
        verdicts = classify(question, band_bytes)
    except Exception as exc:                                       # noqa: BLE001
        return {"sid": sid, "rid": rid, "assets": [], "reason": f"classify_failed:{exc}"}

    assets, i = [], 0
    for v in verdicts:
        # A single consistent signal only.  An earlier two-field version let the
        # model contradict itself and attach a screenshot of the stem as if it
        # were a figure, which is exactly the answer-leak class of defect this
        # pass exists to prevent.
        if v.get("kind") != "clinical_figure":
            continue
        if v.get("contains_answer_or_explanation"):
            continue                       # answer-leak guard
        idx = int(v.get("band", 0)) - 1
        if not (0 <= idx < len(band_bytes)) or not band_bytes[idx]:
            continue
        try:
            data = crop_band(band_bytes[idx], v.get("figure_bbox_normalised"))
        except Exception:                                          # noqa: BLE001
            continue
        i += 1
        name = f"{rid}-{i}.jpg"
        with _lock:
            os.makedirs(ASSETS, exist_ok=True)
            with open(os.path.join(ASSETS, name), "wb") as fh:
                fh.write(data)
        assets.append({"url": f"/emidici-assets/{name}", "band": idx + 1,
                       "caption": v.get("caption"), "kind": v.get("kind")})
    return {"sid": sid, "rid": rid, "assets": assets, "reason": None if assets else "no_safe_figure_band"}


def main() -> None:
    qpath = os.path.join(E.OUT, "questions.jsonl")
    qs = [json.loads(l) for l in open(qpath, encoding="utf-8") if l.strip()]
    targets = [q for q in qs if q.get("has_clinical_image")]
    print(f"questions={len(qs)}  with any figure={len(targets)}")
    docs: dict[str, pymupdf.Document] = {}
    results = {}

    def work(q):
        try:
            r = process(q, docs)
        except Exception as exc:                                   # noqa: BLE001
            r = {"sid": q.get("source_question_id"), "rid": record_id(q.get("source_question_id", "")),
                 "assets": [], "reason": f"error:{exc}"}
        with _lock:
            results[r["sid"]] = r
            if len(results) % 25 == 0:
                print(f"  {len(results)}/{len(targets)}", flush=True)
        return r

    workers = next((int(a.split("=")[1]) for a in sys.argv if a.startswith("--workers=")), 12)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(work, targets))

    figures = {sid: [a["url"] for a in r["assets"]] for sid, r in results.items() if r["assets"]}
    detail = {sid: r for sid, r in results.items()}
    json.dump(figures, open(FIGJSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(detail, open(os.path.join(E.OUT, "figures_detail.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    from collections import Counter
    print("figure outcomes:", Counter(r["reason"] or "ok" for r in results.values()))
    print(f"questions with a stored figure: {len(figures)}  files: {sum(len(v) for v in figures.values())}")


if __name__ == "__main__":
    main()
