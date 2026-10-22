CREATE TABLE `semantic_pass_a_calibration` (
  `request_id` text PRIMARY KEY NOT NULL,
  `record_id` text NOT NULL REFERENCES `canonical_records`(`record_id`),
  `classifier_version` text NOT NULL,
  `contract_version` text NOT NULL,
  `taxonomy_version` text NOT NULL,
  `input_hash` text NOT NULL,
  `model` text NOT NULL,
  `api_mode` text NOT NULL,
  `attempt_number` integer NOT NULL,
  `http_status` integer,
  `response_status` text,
  `incomplete_details_json` text,
  `usage_json` text,
  `raw_output_text` text,
  `parsed_model_json` text,
  `parse_status` text NOT NULL,
  `validation_status` text NOT NULL,
  `validation_errors_json` text NOT NULL,
  `pass_a_status` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_semantic_pass_a_record` ON `semantic_pass_a_calibration` (`record_id`,`classifier_version`,`input_hash`);
