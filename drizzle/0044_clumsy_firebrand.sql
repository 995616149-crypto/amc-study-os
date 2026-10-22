CREATE TABLE `data_hygiene_migrations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`applied_at` text NOT NULL,
	`details_json` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_data_hygiene_user_id` ON `data_hygiene_migrations` (`user_id`,`id`);--> statement-breakpoint
CREATE TABLE `study_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scope_key` text NOT NULL,
	`note_type` text NOT NULL,
	`question_id` text,
	`chapter_id` text,
	`section_id` text,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_study_notes_user_scope` ON `study_notes` (`user_id`,`scope_key`);--> statement-breakpoint
CREATE INDEX `idx_study_notes_user_updated` ON `study_notes` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `translation_cache` (
	`cache_key` text PRIMARY KEY NOT NULL,
	`content_hash` text NOT NULL,
	`source_language` text NOT NULL,
	`target_language` text NOT NULL,
	`content_kind` text NOT NULL,
	`source_json` text NOT NULL,
	`translation_json` text NOT NULL,
	`provider` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_translation_content_languages` ON `translation_cache` (`content_hash`,`source_language`,`target_language`);