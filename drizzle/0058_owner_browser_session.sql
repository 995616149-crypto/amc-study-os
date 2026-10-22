-- Browser-usable owner session.
--
-- The deployed app is reached from an ordinary browser, which never receives the
-- platform-injected `oai-authenticated-user-*` identity headers.  Until now the
-- only accepted identity was those headers, so a real browser got 401 and the
-- page sat on its skeleton forever.
--
-- This migration adds the minimum a single-owner site needs: one credential row
-- (a passcode hash, never the passcode) and a server-side session table.  It is
-- strictly ADDITIVE and IDEMPOTENT and touches no learner data.
--
-- `owner_credentials.owner_user_id` is the deterministic mapping target: the
-- existing owner profile that already holds the attempt / progress history.  It
-- is seeded by tools/release/setup_owner_access.mjs, which reads the database and
-- picks the profile with a real history rather than inventing a new one.

CREATE TABLE IF NOT EXISTS `owner_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`passcode_hash` text NOT NULL,
	`passcode_salt` text NOT NULL,
	`iterations` integer NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `owner_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`user_agent` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_owner_sessions_expiry` ON `owner_sessions` (`expires_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_owner_sessions_user` ON `owner_sessions` (`user_id`);
