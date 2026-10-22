-- Covering indexes for the two queries that dominate the critical bootstrap.
--
-- Profiled on the real database: of ~2.19 s total query time, `bankStats` was 1 678 ms
-- and the question index 467 ms; every other critical query was under 10 ms.
--
--   EXPLAIN QUERY PLAN <bankStats>        -> SCAN canonical_records
--   EXPLAIN QUERY PLAN <questions index>  -> SCAN questions USING INDEX
--                                            idx_questions_domain_topic
--                                            + USE TEMP B-TREE FOR LAST TERM OF ORDER BY
--
-- Both are wide tables, so a scan (or an index scan that still visits the table) reads
-- far more pages than the handful of small columns the aggregates and the list actually
-- need.  These two indexes are covering, so SQLite answers both from the index alone.
-- Justified by EXPLAIN, not by guesswork; deliberately only two.
CREATE INDEX IF NOT EXISTS `idx_canonical_practice_stats`
  ON `canonical_records` (`import_version`,`active_quiz`,`visual_asset`,`options_mode`,`current_answer_status`);
CREATE INDEX IF NOT EXISTS `idx_questions_bootstrap_index`
  ON `questions` (`active`,`domain`,`topic`,`id`,`clinical_task`,`answer_key`,`source_provider`);
