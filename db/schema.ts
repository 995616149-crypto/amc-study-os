import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), identityKey: text("identity_key").notNull().unique(), email: text("email").notNull(),
  displayName: text("display_name"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(), name: text("name").notNull(), sourceType: text("source_type").notNull(), sourceYear: integer("source_year"),
  driveLocator: text("drive_locator"), copyrightScope: text("copyright_scope").notNull(), importStatus: text("import_status").notNull(),
  currentGuidelineStatus: text("current_guideline_status").notNull(), metadataJson: text("metadata_json"),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(), sourceId: text("source_id").notNull().references(() => sources.id), sourceQuestionNo: text("source_question_no"),
  sourcePage: integer("source_page"), domain: text("domain").notNull(), system: text("system").notNull(), topic: text("topic").notNull(),
  clinicalTask: text("clinical_task").notNull(), stemEn: text("stem_en").notNull(), stemZh: text("stem_zh"), answerKey: text("answer_key").notNull(),
  sourceExplanationEn: text("source_explanation_en").notNull(), sourceExplanationZh: text("source_explanation_zh"),
  memoryRuleEn: text("memory_rule_en").notNull(), memoryRuleZh: text("memory_rule_zh"), imageRef: text("image_ref"),
  sourceYear: integer("source_year"), importVersion: text("import_version").notNull(), active: integer("active", { mode: "boolean" }).notNull().default(true),
  optionsMode: text("options_mode"), provenanceJson: text("provenance_json"),
  currentAnswer: text("current_answer"), currentAnswerStatus: text("current_answer_status"),
  currentEvidenceJson: text("current_evidence_json"), currentnessRisk: text("currentness_risk"),
  sourceProvider: text("source_provider"),
}, (t) => [index("idx_questions_domain_topic").on(t.domain, t.topic), index("idx_questions_provider").on(t.sourceProvider)]);

export const canonicalRecords = sqliteTable("canonical_records", {
  recordId: text("record_id").primaryKey(), sourceFile: text("source_file").notNull(),
  sourcePage: integer("source_page"), domain: text("domain").notNull(), stem: text("stem").notNull(),
  optionsJson: text("options_json"), sourceAnswer: text("source_answer"), sourceExplanation: text("source_explanation"),
  provenanceJson: text("provenance_json").notNull(), visualAsset: text("visual_asset"), visualUrl: text("visual_url"),
  optionsMode: text("options_mode"), currentAnswer: text("current_answer"),
  currentAnswerStatus: text("current_answer_status").notNull(), currentEvidenceJson: text("current_evidence_json").notNull(),
  currentnessRisk: text("currentness_risk").notNull(), recordJson: text("record_json").notNull(),
  activeQuiz: integer("active_quiz", { mode: "boolean" }).notNull().default(false),
  importVersion: text("import_version").notNull(), importedAt: text("imported_at").notNull(),
  // Provenance of an added question source.  NULL for the frozen v2.9.4 corpus,
  // which keeps whatever provenance it already carried in provenanceJson.
  sourceProvider: text("source_provider"), sourceQuestionId: text("source_question_id"),
  sourceLocation: text("source_location"),
}, (t) => [index("idx_canonical_active").on(t.activeQuiz), index("idx_canonical_status").on(t.currentAnswerStatus), index("idx_canonical_provider").on(t.sourceProvider)]);

