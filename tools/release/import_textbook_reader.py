"""
Import the COMPLETE structured Murtagh 9e textbook into the authoritative D1.

What this does
--------------
It reads the assembler's own output and nothing else:

    structured/book.json  parts.json  chapters.json  sections.json  blocks.jsonl

and writes the readable layer defined by `drizzle/0062_textbook_reader.sql` into
the D1 SQLite that the deployment actually ships
(`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`).

It does NOT re-OCR, re-parse, re-segment, translate, summarise or "fix" anything.
The text columns are byte-for-byte the assembler's `content` / `caption` /
`table_html` values, so the site can show a section from its first block to its
last without an AI ever touching the words.

Section identity
----------------
`section_uid` == `section_id`, except for nine back-matter records where the
Appendices and Index chapters share the same `BM:0NN` id; there the uid is
`section_id@chapter_id`.  That keeps all 8 420 records addressable.

Usage
-----
    python tools/release/import_textbook_reader.py            # dry run, report
    python tools/release/import_textbook_reader.py --apply    # write
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import sqlite3
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BOOK_ID = "book:murtagh-gp-9e"

SOURCE_ROOTS = [
    os.environ.get("TEXTBOOK_MURTAGH_ROOT"),
    r"C:\AMC_Study_OS_data\textbooks\murtagh_gp_9e",
    r"C:\AMC_Study_OS_data\moved_bulk\textbooks\murtagh_gp_9e",
    os.path.join(ROOT, "textbooks", "murtagh_gp_9e"),
]
MIGRATION = os.path.join(ROOT, "drizzle", "0062_textbook_reader.sql")
MIGRATION_NAME = "0062_textbook_reader.sql"

# page furniture: running heads / footers / rules the assembler already classified
HIDDEN_BLOCK_TYPES = {"discarded"}


def find_source_root() -> str:
    for candidate in SOURCE_ROOTS:
        if not candidate:
            continue
        structured = os.path.join(candidate, "structured")
        if os.path.exists(os.path.join(structured, "blocks.jsonl")):
            return candidate
    raise SystemExit("structured textbook artefacts not found in any known root")


def authoritative_db() -> str:
    candidates = [
        path
        for path in glob.glob(os.path.join(ROOT, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite"))
        if "metadata" not in os.path.basename(path)
    ]
    if len(candidates) != 1:
        raise SystemExit(f"expected exactly one authoritative D1 file, found {candidates}")
    return candidates[0]


def read_json(path: str):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def load_blocks(path: str):
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                yield json.loads(line)


def build_rows(source_root: str):
    structured = os.path.join(source_root, "structured")
    book = read_json(os.path.join(structured, "book.json"))
    parts = read_json(os.path.join(structured, "parts.json"))["parts"]
    chapters = read_json(os.path.join(structured, "chapters.json"))["chapters"]
    sections = read_json(os.path.join(structured, "sections.json"))["sections"]

    # ---- parts -------------------------------------------------------------
    part_rows = []
    part_order_by_id = {}
    real_part_ids = set()
    for index, part in enumerate(parts):
        order = part.get("number") if isinstance(part.get("number"), int) else index + 1
        part_rows.append(
            (
                part["id"],
                BOOK_ID,
                order,
                part.get("title") or part["id"],
                part.get("printed_page_start"),
                part.get("pdf_page_start"),
            )
        )
        part_order_by_id[part["id"]] = order
        real_part_ids.add(part["id"])

    # ---- chapters ----------------------------------------------------------
    chapter_rows = []
    chapter_meta = {}
    for index, chapter in enumerate(chapters):
        cid = chapter["chapter_id"]
        raw_part = chapter.get("part_id")
        part_id = raw_part if raw_part in real_part_ids else None
        is_matter = 1 if part_id is None else 0
        # Front matter sorts before every part; back matter after every part.
        if cid.startswith("fm:"):
            order = -1
        elif cid.startswith("bm:"):
            order = 900 + index
        else:
            order = index
        chapter_rows.append(
            (
                cid,
                BOOK_ID,
                part_id,
                order,
                chapter.get("number"),
                chapter.get("title") or cid,
                chapter.get("pdf_page_start"),
                chapter.get("pdf_page_end"),
                chapter.get("printed_page_start"),
                0,
                0,
                is_matter,
            )
        )
        chapter_meta[cid] = {"part_id": part_id, "order": order}

    # ---- sections ----------------------------------------------------------
    section_records = []
    collisions = Counter()
    for section in sections:
        collisions[section["id"]] += 1
    total_records = len(sections)

    per_chapter_counter = defaultdict(int)
    section_uid_by_index = {}
    section_rows = []
    for index, section in enumerate(sections):
        sid = section["id"]
        cid = section.get("chapter_id") or ""
        # A collided id belongs to two different chapters; the uid carries the chapter.
        uid = f"{sid}@{cid}" if collisions[sid] > 1 else sid
        section_uid_by_index[index] = uid
        order = per_chapter_counter[cid]
        per_chapter_counter[cid] += 1
        section_rows.append(
            {
                "uid": uid,
                "section_id": sid,
                "chapter_id": cid,
                "part_id": chapter_meta.get(cid, {}).get("part_id"),
                "order": order,
                "title": section.get("title") or "",
                "heading_level": section.get("heading_level"),
                "start_page": section.get("pdf_page_start"),
                "end_page": None,
                "printed_page_start": None,
                "blocks": 0,
                "visible": 0,
                "chars": 0,
            }
        )

    # ---- blocks ------------------------------------------------------------
    by_uid_block_count = Counter()
    by_uid_visible = Counter()
    by_uid_chars = Counter()
    by_uid_page_min = {}
    by_uid_page_max = {}
    by_uid_printed_min = {}
    by_chapter_blocks = Counter()
    block_rows = []
    block_type_counts = Counter()
    seen_block_ids = set()
    duplicate_block_ids = 0
    orphan_blocks = 0

    for block in load_blocks(os.path.join(structured, "blocks.jsonl")):
        bid = block["block_id"]
        if bid in seen_block_ids:
            duplicate_block_ids += 1
            continue
        seen_block_ids.add(bid)
        sid = block.get("section_id")
        cid = block.get("chapter_id") or ""
        if sid:
            uid = f"{sid}@{cid}" if collisions[sid] > 1 else sid
        else:
            # 377 of the 641 tables were emitted at CHAPTER level: the assembler
            # placed them between sections without assigning a section.  They are
            # real book content (TABLE 1.3, TABLE 2.1 …), so they are kept rather
            # than dropped, under the synthetic uid `chapter:<chapter_id>` with
            # `section_id` NULL.  No section row is invented for them, so the
            # section count stays exactly the assembler's.
            orphan_blocks += 1
            uid = f"chapter:{cid}"
        block_type = block.get("block_type") or "paragraph"
        text = block.get("content") or ""
        page = block.get("pdf_page")
        printed = block.get("printed_page_if_detectable")
        if not isinstance(printed, int):
            printed = None
        by_uid_block_count[uid] += 1
        by_chapter_blocks[cid] += 1
        block_type_counts[block_type] += 1
        if block_type not in HIDDEN_BLOCK_TYPES and text.strip():
            by_uid_visible[uid] += 1
        by_uid_chars[uid] += len(text)
        if isinstance(page, int):
            by_uid_page_min[uid] = page if uid not in by_uid_page_min else min(by_uid_page_min[uid], page)
            by_uid_page_max[uid] = page if uid not in by_uid_page_max else max(by_uid_page_max[uid], page)
        if printed is not None:
            by_uid_printed_min[uid] = printed if uid not in by_uid_printed_min else min(by_uid_printed_min[uid], printed)
        block_rows.append(
            (
                bid,
                uid,
                sid,
                cid,
                int(block.get("reading_order") or 0),
                block_type,
                text,
                block.get("heading_level"),
                page if isinstance(page, int) else None,
                printed,
                block.get("figure_id"),
                block.get("caption") or None,
                block.get("figure_asset") or None,
                block.get("table_id"),
                block.get("table_html") or None,
                block.get("table_text") or None,
                block.get("table_caption") or None,
                block.get("manual_review_status") or None,
            )
        )

    # ---- reconcile section aggregates -------------------------------------
    chapter_sections = Counter()
    for row in section_rows:
        uid = row["uid"]
        row["blocks"] = by_uid_block_count.get(uid, 0)
        row["visible"] = by_uid_visible.get(uid, 0)
        row["chars"] = by_uid_chars.get(uid, 0)
        row["end_page"] = by_uid_page_max.get(uid)
        row["printed_page_start"] = by_uid_printed_min.get(uid)
        if row["start_page"] is None:
            row["start_page"] = by_uid_page_min.get(uid)
        chapter_sections[row["chapter_id"]] += 1

    chapter_rows = [
        (cid, book_id, part_id, order, number, title, start, end, printed, chapter_sections.get(cid, 0), by_chapter_blocks.get(cid, 0), is_matter)
        for (cid, book_id, part_id, order, number, title, start, end, printed, _s, _b, is_matter) in chapter_rows
    ]

    book_row = (
        BOOK_ID,
        book.get("title") or "Murtagh's General Practice",
        "9th Edition",
        "en",
        book.get("generated") or "",
        "0415dd648f9e8d61a96731c9a2760036e157a3c65c486f44d375995219012d42",
        len(part_rows),
        len(chapter_rows),
        len(section_rows),
        len(block_rows),
        book.get("figures") or 0,
        book.get("tables") or 0,
        book.get("generated"),
    )

    return {
        "book": book_row,
        "parts": part_rows,
        "chapters": chapter_rows,
        "sections": section_rows,
        "blocks": block_rows,
        "declared": {
            "sections": book.get("sections"),
            "blocks": book.get("blocks"),
            "chapters": book.get("chapters"),
            "parts": book.get("parts"),
            "figure": book.get("figures"),
            "table": book.get("tables"),
        },
        "records": total_records,
        "block_type_counts": dict(block_type_counts),
        "duplicate_block_ids": duplicate_block_ids,
        "orphan_blocks": orphan_blocks,
        "collided_section_ids": sorted([k for k, v in collisions.items() if v > 1]),
    }


def apply_schema(conn: sqlite3.Connection) -> None:
    with open(MIGRATION, encoding="utf-8") as handle:
        sql = handle.read()
    for statement in sql.split("--> statement-breakpoint"):
        statement = statement.strip()
        if statement:
            conn.execute(statement)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    source_root = find_source_root()
    db_path = authoritative_db()
    data = build_rows(source_root)

    print(json.dumps({
        "source_root": source_root,
        "db": os.path.basename(db_path),
        "declared": data["declared"],
        "parsed": {
            "parts": len(data["parts"]),
            "chapters": len(data["chapters"]),
            "section_records": len(data["sections"]),
            "section_uids": len({row["uid"] for row in data["sections"]}),
            "blocks": len(data["blocks"]),
        },
        "block_type_counts": data["block_type_counts"],
        "collided_section_ids": data["collided_section_ids"],
        "duplicate_block_ids": data["duplicate_block_ids"],
        "chapter_level_blocks": data["orphan_blocks"],
    }, ensure_ascii=False, indent=2))

    if not args.apply:
        print("\ndry run — pass --apply to write")
        return 0

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys=OFF")
        apply_schema(conn)
        for table in ("textbook_block", "textbook_section", "textbook_chapter", "textbook_part", "textbook_book"):
            conn.execute(f"DELETE FROM {table}")
        conn.execute(
            "INSERT OR REPLACE INTO textbook_book (book_id,title,edition,language,source_version,source_sha256,"
            "part_count,chapter_count,section_count,block_count,figure_count,table_count,generated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            data["book"],
        )
        conn.executemany(
            "INSERT INTO textbook_part (part_id,book_id,part_order,part_title,printed_page_start,pdf_page_start) VALUES (?,?,?,?,?,?)",
            data["parts"],
        )
        conn.executemany(
            "INSERT INTO textbook_chapter (chapter_id,book_id,part_id,chapter_order,chapter_number,chapter_title,"
            "start_page,end_page,printed_page_start,section_count,block_count,is_matter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            data["chapters"],
        )
        conn.executemany(
            "INSERT INTO textbook_section (section_uid,section_id,book_id,part_id,chapter_id,section_order,"
            "section_title,heading_level,start_page,end_page,printed_page_start,block_count,visible_block_count,text_chars) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                (
                    row["uid"], row["section_id"], BOOK_ID, row["part_id"], row["chapter_id"], row["order"],
                    row["title"], row["heading_level"], row["start_page"], row["end_page"],
                    row["printed_page_start"], row["blocks"], row["visible"], row["chars"],
                )
                for row in data["sections"]
            ],
        )
        conn.executemany(
            "INSERT INTO textbook_block (block_id,section_uid,section_id,chapter_id,block_order,block_type,text,"
            "heading_level,page,printed_page,figure_id,figure_caption,figure_asset,table_id,table_html,table_text,"
            "table_caption,manual_review_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            data["blocks"],
        )
        try:
            conn.execute(
                "INSERT OR REPLACE INTO d1_migrations (name, applied_at) VALUES (?, datetime('now'))",
                (MIGRATION_NAME,),
            )
        except sqlite3.OperationalError:
            pass
        conn.commit()
        conn.execute("ANALYZE")
        conn.commit()

        deployed = {
            "book": conn.execute("SELECT COUNT(*) FROM textbook_book").fetchone()[0],
            "parts": conn.execute("SELECT COUNT(*) FROM textbook_part").fetchone()[0],
            "chapters": conn.execute("SELECT COUNT(*) FROM textbook_chapter").fetchone()[0],
            "sections": conn.execute("SELECT COUNT(*) FROM textbook_section").fetchone()[0],
            "blocks": conn.execute("SELECT COUNT(*) FROM textbook_block").fetchone()[0],
            "fts_sections": conn.execute("SELECT COUNT(*) FROM textbook_section_index").fetchone()[0],
        }
        print("\nDEPLOYED: " + json.dumps(deployed, ensure_ascii=False))
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
