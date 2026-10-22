#!/usr/bin/env python
"""PILOT validation: structural checks + independent re-read of the source pages.

Nothing here trusts the extractor.  Every claim is re-derived either from the
extracted artefact itself or from a fresh vision read of the original PDF pages.
"""
import json
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract as E  # noqa: E402

STAGING = E.OUT
QS = [json.loads(l) for l in open(os.path.join(STAGING, "questions.jsonl"), encoding="utf-8") if l.strip()]
QS.sort(key=lambda q: q["question_number"])

print(f"pilot questions: {len(QS)}  range {QS[0]['question_number']}..{QS[-1]['question_number']}")
nums = [q["question_number"] for q in QS]
print("gaps:", sorted(set(range(min(nums), max(nums) + 1)) - set(nums)) or "none")

fails = []
rows = []
for q in QS:
    stem = (q.get("stem") or "").strip()
    opts = [o for o in (q.get("options") or []) if str(o).strip()]
    ans = q.get("correct_answer")
    expl = (q.get("explanation") or "").strip()
    checks = {
        "stem": len(stem) >= 40,
        "options5": len(opts) == 5,
        "answer": bool(ans) and ans in "ABCDE",
        "expl": len(expl) >= 40,
        "page": isinstance(q.get("question_page_pdf_index"), int) and isinstance(q.get("answer_page_pdf_index"), int),
    }
    # The answer page must be the page right after the question page's own page
    # (allowing for a continuation page).
    if checks["page"]:
        checks["page_order"] = q["answer_page_pdf_index"] > q["question_page_pdf_index"]
    if not all(checks.values()):
        fails.append((q["question_number"], [k for k, v in checks.items() if not v]))
    rows.append((q["question_number"], len(stem), len(opts), ans, len(expl),
                 q.get("has_clinical_image"), q.get("question_page_pdf_index"),
                 q.get("answer_page_pdf_index"), q.get("notes")))

print(f"\n{'Q':>4} {'stem':>5} {'opt':>3} {'ans':>3} {'expl':>5} {'img':>5} {'qpg':>4} {'apg':>4}  notes")
for r in rows:
    print(f"{r[0]:>4} {r[1]:>5} {r[2]:>3} {str(r[3]):>3} {r[4]:>5} {str(r[5]):>5} {str(r[6]):>4} {str(r[7]):>4}  {r[8] or ''}")

print("\nstructural failures:", fails or "NONE")

# ---- independent re-read of the source pages for a sample -------------------
print("\n=== independent re-read verification ===")
doc = E.pymupdf.open(os.path.join(E.SRC, QS[0]["source_pdf"]))
VERIFY = """Read these two page images (they are the question page and its answer page from a medical
MCQ bank). Report ONLY a JSON object:
{"question_number": <int>,
 "stem_first_40_chars": <verbatim first 40 characters of the clinical vignette, excluding the "Question N" heading>,
 "options": [<the 5 option texts verbatim, without radio glyphs or percentages>],
 "correct_answer_letter": <"A"-"E" for the option with the green tick, else null>,
 "explanation_first_60_chars": <verbatim first 60 characters of the explanation body>,
 "has_clinical_figure": <true|false>}
No commentary."""
sample = [q for q in QS if q["question_number"] in (1, 5, 12, 17)]
ok = 0
for q in sample:
    pages = [q["question_page_pdf_index"], q["answer_page_pdf_index"]]
    imgs = [E.render(doc, p) for p in pages]
    raw, _ = E.vision(imgs, VERIFY)
    got = E._json_object(raw)
    match = {
        "number": got.get("question_number") == q["question_number"],
        "stem": (q["stem"] or "").strip().lower().startswith(
            (got.get("stem_first_40_chars") or "").strip().lower()[:35]) if got.get("stem_first_40_chars") else False,
        "options": [o.strip().lower() for o in (got.get("options") or [])] ==
                   [o.strip().lower() for o in (q.get("options") or [])],
        "answer": got.get("correct_answer_letter") == q.get("correct_answer"),
        "expl": (q.get("explanation") or "").strip().lower().startswith(
            (got.get("explanation_first_60_chars") or "").strip().lower()[:50]) if got.get("explanation_first_60_chars") else False,
        "figure": bool(got.get("has_clinical_figure")) == bool(q.get("has_clinical_image")),
    }
    print(f"  Q{q['question_number']}: " + " ".join(f"{k}={'OK' if v else 'MISMATCH'}" for k, v in match.items()))
    if not all(match.values()):
        print(f"     extracted answer={q.get('correct_answer')} reread={got.get('correct_answer_letter')}")
        print(f"     extracted opts={q.get('options')}")
        print(f"     reread    opts={got.get('options')}")
    ok += all(match.values())
print(f"\nindependent re-read: {ok}/{len(sample)} fully agree")