// Isolated B1 staging cache. Never used by practice, chapter grouping or user history.
export const semanticIntentCandidates = sqliteTable("semantic_intent_candidates", {
  recordId: text("record_id").notNull().references(() => canonicalRecords.recordId),
  inputHash: text("input_hash").notNull(), classifierVersion: text("classifier_version").notNull(),
  taxonomyVersion: text("taxonomy_version").notNull(), resultJson: text("result_json").notNull(),
  model: text("model").notNull(), createdAt: text("created_at").notNull(),
  stagingStatus: text("staging_status").notNull().default("SUPERSEDED_CALIBRATION_V41"),
}, (t) => [primaryKey({ columns: [t.recordId,t.inputHash,t.classifierVersion,t.taxonomyVersion] }), index("idx_semantic_intent_taxonomy").on(t.taxonomyVersion,t.classifierVersion)]);
export const semanticIntentDiagnostics = sqliteTable("semantic_intent_diagnostics", {
  id: text("id").primaryKey(), requestId: text("request_id").notNull(),
  recordId: text("record_id").notNull().references(() => canonicalRecords.recordId),
  model: text("model").notNull(), apiMode: text("api_mode").notNull(),
  runKind: text("run_kind").notNull(), classifierVersion: text("classifier_version").notNull(),
  attemptNumber: integer("attempt_number").notNull(), httpStatus: integer("http_status"),
  responseStatus: text("response_status"), finishReason: text("finish_reason"),
  incompleteReason: text("incomplete_reason"),
  inputTokens: integer("input_tokens"), outputTokens: integer("output_tokens"),
  totalTokens: integer("total_tokens"), contentPresent: integer("content_present").notNull(),
  contentLength: integer("content_length").notNull(),
  jsonParseStatus: text("json_parse_status").notNull(), validationStatus: text("validation_status").notNull(),
  validationErrorCodesJson: text("validation_error_codes_json").notNull(),
  unexpectedFieldsJson: text("unexpected_fields_json").notNull(),
  missingFieldsJson: text("missing_fields_json").notNull(),
  invalidEnumFieldsJson: text("invalid_enum_fields_json").notNull(),
  typeMismatchFieldsJson: text("type_mismatch_fields_json").notNull(),
  stagingWriteStatus: text("staging_write_status").notNull(),
  durationMs: integer("duration_ms").notNull(), createdAt: text("created_at").notNull(),
}, (t) => [index("idx_semantic_diagnostic_record").on(t.recordId,t.classifierVersion,t.apiMode,t.runKind)]);

// Append-only classifier calibration evidence, isolated from learning mappings.
export const semanticPassACalibration = sqliteTable("semantic_pass_a_calibration", {
  requestId: text("request_id").primaryKey(),
  recordId: text("record_id").notNull().references(() => canonicalRecords.recordId),
  classifierVersion: text("classifier_version").notNull(), contractVersion: text("contract_version").notNull(),
  taxonomyVersion: text("taxonomy_version").notNull(), inputHash: text("input_hash").notNull(),
  model: text("model").notNull(), apiMode: text("api_mode").notNull(), attemptNumber: integer("attempt_number").notNull(),
  httpStatus: integer("http_status"), responseStatus: text("response_status"), incompleteDetailsJson: text("incomplete_details_json"),
  usageJson: text("usage_json"), rawOutputText: text("raw_output_text"), parsedModelJson: text("parsed_model_json"),
  normalizedModelJson: text("normalized_model_json"), normalizationChangesJson: text("normalization_changes_json"),
  parseStatus: text("parse_status").notNull(), validationStatus: text("validation_status").notNull(),
  schemaStatus: text("schema_status").notNull().default("PENDING"),
  validatorStatus: text("validator_status").notNull().default("PENDING"),
  validationErrorsJson: text("validation_errors_json").notNull(), passAStatus: text("pass_a_status"),
  passAReviewStatus: text("pass_a_review_status").notNull().default("PENDING_REVIEW"),
  safetyGateResultJson: text("safety_gate_result_json"),
  modelSemanticStatus: text("model_semantic_status").notNull().default("PENDING_MEDICAL_REVIEW"),
  gateDecision: text("gate_decision").notNull().default("PENDING"),
  downstreamEvidenceStatus: text("downstream_evidence_status").notNull().default("PENDING"),
  stabilitySetHash: text("stability_set_hash"),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (t) => [index("idx_semantic_pass_a_record").on(t.recordId,t.classifierVersion,t.inputHash)]);

export const questionOptions = sqliteTable("question_options", {
  id: text("id").primaryKey(), questionId: text("question_id").notNull().references(() => questions.id), optionKey: text("option_key").notNull(),
  textEn: text("text_en").notNull(), textZh: text("text_zh"), sortOrder: integer("sort_order").notNull(),
}, (t) => [uniqueIndex("idx_question_options_unique").on(t.questionId, t.optionKey)]);

export const knowledgeNodes = sqliteTable("knowledge_nodes", {
  id: text("id").primaryKey(), canonicalName: text("canonical_name").notNull(), domain: text("domain").notNull(), system: text("system").notNull(),
  condition: text("condition").notNull(), clinicalTask: text("clinical_task").notNull(), parentNodeId: text("parent_node_id"),
  currentSummary: text("current_summary"), currentGuidelineVerifiedAt: text("current_guideline_verified_at"),
});

export const questionNodeLinks = sqliteTable("question_node_links", {
  questionId: text("question_id").notNull().references(() => questions.id), nodeId: text("node_id").notNull().references(() => knowledgeNodes.id),
  weight: real("weight").notNull().default(1), relationType: text("relation_type").notNull(),
}, (t) => [primaryKey({ columns: [t.questionId, t.nodeId] })]);

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), questionId: text("question_id").notNull().references(() => questions.id),
  selectedAnswer: text("selected_answer").notNull(), correct: integer("correct", { mode: "boolean" }).notNull(),
  confidence: text("confidence", { enum: ["confident", "uncertain", "guess"] }).notNull(), elapsedMs: integer("elapsed_ms").notNull(),
  attemptedAt: text("attempted_at").notNull(), sessionId: text("session_id").notNull(), errorType: text("error_type"),
  chapterId: text("chapter_id"), sectionId: text("section_id"), testedConceptId: text("tested_concept_id"), errorDomain: text("error_domain"),
}, (t) => [index("idx_attempts_user_time").on(t.userId, t.attemptedAt), index("idx_attempts_user_question").on(t.userId, t.questionId)]);

