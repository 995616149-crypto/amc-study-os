CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`selected_answer` text NOT NULL,
	`correct` integer NOT NULL,
	`confidence` text NOT NULL,
	`elapsed_ms` integer NOT NULL,
	`attempted_at` text NOT NULL,
	`session_id` text NOT NULL,
	`error_type` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_user_time` ON `attempts` (`user_id`,`attempted_at`);--> statement-breakpoint
CREATE INDEX `idx_attempts_user_question` ON `attempts` (`user_id`,`question_id`);--> statement-breakpoint
CREATE TABLE `coach_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`created_at` text NOT NULL,
	`evidence_status` text NOT NULL,
	`source_comparison_status` text NOT NULL,
	`result_json` text NOT NULL,
	`source_list_json` text NOT NULL,
	`searched_at` text,
	`cache_key` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_coach_question_cache` ON `coach_runs` (`question_id`,`cache_key`);--> statement-breakpoint
CREATE TABLE `daily_stats` (
	`user_id` text NOT NULL,
	`period_start` text NOT NULL,
	`metrics_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `period_start`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_name` text NOT NULL,
	`domain` text NOT NULL,
	`system` text NOT NULL,
	`condition` text NOT NULL,
	`clinical_task` text NOT NULL,
	`parent_node_id` text,
	`current_summary` text,
	`current_guideline_verified_at` text
);
--> statement-breakpoint
CREATE TABLE `monthly_stats` (
	`user_id` text NOT NULL,
	`period_start` text NOT NULL,
	`metrics_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `period_start`)
);
--> statement-breakpoint
CREATE TABLE `node_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`node_id` text NOT NULL,
	`question_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`evidence_score` real NOT NULL,
	`evidence_type` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`node_id`) REFERENCES `knowledge_nodes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_node_evidence_user_node` ON `node_evidence` (`user_id`,`node_id`);--> statement-breakpoint
CREATE TABLE `question_node_links` (
	`question_id` text NOT NULL,
	`node_id` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`relation_type` text NOT NULL,
	PRIMARY KEY(`question_id`, `node_id`),
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`node_id`) REFERENCES `knowledge_nodes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `question_options` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`option_key` text NOT NULL,
	`text_en` text NOT NULL,
	`text_zh` text,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_question_options_unique` ON `question_options` (`question_id`,`option_key`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`source_question_no` text,
	`source_page` integer,
	`domain` text NOT NULL,
	`system` text NOT NULL,
	`topic` text NOT NULL,
	`clinical_task` text NOT NULL,
	`stem_en` text NOT NULL,
	`stem_zh` text,
	`answer_key` text NOT NULL,
	`source_explanation_en` text NOT NULL,
	`source_explanation_zh` text,
	`memory_rule_en` text NOT NULL,
	`memory_rule_zh` text,
	`image_ref` text,
	`source_year` integer,
	`import_version` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_questions_domain_topic` ON `questions` (`domain`,`topic`);--> statement-breakpoint
CREATE TABLE `review_state` (
	`user_id` text NOT NULL,
	`node_id` text NOT NULL,
	`due_at` text NOT NULL,
	`stability` real,
	`difficulty` real,
	`interval_days` integer NOT NULL,
	`last_reviewed_at` text,
	`lapse_count` integer DEFAULT 0 NOT NULL,
	`priority` real DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `node_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`node_id`) REFERENCES `knowledge_nodes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_review_due` ON `review_state` (`user_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `source_manifest` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text,
	`drive_locator` text,
	`filename` text NOT NULL,
	`byte_size` integer,
	`specialty` text,
	`duplicate_group` text,
	`priority_tier` text,
	`metadata_json` text,
	`imported_at` text,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_type` text NOT NULL,
	`source_year` integer,
	`drive_locator` text,
	`copyright_scope` text NOT NULL,
	`import_status` text NOT NULL,
	`current_guideline_status` text NOT NULL,
	`metadata_json` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_key` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_identity_key_unique` ON `users` (`identity_key`);--> statement-breakpoint
CREATE TABLE `vocabulary` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lemma` text NOT NULL,
	`surface_form` text NOT NULL,
	`part_of_speech` text,
	`translation_zh` text NOT NULL,
	`contextual_meaning_zh` text,
	`morphology_zh` text,
	`etymology_zh` text,
	`mnemonic_zh` text,
	`source_question_id` text,
	`source_context` text,
	`created_at` text NOT NULL,
	`last_reviewed_at` text,
	`due_at` text NOT NULL,
	`status` text DEFAULT 'learning' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vocabulary_user_lemma` ON `vocabulary` (`user_id`,`lemma`);--> statement-breakpoint
CREATE INDEX `idx_vocabulary_due` ON `vocabulary` (`user_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `weekly_stats` (
	`user_id` text NOT NULL,
	`period_start` text NOT NULL,
	`metrics_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `period_start`)
);
