CREATE TABLE IF NOT EXISTS `guidance_source_metadata` (
  `canonical_url` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `issuing_body` text NOT NULL,
  `authority_tier` integer NOT NULL,
  `specialty_json` text NOT NULL,
  `keywords` text NOT NULL,
  `last_seen_at` text NOT NULL,
  `last_modified` text,
  `source_type` text NOT NULL,
  `node_id` text,
  `subtopic` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_guidance_source_node_subtopic_seen` ON `guidance_source_metadata` (`node_id`,`subtopic`,`last_seen_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `guidance_node_evidence_cache` (
  `node_id` text NOT NULL,
  `scenario_key` text NOT NULL,
  `subtopic` text,
  `status` text NOT NULL,
  `current_answer` text,
  `recommendation` text,
  `what_changed` text,
  `sources_json` text NOT NULL,
  `verified_at` text NOT NULL,
  `stale_after` text NOT NULL,
  `source_question_id` text NOT NULL,
  `provider` text NOT NULL,
  PRIMARY KEY (`node_id`,`scenario_key`),
  FOREIGN KEY (`source_question_id`) REFERENCES `questions`(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_guidance_node_evidence_fresh` ON `guidance_node_evidence_cache` (`node_id`,`scenario_key`,`stale_after`);
--> statement-breakpoint
PRAGMA optimize;