export const knowledgeChapters = sqliteTable("knowledge_chapters", {
  id: text("id").primaryKey(), title: text("title").notNull(), condition: text("condition").notNull(), system: text("system").notNull(),
  sectionsJson: text("sections_json").notNull(), version: text("version").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const questionConceptMap = sqliteTable("question_concept_map", {
  questionId: text("question_id").primaryKey().references(() => questions.id), chapterId: text("chapter_id").notNull().references(() => knowledgeChapters.id),
  sectionId: text("section_id").notNull(), testedConceptId: text("tested_concept_id").notNull(), testedConceptLabel: text("tested_concept_label").notNull(),
  clinicalTask: text("clinical_task").notNull(), errorDomain: text("error_domain").notNull(), mappingVersion: text("mapping_version").notNull(), updatedAt: text("updated_at").notNull(),
}, (t) => [index("idx_question_concept_chapter_section").on(t.chapterId, t.sectionId), index("idx_question_concept_tested").on(t.testedConceptId)]);

// Canonical learning identity spans every imported record, including records
// without an answerable `questions` row. The legacy practice/FSRS tables keep
// their existing question IDs; imported IDs are the same as canonical IDs.
export const canonicalChapters = sqliteTable("canonical_chapters", {
  id: text("id").primaryKey(), specialty: text("specialty").notNull(), domain: text("domain").notNull(),
  title: text("title").notNull(), chapterType: text("chapter_type").notNull(), status: text("status").notNull(),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});
export const canonicalSections = sqliteTable("canonical_sections", {
  id: text("id").primaryKey(), chapterId: text("chapter_id").notNull().references(() => canonicalChapters.id),
  title: text("title").notNull(), sectionType: text("section_type").notNull(), sortOrder: integer("sort_order").notNull(),
});
export const canonicalSubtopics = sqliteTable("canonical_subtopics", {
  id: text("id").primaryKey(), sectionId: text("section_id").notNull().references(() => canonicalSections.id),
  title: text("title").notNull(), sortOrder: integer("sort_order").notNull(),
});
export const canonicalQuestionLearningMap = sqliteTable("canonical_question_learning_map", {
  recordId: text("record_id").primaryKey().references(() => canonicalRecords.recordId),
  primaryChapterId: text("primary_chapter_id").references(() => canonicalChapters.id),
  primarySectionId: text("primary_section_id").references(() => canonicalSections.id),
  primarySubtopicId: text("primary_subtopic_id").references(() => canonicalSubtopics.id),
  mappingStatus: text("mapping_status").notNull(), mappingConfidence: text("mapping_confidence").notNull(),
  mappingMethod: text("mapping_method").notNull(), mappingProvenance: text("mapping_provenance").notNull(),
  sourceNodeId: text("source_node_id"), candidateChaptersJson: text("candidate_chapters_json").notNull(),
  candidateSection: text("candidate_section"), candidateSubtopic: text("candidate_subtopic"),
  reviewTier: text("review_tier"), reviewReason: text("review_reason"),
  reviewedBy: text("reviewed_by"), reviewedAt: text("reviewed_at"), updatedAt: text("updated_at").notNull(),
}, (t) => [index("idx_canonical_learning_chapter").on(t.primaryChapterId, t.primarySectionId), index("idx_canonical_learning_review").on(t.mappingStatus, t.reviewTier)]);
export const canonicalLearningCandidates = sqliteTable("canonical_learning_candidates", {
  recordId: text("record_id").notNull().references(() => canonicalRecords.recordId), nodeId: text("node_id").notNull(),
  relationType: text("relation_type").notNull(), mappingMethod: text("mapping_method").notNull(),
  mappingConfidence: text("mapping_confidence").notNull(), provenance: text("provenance").notNull(),
}, (t) => [primaryKey({ columns: [t.recordId,t.nodeId,t.relationType] }), index("idx_canonical_candidates_node").on(t.nodeId)]);

export const conceptFsrsState = sqliteTable("concept_fsrs_state", {
  userId: text("user_id").notNull().references(() => users.id), testedConceptId: text("tested_concept_id").notNull(),
  chapterId: text("chapter_id").notNull().references(() => knowledgeChapters.id), sectionId: text("section_id").notNull(),
  dueAt: text("due_at").notNull(), stability: real("stability").notNull(), difficulty: real("difficulty").notNull(),
  lastReviewedAt: text("last_reviewed_at").notNull(), scheduledDays: real("scheduled_days").notNull(), reps: integer("reps").notNull(),
  lapses: integer("lapses").notNull(), state: text("state").notNull(), lastRating: integer("last_rating").notNull(), priority: real("priority").notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.testedConceptId] }), index("idx_concept_fsrs_due").on(t.userId, t.dueAt), index("idx_concept_fsrs_chapter_section").on(t.chapterId, t.sectionId)]);

