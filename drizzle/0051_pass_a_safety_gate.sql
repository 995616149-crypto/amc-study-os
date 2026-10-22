ALTER TABLE `semantic_pass_a_calibration` ADD `safety_gate_result_json` text;
--> statement-breakpoint
ALTER TABLE `semantic_pass_a_calibration` ADD `model_semantic_status` text NOT NULL DEFAULT 'PENDING_MEDICAL_REVIEW';
--> statement-breakpoint
ALTER TABLE `semantic_pass_a_calibration` ADD `gate_decision` text NOT NULL DEFAULT 'PENDING';
--> statement-breakpoint
ALTER TABLE `semantic_pass_a_calibration` ADD `downstream_evidence_status` text NOT NULL DEFAULT 'PENDING';
--> statement-breakpoint
ALTER TABLE `semantic_pass_a_calibration` ADD `stability_set_hash` text;
