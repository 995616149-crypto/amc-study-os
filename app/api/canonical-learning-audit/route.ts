import { db, currentUser} from "../_shared";
import { LEAKED_ANSWER_IN_OPTIONS_IDS, MISSING_REQUIRED_SOURCE_VISUAL_IDS, practiceExclusionStatus } from "@/lib/visual-integrity";

// Summary only. Medical candidates and personal learning records are not
// exposed by this audit endpoint, and it never writes to the database.
export async function GET(request: Request) {
  if (!await currentUser(request)) return Response.json({ error: "Sign in with ChatGPT is required." }, { status: 401 });
  try {
    const database = db();
    const [counts, statuses, tiers, invalid, protectedRows] = await Promise.all([
      database.prepare(`SELECT
        (SELECT count(*) FROM canonical_records) AS canonical,
        (SELECT count(*) FROM questions q JOIN canonical_records c ON c.record_id=q.id) AS imported_questions,
        (SELECT count(*) FROM canonical_records c LEFT JOIN questions q ON q.id=c.record_id WHERE q.id IS NULL) AS canonical_only,
        (SELECT count(*) FROM canonical_question_learning_map) AS learning_rows,
        (SELECT count(*) FROM canonical_question_learning_map WHERE primary_chapter_id IS NOT NULL) AS chapter_assigned,
        (SELECT count(*) FROM canonical_question_learning_map WHERE primary_section_id IS NOT NULL) AS section_assigned,
        (SELECT count(*) FROM canonical_question_learning_map WHERE primary_subtopic_id IS NOT NULL) AS subtopic_assigned,
        (SELECT count(*) FROM canonical_learning_candidates WHERE relation_type='SECONDARY') AS secondary_candidates,
        (SELECT count(*) FROM canonical_chapters) AS canonical_chapters`).first(),
      database.prepare(`SELECT mapping_status,count(*) AS count FROM canonical_question_learning_map GROUP BY mapping_status`).all(),
      database.prepare(`SELECT review_tier,count(*) AS count FROM canonical_question_learning_map GROUP BY review_tier`).all(),
      database.prepare(`SELECT count(*) AS count FROM canonical_question_learning_map m
        LEFT JOIN canonical_records c ON c.record_id=m.record_id
        LEFT JOIN canonical_chapters ch ON ch.id=m.primary_chapter_id
        LEFT JOIN canonical_sections s ON s.id=m.primary_section_id
        LEFT JOIN canonical_subtopics st ON st.id=m.primary_subtopic_id
        WHERE c.record_id IS NULL OR (m.primary_chapter_id IS NOT NULL AND ch.id IS NULL)
          OR (m.primary_section_id IS NOT NULL AND (s.id IS NULL OR s.chapter_id<>m.primary_chapter_id))
          OR (m.primary_subtopic_id IS NOT NULL AND (st.id IS NULL OR st.section_id<>m.primary_section_id))`).first<{count:number}>(),
      database.prepare(`SELECT record_id FROM canonical_question_learning_map WHERE record_id IN (${[...new Set([...MISSING_REQUIRED_SOURCE_VISUAL_IDS, ...LEAKED_ANSWER_IN_OPTIONS_IDS])].map(() => "?").join(",")})`).bind(...new Set([...MISSING_REQUIRED_SOURCE_VISUAL_IDS, ...LEAKED_ANSWER_IN_OPTIONS_IDS])).all<{record_id:string}>(),
    ]);
    return Response.json({ counts, statuses: statuses.results, tiers: tiers.results, invalid_references: invalid?.count ?? -1,
      protected_learning_rows: protectedRows.results.length,
      protected_without_practice_guard: protectedRows.results.filter((row) => !practiceExclusionStatus(row.record_id)).length,
      // The answerable bootstrap and attempt endpoint retain their independent exclusion gates.
      version: "phase-b0-v1" });
  } catch {
    return Response.json({ error: "Canonical learning audit temporarily unavailable." }, { status: 503 });
  }
}
