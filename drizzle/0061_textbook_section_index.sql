-- Deployable Murtagh 9e section index (runtime textbook location).
--
-- The assembler's own index lives in a local SQLite file that the Worker runtime
-- cannot read (and that no longer ships with the deployment).  This migration adds
-- the searchable index INSIDE the deployed database instead, so a question can be
-- located to a real textbook section without any filesystem access.
--
-- One searchable record == one textbook SECTION (blocks are aggregated per section,
-- which keeps the index small, the results stable and the page citation clear).
--
-- Strictly ADDITIVE and IDEMPOTENT; no learner data is touched.

CREATE TABLE IF NOT EXISTS `textbook_section_index` (
	`rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` text NOT NULL UNIQUE,
	`stable_source_id` text NOT NULL,
	`part_title` text,
	`chapter_id` text,
	`chapter_title` text,
	`section_title` text,
	`page_start` integer,
	`page_end` integer,
	`printed_page_start` integer,
	`block_count` integer NOT NULL DEFAULT 0,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_section_chapter` ON `textbook_section_index` (`chapter_id`);
--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS `textbook_section_fts` USING fts5(
	chapter_title,
	section_title,
	text,
	section_id UNINDEXED,
	content='textbook_section_index',
	content_rowid='rowid',
	tokenize='porter unicode61'
);
--> statement-breakpoint
-- Reviewed, human-approved question -> section links. These always outrank a
-- runtime retrieval result.
CREATE TABLE IF NOT EXISTS `question_textbook_link` (
	`question_id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`method` text NOT NULL,
	`score` real,
	`confidence` real,
	`retrieval_version` text NOT NULL,
	`rationale` text,
	`created_at` text NOT NULL,
	`verified_at` text NOT NULL
);
