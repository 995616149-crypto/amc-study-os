-- Promotion is an explicit, separate act from recovery.  A CONFIRMED recovery only
-- becomes practiceable once the known-answer calibration gate has passed and the row
-- has been promoted; until then the evidence is recorded but nothing is unlocked.
ALTER TABLE `source_answer_recovery` ADD `promoted` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `source_answer_recovery` ADD `promoted_at` text;
--> statement-breakpoint
CREATE INDEX `idx_sar_promoted` ON `source_answer_recovery` (`promoted`,`status`);
