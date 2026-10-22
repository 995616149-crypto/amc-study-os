#!/usr/bin/env python
"""Report the current Emidici checkpoint from existing artefacts only.

Reads progress.json / questions.jsonl / pages.jsonl / gap_report.json /
import_report.json / figures.json.  It never renders a page, never calls a model
and never rescans the 10,815 source pages.
"""
from __future__ import annotations

import json
import os
import sqlite3
from collections import defaultdict

ROOT = r"C:\AMC_Study_OS"
STAGING = os.path.join(ROOT, "_staging", "emidici")
SRC = r"C:\Users\LIN\Downloads\新建文件夹\Emedici2026最新"
DB = os.path.join(ROOT, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
                  "faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite")


def j(name, default=None):
    p = os.path.join(STAGING, name)
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else default


def main():
    pdfs = sorted(f for f in os.listdir(SRC) if f.lower().endswith(".pdf"))
    prog = j("progress.json", {})
    qs = [json.loads(l) for l in open(os.path.join(STAGING, "questions.jsonl"), encoding="utf-8") if l.strip()]
    gaprep = j("gap_report.json", {})
    figs = j("figures.json", {})
    figdet = j("figures_detail.json", {})
    prep = os.path.join(STAGING, "prep", "page_counts.json")
    prepc = json.load(open(prep, encoding="utf-8")) if os.path.exists(prep) else None

    per_pdf_pages = {k: v.get("page", 0) for k, v in prog.items() if isinstance(v, dict)}
    pages_advanced = sum(per_pdf_pages.values())
    total_pages = 10815
    if prepc:
        total_pages = sum(int(v) for v in (prepc.values() if isinstance(prepc, dict) else prepc))

    by_ident = {(q["source_pdf_key"], q["question_number"]) for q in qs}
    gaps = []
    for g in gaprep.get("gaps", []):
        key, _, num = g.rpartition("#")
        if key:
            gaps.append((key, int(num)))
    gaps = sorted(set(gaps))

    con = sqlite3.connect("file:" + DB + "?mode=ro", uri=True)
    imported = con.execute("SELECT count(*) FROM canonical_records WHERE source_provider='Emidici'").fetchone()[0]
    active = con.execute("SELECT count(*) FROM canonical_records WHERE source_provider='Emidici' AND active_quiz=1").fetchone()[0]
    needs_fig = con.execute(
        "SELECT count(*) FROM canonical_records WHERE source_provider='Emidici' "
        "AND provenance_json LIKE '%\"requires_visual\":true%'").fetchone()[0]
    with_asset = con.execute(
        "SELECT count(*) FROM canonical_records WHERE source_provider='Emidici' AND visual_asset IS NOT NULL").fetchone()[0]
    con.close()

    assets_dir = os.path.join(ROOT, "public", "emidici-assets")
    asset_files = len([n for n in os.listdir(assets_dir) if n.endswith(".jpg")]) if os.path.isdir(assets_dir) else 0

    figures_required = sum(1 for q in qs if q.get("has_clinical_image"))
    figures_on_question = sum(1 for q in qs
                              if q.get("has_clinical_image")
                              and q.get("clinical_image_image_index") == q.get("question_image_index"))

    out = {
        "source_pdfs_total": len(pdfs),
        "source_pages_total": total_pages,
        "pages_advanced_total": pages_advanced,
        "pdfs_started": len([k for k, v in per_pdf_pages.items() if v > 0]),
        "pdfs_finished": (len([k for k, v in per_pdf_pages.items()
                               if isinstance(prepc, dict) and v >= int(prepc.get(k, 10 ** 9))])
                          if isinstance(prepc, dict) else None),
        "questions_parsed": len(qs),
        "questions_imported": imported,
        "practiceable_imported": active,
        "known_gaps": len(gaps),
        "gap_sample": [f"{k}#{n}" for k, n in gaps[:10]],
        "figure_dependent_questions": needs_fig,
        "figure_dependent_in_extraction": figures_required,
        "figure_on_question_page": figures_on_question,
        "figure_assets_extracted": asset_files,
        "figure_assets_file": len(figs),
        "imported_with_visual_asset": with_asset,
        "progress_errors": len(prog.get("errors", [])),
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))
    json.dump(out, open(os.path.join(STAGING, "checkpoint_report.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)



if __name__ == "__main__":
    main()
