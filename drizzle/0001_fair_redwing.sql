CREATE TABLE `explanation_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`explanation_type` text NOT NULL,
	`content_hash` text NOT NULL,
	`source_content` text NOT NULL,
	`translation_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_explanation_translation_cache` ON `explanation_translations` (`question_id`,`explanation_type`,`content_hash`);