export const vocabularyLookupCache = sqliteTable("vocabulary_lookup_cache", {
  cacheKey: text("cache_key").primaryKey(), normalizedSurface: text("normalized_surface").notNull(), lemma: text("lemma").notNull(),
  contextHash: text("context_hash").notNull(), resultJson: text("result_json").notNull(), provider: text("provider").notNull(),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (t) => [index("idx_vocabulary_lookup_lemma").on(t.lemma)]);

export const nodeEvidence = sqliteTable("node_evidence", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), nodeId: text("node_id").notNull().references(() => knowledgeNodes.id),
  questionId: text("question_id").notNull().references(() => questions.id), attemptId: text("attempt_id").notNull().references(() => attempts.id),
  evidenceScore: real("evidence_score").notNull(), evidenceType: text("evidence_type").notNull(), createdAt: text("created_at").notNull(),
}, (t) => [index("idx_node_evidence_user_node").on(t.userId, t.nodeId)]);

export const reviewState = sqliteTable("review_state", {
  userId: text("user_id").notNull().references(() => users.id), nodeId: text("node_id").notNull().references(() => knowledgeNodes.id),
  dueAt: text("due_at").notNull(), stability: real("stability"), difficulty: real("difficulty"), intervalDays: integer("interval_days").notNull(),
  lastReviewedAt: text("last_reviewed_at"), lapseCount: integer("lapse_count").notNull().default(0), priority: real("priority").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.nodeId] }), index("idx_review_due").on(t.userId, t.dueAt)]);

export const vocabulary = sqliteTable("vocabulary", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), lemma: text("lemma").notNull(), surfaceForm: text("surface_form").notNull(),
  partOfSpeech: text("part_of_speech"), translationZh: text("translation_zh").notNull(), contextualMeaningZh: text("contextual_meaning_zh"),
  morphologyZh: text("morphology_zh"), etymologyZh: text("etymology_zh"), mnemonicZh: text("mnemonic_zh"),
  sourceQuestionId: text("source_question_id").references(() => questions.id), sourceContext: text("source_context"), createdAt: text("created_at").notNull(),
  lastReviewedAt: text("last_reviewed_at"), dueAt: text("due_at").notNull(), status: text("status").notNull().default("learning"),
}, (t) => [uniqueIndex("idx_vocabulary_user_lemma").on(t.userId, t.lemma), index("idx_vocabulary_due").on(t.userId, t.dueAt)]);

export const coachRuns = sqliteTable("coach_runs", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), questionId: text("question_id").notNull().references(() => questions.id),
  createdAt: text("created_at").notNull(), evidenceStatus: text("evidence_status").notNull(), sourceComparisonStatus: text("source_comparison_status").notNull(),
  resultJson: text("result_json").notNull(), sourceListJson: text("source_list_json").notNull(), searchedAt: text("searched_at"), cacheKey: text("cache_key").notNull(),
}, (t) => [index("idx_coach_question_cache").on(t.questionId, t.cacheKey)]);

