-- Full structured Murtagh 9e textbook, readable from the deployment.
--
-- Why this migration exists
-- -------------------------
-- 0061 added `textbook_section_index` + `textbook_section_fts`.  That is a SEARCH
-- index, not the book: it stores one aggregated row per section, and the builder
-- caps the stored text (MAX 6 000 chars, MIN 40 chars), so only 7 844 of the
-- 8 420 sections are in it and long sections are truncated.  It answers
-- "which section is this question about", nothing more.
--
-- This migration adds the READABLE layer: the real book structure
-- (book > part > chapter > section) plus every assembled block, so the site can
-- render a section from its first block to its last, and can show the whole book
-- as a browsable textbook.  Nothing is re-OCR'd, re-parsed or rewritten: the rows
-- come from the assembler's own artefacts (8420 section records / 35 521 blocks).
--
-- 0061 is deliberately left untouched and unrebuilt: question -> section retrieval
-- keeps using the index that was already validated.
--
-- `section_uid` is the row identity, not a new concept.  It equals `section_id`
-- except for nine back-matter records where the assembler gave the Appendices and
-- the Index chapter the same `BM:0NN` id; for those the uid is
-- `section_id@chapter_id` so all 8 420 records stay addressable and no row is
-- silently merged away.
--
-- Strictly ADDITIVE and IDEMPOTENT; no learner data is touched.

CREATE TABLE IF NOT EXISTS `textbook_book` (
	`book_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`edition` text,
	`language` text,
	`source_version` text,
	`source_sha256` text,
	`part_count` integer NOT NULL DEFAULT 0,
	`chapter_count` integer NOT NULL DEFAULT 0,
	`section_count` integer NOT NULL DEFAULT 0,
	`block_count` integer NOT NULL DEFAULT 0,
	`figure_count` integer NOT NULL DEFAULT 0,
	`table_count` integer NOT NULL DEFAULT 0,
	`generated_at` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `textbook_part` (
	`part_id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`part_order` integer NOT NULL,
	`part_title` text NOT NULL,
	`printed_page_start` integer,
	`pdf_page_start` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `textbook_chapter` (
	`chapter_id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`part_id` text,
	`chapter_order` integer NOT NULL,
	`chapter_number` integer,
	`chapter_title` text NOT NULL,
	`start_page` integer,
	`end_page` integer,
	`printed_page_start` integer,
	`section_count` integer NOT NULL DEFAULT 0,
	`block_count` integer NOT NULL DEFAULT 0,
	`is_matter` integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `textbook_section` (
	`section_uid` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`book_id` text NOT NULL,
	`part_id` text,
	`chapter_id` text NOT NULL,
	`section_order` integer NOT NULL,
	`section_title` text NOT NULL,
	`heading_level` integer,
	`start_page` integer,
	`end_page` integer,
	`printed_page_start` integer,
	`block_count` integer NOT NULL DEFAULT 0,
	`visible_block_count` integer NOT NULL DEFAULT 0,
	`text_chars` integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `textbook_block` (
	`block_id` text PRIMARY KEY NOT NULL,
	`section_uid` text NOT NULL,
	`section_id` text,
	`chapter_id` text NOT NULL,
	`block_order` integer NOT NULL,
	`block_type` text NOT NULL,
	`text` text NOT NULL DEFAULT '',
	`heading_level` integer,
	`page` integer,
	`printed_page` integer,
	`figure_id` text,
	`figure_caption` text,
	`figure_asset` text,
	`table_id` text,
	`table_html` text,
	`table_text` text,
	`table_caption` text,
	`manual_review_status` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_section_chapter` ON `textbook_section` (`chapter_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_section_part` ON `textbook_section` (`part_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_section_sid` ON `textbook_section` (`section_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_section_order` ON `textbook_section` (`chapter_id`, `section_order`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_block_section` ON `textbook_block` (`section_uid`, `block_order`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_block_sid` ON `textbook_block` (`section_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_block_chapter` ON `textbook_block` (`chapter_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_textbook_chapter_part` ON `textbook_chapter` (`part_id`, `chapter_order`);
