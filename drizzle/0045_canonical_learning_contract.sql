CREATE TABLE `canonical_chapters` (
  `id` text PRIMARY KEY NOT NULL,
  `specialty` text NOT NULL,
  `domain` text NOT NULL,
  `title` text NOT NULL,
  `chapter_type` text NOT NULL,
  `status` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `canonical_sections` (
  `id` text PRIMARY KEY NOT NULL,
  `chapter_id` text NOT NULL REFERENCES `canonical_chapters`(`id`),
  `title` text NOT NULL,
  `section_type` text NOT NULL,
  `sort_order` integer NOT NULL,
  UNIQUE(`chapter_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `canonical_subtopics` (
  `id` text PRIMARY KEY NOT NULL,
  `section_id` text NOT NULL REFERENCES `canonical_sections`(`id`),
  `title` text NOT NULL,
  `sort_order` integer NOT NULL,
  UNIQUE(`section_id`,`id`)
);
--> statement-breakpoint
CREATE TABLE `canonical_question_learning_map` (
  `record_id` text PRIMARY KEY NOT NULL REFERENCES `canonical_records`(`record_id`),
  `primary_chapter_id` text REFERENCES `canonical_chapters`(`id`),
  `primary_section_id` text REFERENCES `canonical_sections`(`id`),
  `primary_subtopic_id` text REFERENCES `canonical_subtopics`(`id`),
  `mapping_status` text NOT NULL CHECK (`mapping_status` IN ('CONFIRMED','HIGH_CONFIDENCE','REVIEW_REQUIRED','UNRESOLVED')),
  `mapping_confidence` text NOT NULL CHECK (`mapping_confidence` IN ('HIGH','LOW','NONE')),
  `mapping_method` text NOT NULL,
  `mapping_provenance` text NOT NULL,
  `source_node_id` text,
  `candidate_chapters_json` text NOT NULL DEFAULT '[]',
  `candidate_section` text,
  `candidate_subtopic` text,
  `review_tier` text,
  `review_reason` text,
  `reviewed_by` text,
  `reviewed_at` text,
  `updated_at` text NOT NULL,
  CHECK (`primary_section_id` IS NULL OR `primary_chapter_id` IS NOT NULL),
  CHECK (`primary_subtopic_id` IS NULL OR `primary_section_id` IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `idx_canonical_learning_chapter` ON `canonical_question_learning_map` (`primary_chapter_id`,`primary_section_id`);
--> statement-breakpoint
CREATE INDEX `idx_canonical_learning_review` ON `canonical_question_learning_map` (`mapping_status`,`review_tier`);
--> statement-breakpoint
CREATE TABLE `canonical_learning_candidates` (
  `record_id` text NOT NULL REFERENCES `canonical_records`(`record_id`),
  `node_id` text NOT NULL,
  `relation_type` text NOT NULL CHECK (`relation_type` IN ('PRIMARY','SECONDARY')),
  `mapping_method` text NOT NULL,
  `mapping_confidence` text NOT NULL,
  `provenance` text NOT NULL,
  PRIMARY KEY (`record_id`,`node_id`,`relation_type`)
);
--> statement-breakpoint
CREATE INDEX `idx_canonical_candidates_node` ON `canonical_learning_candidates` (`node_id`);