export const guidanceEvidenceCache = sqliteTable("guidance_evidence_cache", {
  questionId: text("question_id").primaryKey().references(() => questions.id), nodeId: text("node_id"), subtopic: text("subtopic"),
  status: text("status").notNull(), currentAnswer: text("current_answer"), recommendation: text("recommendation"),
  whatChanged: text("what_changed"), sourcesJson: text("sources_json").notNull(), verifiedAt: text("verified_at"),
  staleAfter: text("stale_after"), provider: text("provider"), updatedAt: text("updated_at").notNull(),
});
export const guidanceVerificationHistory = sqliteTable("guidance_verification_history", {
  id: text("id").primaryKey(), questionId: text("question_id").notNull().references(() => questions.id),
  nodeId: text("node_id"), subtopic: text("subtopic"), outcome: text("outcome").notNull(), provider: text("provider"),
  sourcesJson: text("sources_json").notNull(), checkedAt: text("checked_at").notNull(), errorCode: text("error_code"),
}, (t) => [index("idx_guidance_history_question_checked").on(t.questionId,t.checkedAt)]);

export const guidanceSourceMetadata = sqliteTable("guidance_source_metadata", {
  canonicalUrl: text("canonical_url").primaryKey(), title: text("title").notNull(), issuingBody: text("issuing_body").notNull(),
  authorityTier: integer("authority_tier").notNull(), specialtyJson: text("specialty_json").notNull(), keywords: text("keywords").notNull(),
  lastSeenAt: text("last_seen_at").notNull(), lastModified: text("last_modified"), sourceType: text("source_type").notNull(),
  nodeId: text("node_id"), subtopic: text("subtopic"),
}, (t) => [index("idx_guidance_source_node_subtopic_seen").on(t.nodeId,t.subtopic,t.lastSeenAt)]);

export const guidanceNodeEvidenceCache = sqliteTable("guidance_node_evidence_cache", {
  nodeId: text("node_id").notNull(), scenarioKey: text("scenario_key").notNull(), subtopic: text("subtopic"), status: text("status").notNull(),
  currentAnswer: text("current_answer"), recommendation: text("recommendation"), whatChanged: text("what_changed"), sourcesJson: text("sources_json").notNull(),
  verifiedAt: text("verified_at").notNull(), staleAfter: text("stale_after").notNull(), sourceQuestionId: text("source_question_id").notNull().references(() => questions.id),
  provider: text("provider").notNull(),
}, (t) => [primaryKey({ columns: [t.nodeId,t.scenarioKey] }), index("idx_guidance_node_evidence_fresh").on(t.nodeId,t.scenarioKey,t.staleAfter)]);

// One complete explanation is cached as one unit.  The hash is of the complete
// English payload, so importing an edited explanation automatically produces a
// new cache key rather than showing an outdated translation.
export const explanationTranslations = sqliteTable("explanation_translations", {
  id: text("id").primaryKey(), questionId: text("question_id").notNull().references(() => questions.id),
  explanationType: text("explanation_type").notNull(), contentHash: text("content_hash").notNull(),
  sourceContent: text("source_content").notNull(), translationJson: text("translation_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [uniqueIndex("idx_explanation_translation_cache").on(t.questionId, t.explanationType, t.contentHash)]);

// v12 uses one translation cache for every study surface.  The cache key is
// intentionally independent of a question so the same chapter block can be
// reused wherever it appears.
export const translationCache = sqliteTable("translation_cache", {
  cacheKey: text("cache_key").primaryKey(), contentHash: text("content_hash").notNull(),
  sourceLanguage: text("source_language").notNull(), targetLanguage: text("target_language").notNull(),
  contentKind: text("content_kind").notNull(), sourceJson: text("source_json").notNull(),
  translationJson: text("translation_json").notNull(), provider: text("provider").notNull(),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (t) => [index("idx_translation_content_languages").on(t.contentHash, t.sourceLanguage, t.targetLanguage)]);

export const studyNotes = sqliteTable("study_notes", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id),
  scopeKey: text("scope_key").notNull(), noteType: text("note_type").notNull(),
  questionId: text("question_id").references(() => questions.id), chapterId: text("chapter_id"), sectionId: text("section_id"),
  body: text("body").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (t) => [uniqueIndex("idx_study_notes_user_scope").on(t.userId, t.scopeKey), index("idx_study_notes_user_updated").on(t.userId, t.updatedAt)]);

// Lightweight pointer to where the learner stopped, keyed by practice scope.
// It is a navigation cursor only and never duplicates or overrides attempt
// history, FSRS or review state.  Because the key includes the scope, a source
// added later (e.g. Emidici) can never overwrite another source's position.
export const practicePosition = sqliteTable("practice_position", {
  userId: text("user_id").notNull(),
  practiceScope: text("practice_scope").notNull(),
  questionId: text("question_id").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.practiceScope] }), index("idx_practice_position_updated").on(t.updatedAt)]);

