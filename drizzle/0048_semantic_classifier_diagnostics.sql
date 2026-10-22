ALTER TABLE `semantic_intent_candidates` ADD COLUMN `staging_status` text NOT NULL DEFAULT 'SUPERSEDED_CALIBRATION_V41';
--> statement-breakpoint
CREATE TABLE `semantic_intent_diagnostics` (
  `id` text PRIMARY KEY NOT NULL,
  `request_id` text NOT NULL,
  `record_id` text NOT NULL REFERENCES `canonical_records`(`record_id`),
  `model` text NOT NULL,
  `api_mode` text NOT NULL,
  `run_kind` text NOT NULL,
  `classifier_version` text NOT NULL,
  `attempt_number` integer NOT NULL,
  `http_status` integer,
  `response_status` text,
  `finish_reason` text,
  `incomplete_reason` text,
  `input_tokens` integer,
  `output_tokens` integer,
  `total_tokens` integer,
  `content_present` integer NOT NULL,
  `content_length` integer NOT NULL,
  `json_parse_status` text NOT NULL,
  `validation_status` text NOT NULL,
  `validation_error_codes_json` text NOT NULL,
  `unexpected_fields_json` text NOT NULL,
  `missing_fields_json` text NOT NULL,
  `invalid_enum_fields_json` text NOT NULL,
  `type_mismatch_fields_json` text NOT NULL,
  `staging_write_status` text NOT NULL,
  `duration_ms` integer NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_semantic_diagnostic_record` ON `semantic_intent_diagnostics` (`record_id`,`classifier_version`,`api_mode`,`run_kind`);
