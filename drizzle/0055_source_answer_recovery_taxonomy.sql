-- Mismatch taxonomy.  A conflict between two source documents must be recorded as
-- such and quarantined; it must never be confused with a pipeline extraction failure.
ALTER TABLE `source_answer_recovery` ADD `classification` text NOT NULL DEFAULT 'UNCLASSIFIED';
--> statement-breakpoint
ALTER TABLE `source_answer_recovery` ADD `conflict_type` text;
--> statement-breakpoint
ALTER TABLE `source_answer_recovery` ADD `canonical_answer_at_recovery` text;
--> statement-breakpoint
CREATE INDEX `idx_sar_classification` ON `source_answer_recovery` (`classification`);
