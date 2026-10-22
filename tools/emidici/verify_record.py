#!/usr/bin/env python
"""Independently re-read one extracted record from its source pages.

Used to settle the report's "options = 100%" against the one record the
practiceability rules mark as MISSING_STEM_OPTIONS, so the final report states
the real value instead of a rounded one.
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract as E  # noqa: E402

ASK = """Read these pages (a question page and its answer page from a medical MCQ bank).
Reply with ONLY a JSON object:
{"question_number": <int>,
 "options": [<every option text printed for this question, verbatim, in display order,
              excluding percentages, radio glyphs and any answer marking>],
 "option_count": <int>,
 "lettered_labels": [<the option letters that are actually printed, e.g. "A","B">],
 "notes": "<anything unusual about the option list, else null>"}
Do not add an option that is not printed. No commentary."""


def main():
    sid = sys.argv[1]
    qs = [json.loads(l) for l in open(os.path.join(E.OUT, "questions.jsonl"), encoding="utf-8") if l.strip()]
    rec = next((q for q in qs if q["source_question_id"] == sid), None)
    if not rec:
        sys.exit(f"not found: {sid}")

    doc = E.pymupdf.open(os.path.join(E.SRC, rec["source_pdf"]))
    pages = [rec["question_page_pdf_index"], rec["answer_page_pdf_index"]]
    imgs = [E.render(doc, p) for p in pages]
    raw, _ = E.vision(imgs, ASK)
    got = E._json_object(raw)

    out = {
        "source_question_id": sid,
        "source_pdf": rec["source_pdf"],
        "question_page": pages[0],
        "answer_page": pages[1],
        "extracted_options": rec.get("options"),
        "extracted_option_count": len([o for o in (rec.get("options") or []) if str(o).strip()]),
        "extracted_answer": rec.get("correct_answer"),
        "reread_options": got.get("options"),
        "reread_option_count": got.get("option_count"),
        "reread_lettered_labels": got.get("lettered_labels"),
        "reread_notes": got.get("notes"),
    }
    out["verdict"] = ("SOURCE_HAS_4_OPTIONS" if got.get("option_count") == 4
                      else "PARSER_MISSED_AN_OPTION" if (got.get("option_count") or 0) > 4
                      else "INCONCLUSIVE")
    print(json.dumps(out, ensure_ascii=False, indent=2))
    json.dump(out, open(os.path.join(E.OUT, "option_audit.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
