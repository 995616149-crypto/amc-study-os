CREATE TABLE `knowledge_chapters` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `condition` text NOT NULL,
  `system` text NOT NULL,
  `sections_json` text NOT NULL,
  `version` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `question_concept_map` (
  `question_id` text PRIMARY KEY NOT NULL,
  `chapter_id` text NOT NULL,
  `section_id` text NOT NULL,
  `tested_concept_id` text NOT NULL,
  `tested_concept_label` text NOT NULL,
  `clinical_task` text NOT NULL,
  `error_domain` text NOT NULL,
  `mapping_version` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`chapter_id`) REFERENCES `knowledge_chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_question_concept_chapter_section` ON `question_concept_map` (`chapter_id`,`section_id`);
--> statement-breakpoint
CREATE INDEX `idx_question_concept_tested` ON `question_concept_map` (`tested_concept_id`);
--> statement-breakpoint
CREATE TABLE `concept_fsrs_state` (
  `user_id` text NOT NULL,
  `tested_concept_id` text NOT NULL,
  `chapter_id` text NOT NULL,
  `section_id` text NOT NULL,
  `due_at` text NOT NULL,
  `stability` real NOT NULL,
  `difficulty` real NOT NULL,
  `last_reviewed_at` text NOT NULL,
  `scheduled_days` real NOT NULL,
  `reps` integer NOT NULL,
  `lapses` integer NOT NULL,
  `state` text NOT NULL,
  `last_rating` integer NOT NULL,
  `priority` real NOT NULL,
  PRIMARY KEY(`user_id`, `tested_concept_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`chapter_id`) REFERENCES `knowledge_chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_concept_fsrs_due` ON `concept_fsrs_state` (`user_id`,`due_at`);
--> statement-breakpoint
CREATE INDEX `idx_concept_fsrs_chapter_section` ON `concept_fsrs_state` (`chapter_id`,`section_id`);
--> statement-breakpoint
CREATE TABLE `vocabulary_lookup_cache` (
  `cache_key` text PRIMARY KEY NOT NULL,
  `normalized_surface` text NOT NULL,
  `lemma` text NOT NULL,
  `context_hash` text NOT NULL,
  `result_json` text NOT NULL,
  `provider` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_vocabulary_lookup_lemma` ON `vocabulary_lookup_cache` (`lemma`);
--> statement-breakpoint
ALTER TABLE `attempts` ADD `chapter_id` text;
--> statement-breakpoint
ALTER TABLE `attempts` ADD `section_id` text;
--> statement-breakpoint
ALTER TABLE `attempts` ADD `tested_concept_id` text;
--> statement-breakpoint
ALTER TABLE `attempts` ADD `error_domain` text;
