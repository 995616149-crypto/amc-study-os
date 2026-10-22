CREATE TABLE `semantic_intent_candidates` (
  `record_id` text NOT NULL REFERENCES `canonical_records`(`record_id`),
  `input_hash` text NOT NULL,
  `classifier_version` text NOT NULL,
  `taxonomy_version` text NOT NULL,
  `result_json` text NOT NULL,
  `model` text NOT NULL,
  `created_at` text NOT NULL,
  PRIMARY KEY (`record_id`,`input_hash`,`classifier_version`,`taxonomy_version`)
);
--> statement-breakpoint
CREATE INDEX `idx_semantic_intent_taxonomy` ON `semantic_intent_candidates` (`taxonomy_version`,`classifier_version`);
