ALTER TABLE `questions` ADD `options_mode` text;
--> statement-breakpoint
ALTER TABLE `questions` ADD `provenance_json` text;
--> statement-breakpoint
ALTER TABLE `questions` ADD `current_answer` text;
--> statement-breakpoint
ALTER TABLE `questions` ADD `current_answer_status` text;
--> statement-breakpoint
ALTER TABLE `questions` ADD `current_evidence_json` text;
--> statement-breakpoint
ALTER TABLE `questions` ADD `currentness_risk` text;
--> statement-breakpoint
CREATE TABLE `canonical_records` (
  `record_id` text PRIMARY KEY NOT NULL,
  `source_file` text NOT NULL,
  `source_page` integer,
  `domain` text NOT NULL,
  `stem` text NOT NULL,
  `options_json` text,
  `source_answer` text,
  `source_explanation` text,
  `provenance_json` text NOT NULL,
  `visual_asset` text,
  `visual_url` text,
  `options_mode` text,
  `current_answer` text,
  `current_answer_status` text NOT NULL,
  `current_evidence_json` text NOT NULL,
  `currentness_risk` text NOT NULL,
  `record_json` text NOT NULL,
  `active_quiz` integer DEFAULT false NOT NULL,
  `import_version` text NOT NULL,
  `imported_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_canonical_active` ON `canonical_records` (`active_quiz`);
--> statement-breakpoint
CREATE INDEX `idx_canonical_status` ON `canonical_records` (`current_answer_status`);
