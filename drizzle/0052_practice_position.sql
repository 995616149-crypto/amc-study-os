CREATE TABLE `practice_position` (
	`user_id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`practice_scope` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_practice_position_updated` ON `practice_position` (`updated_at`);
