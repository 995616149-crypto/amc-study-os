-- Emidici (Emedici 2026) becomes an independent, fully traceable question
-- source.  Nothing in this migration rewrites an existing record: the v2.9.4
-- corpus keeps its own rows, and every provenance column added here stays NULL
-- for it.

ALTER TABLE `canonical_records` ADD COLUMN `source_provider` text;
--> statement-breakpoint
ALTER TABLE `canonical_records` ADD COLUMN `source_question_id` text;
--> statement-breakpoint
ALTER TABLE `canonical_records` ADD COLUMN `source_location` text;
--> statement-breakpoint
CREATE INDEX `idx_canonical_provider` ON `canonical_records` (`source_provider`);
--> statement-breakpoint
ALTER TABLE `questions` ADD COLUMN `source_provider` text;
--> statement-breakpoint
CREATE INDEX `idx_questions_provider` ON `questions` (`source_provider`);
--> statement-breakpoint

-- Per-source resume.  The cursor is keyed by (user, practice scope), so the
-- Emidici position can never overwrite the original bank position.
CREATE TABLE `practice_position_scoped` (
	`user_id` text NOT NULL,
	`practice_scope` text NOT NULL,
	`question_id` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY (`user_id`, `practice_scope`)
);
--> statement-breakpoint
INSERT OR REPLACE INTO `practice_position_scoped` (`user_id`,`practice_scope`,`question_id`,`updated_at`)
	SELECT `user_id`,`practice_scope`,`question_id`,`updated_at` FROM `practice_position`;
--> statement-breakpoint
DROP TABLE `practice_position`;
--> statement-breakpoint
ALTER TABLE `practice_position_scoped` RENAME TO `practice_position`;
--> statement-breakpoint
CREATE INDEX `idx_practice_position_updated` ON `practice_position` (`updated_at`);
--> statement-breakpoint

-- Duplicate MARKING only.  A marked duplicate is never deleted, never merged and
-- never hidden from the learner; the mark just explains the relationship and
-- keeps the two versions separately selectable.
CREATE TABLE `emidici_duplicate_mark` (
	`emidici_record_id` text PRIMARY KEY NOT NULL,
	`source_provider` text NOT NULL,
	`source_question_id` text NOT NULL,
	`duplicate_kind` text NOT NULL,
	`counterpart_record_id` text,
	`counterpart_provider` text,
	`similarity` real,
	`evidence_json` text NOT NULL,
	`marked_at` text NOT NULL,
	`mark_version` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_emidici_dup_kind` ON `emidici_duplicate_mark` (`duplicate_kind`);
--> statement-breakpoint
CREATE INDEX `idx_emidici_dup_counterpart` ON `emidici_duplicate_mark` (`counterpart_record_id`);