// Duplicate MARKING between an added source and the canonical corpus.  A marked
// duplicate is retained and remains separately practiceable; the mark only
// records the relationship so statistics never double-count it.
export const emidiciDuplicateMark = sqliteTable("emidici_duplicate_mark", {
  emidiciRecordId: text("emidici_record_id").primaryKey(),
  sourceProvider: text("source_provider").notNull(),
  sourceQuestionId: text("source_question_id").notNull(),
  duplicateKind: text("duplicate_kind").notNull(),
  counterpartRecordId: text("counterpart_record_id"),
  counterpartProvider: text("counterpart_provider"),
  similarity: real("similarity"),
  evidenceJson: text("evidence_json").notNull(),
  markedAt: text("marked_at").notNull(),
  markVersion: text("mark_version").notNull(),
}, (t) => [index("idx_emidici_dup_kind").on(t.duplicateKind), index("idx_emidici_dup_counterpart").on(t.counterpartRecordId)]);

// Independent recovery layer for source-era answers recovered from the original
// answer exports.  `canonicalRecords.sourceAnswer` / `.sourceExplanation` stay
// immutable; this table is the only place a recovered answer is written.
export const sourceAnswerRecovery = sqliteTable("source_answer_recovery", {
  recordId: text("record_id").primaryKey().references(() => canonicalRecords.recordId),
  recoveredAnswer: text("recovered_answer"), recoveredExplanation: text("recovered_explanation"),
  sourcePdf: text("source_pdf"), sourcePdfSha256: text("source_pdf_sha256"),
  sourcePage: integer("source_page"), sourcePageIndex: integer("source_page_index"),
  ocrEngine: text("ocr_engine").notNull(), ocrVersion: text("ocr_version").notNull(),
  ocrConfidence: real("ocr_confidence"), answerPattern: text("answer_pattern"),
  questionFingerprint: text("question_fingerprint"), matchMethod: text("match_method").notNull(),
  candidateMatchCount: integer("candidate_match_count").notNull(),
  status: text("status").notNull(), reviewReason: text("review_reason"), evidenceJson: text("evidence_json"),
  promoted: integer("promoted", { mode: "boolean" }).notNull().default(false), promotedAt: text("promoted_at"),
  classification: text("classification").notNull().default("UNCLASSIFIED"),
  conflictType: text("conflict_type"), canonicalAnswerAtRecovery: text("canonical_answer_at_recovery"),
  createdAt: text("created_at").notNull(), recoveryVersion: text("recovery_version").notNull(),
}, (t) => [index("idx_sar_status").on(t.status), index("idx_sar_pdf_page").on(t.sourcePdf, t.sourcePage), index("idx_sar_promoted").on(t.promoted, t.status), index("idx_sar_classification").on(t.classification)]);

export const dataHygieneMigrations = sqliteTable("data_hygiene_migrations", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id),
  appliedAt: text("applied_at").notNull(), detailsJson: text("details_json").notNull(),
}, (t) => [uniqueIndex("idx_data_hygiene_user_id").on(t.userId, t.id)]);

export const dailyStats = sqliteTable("daily_stats", { userId: text("user_id").notNull(), periodStart: text("period_start").notNull(), metricsJson: text("metrics_json").notNull() }, (t) => [primaryKey({ columns: [t.userId, t.periodStart] })]);
export const weeklyStats = sqliteTable("weekly_stats", { userId: text("user_id").notNull(), periodStart: text("period_start").notNull(), metricsJson: text("metrics_json").notNull() }, (t) => [primaryKey({ columns: [t.userId, t.periodStart] })]);
export const monthlyStats = sqliteTable("monthly_stats", { userId: text("user_id").notNull(), periodStart: text("period_start").notNull(), metricsJson: text("metrics_json").notNull() }, (t) => [primaryKey({ columns: [t.userId, t.periodStart] })]);

export const sourceManifest = sqliteTable("source_manifest", {
  id: text("id").primaryKey(), sourceId: text("source_id").references(() => sources.id), driveLocator: text("drive_locator"), filename: text("filename").notNull(),
  byteSize: integer("byte_size"), specialty: text("specialty"), duplicateGroup: text("duplicate_group"), priorityTier: text("priority_tier"), metadataJson: text("metadata_json"), importedAt: text("imported_at"),
});
