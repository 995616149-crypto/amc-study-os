-- FINAL DUAL-ANSWER RELEASE — append-only current-answer history.
--
-- This migration is strictly ADDITIVE and IDEMPOTENT.  It creates two new tables
-- and never touches `questions`, `canonical_records`, `attempts`, `review_state`,
-- `study_notes`, `practice_position` or any existing guidance table.
--
-- Contract enforced at the database level:
--   * `source_answer` / `source_explanation` are never written by this layer.
--   * A version row is immutable: a new current answer is a NEW row, and only the
--     `is_current` flag moves.
--   * A SHADOW_PROPOSAL (an unverified machine candidate) can never be current.
--   * status is limited to VERIFIED_SAME | VERIFIED_UPDATED | REVIEW_REQUIRED.
--   * REVIEW_REQUIRED never carries an option: it asserts no option-level update.

CREATE TABLE IF NOT EXISTS `current_answer_versions` (
	`version_id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`version_no` integer NOT NULL,
	`selected_option_semantic_id` text NOT NULL,
	`status` text NOT NULL,
	`verification_mode` text NOT NULL,
	`effective_date` text,
	`verified_at` text NOT NULL,
	`source_family` text,
	`source_title` text,
	`source_url` text,
	`source_snapshot_sha256` text,
	`evidence_refs` text NOT NULL,
	`reason_for_change` text,
	`previous_version_id` text,
	`is_current` integer DEFAULT 0 NOT NULL,
	`machine_status` text,
	`machine_answer` text,
	`created_at` text NOT NULL,
	CONSTRAINT `ck_cav_status` CHECK (`status` IN ('VERIFIED_SAME','VERIFIED_UPDATED','REVIEW_REQUIRED')),
	CONSTRAINT `ck_cav_mode` CHECK (`verification_mode` IN ('AUTO_DETERMINISTIC_VERIFIED','REVIEWED_VERIFIED','SHADOW_PROPOSAL')),
	CONSTRAINT `ck_cav_option` CHECK (`selected_option_semantic_id` IN ('A','B','C','D','E','NONE')),
	CONSTRAINT `ck_cav_review_has_no_option` CHECK (`status` <> 'REVIEW_REQUIRED' OR `selected_option_semantic_id` = 'NONE'),
	CONSTRAINT `ck_cav_shadow_never_current` CHECK (`verification_mode` <> 'SHADOW_PROPOSAL' OR `is_current` = 0),
	CONSTRAINT `ck_cav_shadow_is_review` CHECK (`verification_mode` <> 'SHADOW_PROPOSAL' OR `status` = 'REVIEW_REQUIRED'),
	CONSTRAINT `ck_cav_unverified_never_current` CHECK (`is_current` = 0 OR `verification_mode` IN ('AUTO_DETERMINISTIC_VERIFIED','REVIEWED_VERIFIED'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_cav_question_version` ON `current_answer_versions` (`question_id`,`version_no` DESC);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_cav_current` ON `current_answer_versions` (`question_id`) WHERE `is_current` = 1;
--> statement-breakpoint

-- Feature flags.  Reuses one tiny table instead of adding a second mechanism;
-- the kill switch for a surface is a row update, never a code change.
CREATE TABLE IF NOT EXISTS `feature_flags` (
	`flag` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`note` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `feature_flags` (`flag`,`enabled`,`note`,`updated_at`) VALUES
	('CURRENT_GUIDANCE_UI',1,'Dual-answer current guidance panel in the practice flow.','2026-10-02T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO `feature_flags` (`flag`,`enabled`,`note`,`updated_at`) VALUES
	('AI_COACH',1,'AI Coach / AI Tutor surface.','2026-10-02T00:00:00.000Z');
