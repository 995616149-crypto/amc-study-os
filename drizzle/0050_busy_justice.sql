ALTER TABLE `semantic_pass_a_calibration` ADD `normalized_model_json` text;
--> statement-breakpoint
ALTER TABLE `semantic_pass_a_calibration` ADD `normalization_changes_json` text;
--> statement-breakpoint
ALTER TABLE `semantic_pass_a_calibration` ADD `schema_status` text NOT NULL DEFAULT 'PENDING';
--> statement-breakpoint
ALTER TABLE `semantic_pass_a_calibration` ADD `validator_status` text NOT NULL DEFAULT 'PENDING';
--> statement-breakpoint
ALTER TABLE `semantic_pass_a_calibration` ADD `pass_a_review_status` text NOT NULL DEFAULT 'PENDING_REVIEW';
