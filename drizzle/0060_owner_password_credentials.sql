-- Local username + password for the single owner.
--
-- The site is a private single-user study tool.  Third-party identity (WorkBuddy
-- Cloud Auth, email OTP, WeChat) is no longer part of the normal login chain; the
-- owner signs in with a local username and password.
--
-- Strictly ADDITIVE and IDEMPOTENT.  No learner data is touched, and the older
-- auth tables are left in place (disabled, not dropped) so rollback stays possible.

CREATE TABLE IF NOT EXISTS `owner_password_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`algorithm` text NOT NULL,
	`params` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_owner_password_username` ON `owner_password_credentials` (`username`);
