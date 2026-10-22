CREATE TABLE IF NOT EXISTS `guidance_evidence_cache` (
  `question_id` text PRIMARY KEY NOT NULL,
  `node_id` text,
  `subtopic` text,
  `status` text NOT NULL,
  `current_answer` text,
  `recommendation` text,
  `what_changed` text,
  `sources_json` text NOT NULL,
  `verified_at` text,
  `stale_after` text,
  `provider` text,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `guidance_verification_history` (
  `id` text PRIMARY KEY NOT NULL,
  `question_id` text NOT NULL,
  `node_id` text,
  `subtopic` text,
  `outcome` text NOT NULL,
  `provider` text,
  `sources_json` text NOT NULL,
  `checked_at` text NOT NULL,
  `error_code` text,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_guidance_history_question_checked` ON `guidance_verification_history` (`question_id`,`checked_at`);
