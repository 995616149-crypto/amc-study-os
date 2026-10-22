-- Independent recovery layer for source-era answers recovered from the original
-- answer exports.  `canonical_records.source_answer` / `.source_explanation` stay
-- immutable: nothing here ever writes back to them.
CREATE TABLE `source_answer_recovery` (
	`record_id` text PRIMARY KEY NOT NULL,
	`recovered_answer` text,
	`recovered_explanation` text,
	`source_pdf` text,
	`source_pdf_sha256` text,
	`source_page` integer,
	`source_page_index` integer,
	`ocr_engine` text NOT NULL,
	`ocr_version` text NOT NULL,
	`ocr_confidence` real,
	`answer_pattern` text,
	`question_fingerprint` text,
	`match_method` text NOT NULL,
	`candidate_match_count` integer NOT NULL,
	`status` text NOT NULL,
	`review_reason` text,
	`evidence_json` text,
	`created_at` text NOT NULL,
	`recovery_version` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sar_status` ON `source_answer_recovery` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_sar_pdf_page` ON `source_answer_recovery` (`source_pdf`,`source_page`);
