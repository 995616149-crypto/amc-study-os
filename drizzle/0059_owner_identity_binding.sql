-- Native WorkBuddy email login: identity binding + login-method switch.
--
-- Strictly ADDITIVE and IDEMPOTENT.  It adds no column to an existing table
-- (SQLite has no ADD COLUMN IF NOT EXISTS, and the migration verifier replays
-- these files), and it touches no learner data.
--
-- `owner_identity_bindings` is the deterministic, server-side binding between a
-- cloud-authenticated identity and the EXISTING owner profile.  The first
-- identity that signs in becomes the owner; any other identity is refused, so
-- one learner's history can never be reached by a second account.
--
-- `owner_login_settings.password_login_enabled` keeps the previous passcode path
-- available as a rollback channel until the email login acceptance has passed.

CREATE TABLE IF NOT EXISTS `owner_identity_bindings` (
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`email` text,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	PRIMARY KEY (`provider`, `provider_subject`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `owner_login_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`password_login_enabled` integer DEFAULT 1 NOT NULL,
	`expected_owner_email` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `owner_login_settings` (`id`, `password_login_enabled`, `expected_owner_email`, `updated_at`)
VALUES ('owner', 1, NULL, '2026-10-02T00:00:00.000Z');
