INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('116f423e4aec85511338','Respiratory and chest amedex 2025.pdf','59','Respiratory','A 47-year-old man has developed a cough and dyspnea over the past few months. There is no history of smoking or occupational
exposure. Marked findings on examination are clubbing of the fingers and inspiratory crepitations. Which one of the following is the most
likely diagnosis?','{"A":"A. Mesothelioma.","B":"Sarcoidosis.","C":"OC. Pulmonary fibrosis.","D":"D. Lung cancer.","E":"E. Mycoplasma infection."}','C','The history and physical findings are characteristic of interstitial lung disease (IDL).

Interstitial lung diseases are a group of heterogeneous lung diseases with different clinical, physiologic, radiographic, and pathologic
presentations. However, a number of common features justify their inclusion in a single disease category.

IDL is characterized by chronic inflammation and fibrosis of the interstitium and lung parenchyma.

The interstitium of the lung (supporting structure) is the area in and around the small blood vessels and alveoli where the exchange of
oxygen and carbon dioxide takes place. Inflammation and scarring of the interstitium, and eventually extension into the alveoli, will disrupt
normal gas exchange. Although the progression of IDL may be variable from one disease to another, they have common clinical,
radiographic, and spirometric findings:

¢ Dyspnea - all patients with IDL develop exertional dyspnea which is the most common complaint bringing them to medical attention
¢ Nonproductive cough

¢ Bibasal inspiratory crackles

e Evidence of pulmonary hypertension (in advanced disease) such as increased pulmonic sound, right heart failure, etc.

¢ Clubbing (not always) especially in idiopathic pulmonary fibrosis and asbestosis

¢ Reticular or reticulonodular pattern (‘ground-glass appearance) on chest X-ray

¢ Intrapulmonary restrictive pattern and decreased DLCO on pulmonary function testing

Of the given options, only pulmonary fibrosis as an ILD fits the scenario.

(Option A) Mesothelioma is a rare malignancy of the pleural and peritoneum, highly associated with asbestos exposure. It presents with
weight loss, recurrent pleural effusions, and pleural thickening and calcification on imaging. Neither the history nor the clinical findings are
consistent with mesothelioma.

(Option B) Sarcoidosis is a multisystem disease characterized by non-caseating granuloma formation in different organ systems. The
pulmonary system is the most commonly affected system. Although pulmonary sarcoidosis is classified as ILD, most patients with
pulmonary involvement (90%) are asymptomatic. Symptoms, if present, resemble those of pulmonary TB including productive cough,
hemoptysis, and constitutional symptoms such as weight loss, fever, night sweats, and malaise.

(Option D) The absence of smoking in history makes lung cancer less likely. Moreover, lung cancer is associated with more systemic
manifestations such as weight loss.

(Option E) Mycoplasma infection such as TB or atypical pneumonia caused by mycoplasma pneumonia presents with a completely
different picture. Pulmonary TB presents with signs and symptoms such as cough, weight loss, night sweats, and malaise. Mycoplasma
pneumonia presents with a prodromal syndrome followed by dry cough, sore throat, and low-grade fever. None of these infections are
associated with clubbing.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[59],"source_qid":null,"duplicate_group_id":"exact-c668d306461e","duplicate_sources":[{"record_id":"116f423e4aec85511338","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":59,"source_qid":null},{"record_id":"a93027c956b3d91372e7","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":156,"source_qid":null},{"record_id":"23e26aa1d87f084deb07","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":155,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','medium','{"record_id":"116f423e4aec85511338","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":59,"supporting_pages":[59],"source_qid":null,"domain_hint":"Respiratory","stem":"A 47-year-old man has developed a cough and dyspnea over the past few months. There is no history of smoking or occupational\nexposure. Marked findings on examination are clubbing of the fingers and inspiratory crepitations. Which one of the following is the most\nlikely diagnosis?","options":{"A":"A. Mesothelioma.","B":"Sarcoidosis.","C":"OC. Pulmonary fibrosis.","D":"D. Lung cancer.","E":"E. Mycoplasma infection."},"source_answer":"C","source_explanation":"The history and physical findings are characteristic of interstitial lung disease (IDL).\n\nInterstitial lung diseases are a group of heterogeneous lung diseases with different clinical, physiologic, radiographic, and pathologic\npresentations. However, a number of common features justify their inclusion in a single disease category.\n\nIDL is characterized by chronic inflammation and fibrosis of the interstitium and lung parenchyma.\n\nThe interstitium of the lung (supporting structure) is the area in and around the small blood vessels and alveoli where the exchange of\noxygen and carbon dioxide takes place. Inflammation and scarring of the interstitium, and eventually extension into the alveoli, will disrupt\nnormal gas exchange. Although the progression of IDL may be variable from one disease to another, they have common clinical,\nradiographic, and spirometric findings:\n\n¢ Dyspnea - all patients with IDL develop exertional dyspnea which is the most common complaint bringing them to medical attention\n¢ Nonproductive cough\n\n¢ Bibasal inspiratory crackles\n\ne Evidence of pulmonary hypertension (in advanced disease) such as increased pulmonic sound, right heart failure, etc.\n\n¢ Clubbing (not always) especially in idiopathic pulmonary fibrosis and asbestosis\n\n¢ Reticular or reticulonodular pattern (‘ground-glass appearance) on chest X-ray\n\n¢ Intrapulmonary restrictive pattern and decreased DLCO on pulmonary function testing\n\nOf the given options, only pulmonary fibrosis as an ILD fits the scenario.\n\n(Option A) Mesothelioma is a rare malignancy of the pleural and peritoneum, highly associated with asbestos exposure. It presents with\nweight loss, recurrent pleural effusions, and pleural thickening and calcification on imaging. Neither the history nor the clinical findings are\nconsistent with mesothelioma.\n\n(Option B) Sarcoidosis is a multisystem disease characterized by non-caseating granuloma formation in different organ systems. The\npulmonary system is the most commonly affected system. Although pulmonary sarcoidosis is classified as ILD, most patients with\npulmonary involvement (90%) are asymptomatic. Symptoms, if present, resemble those of pulmonary TB including productive cough,\nhemoptysis, and constitutional symptoms such as weight loss, fever, night sweats, and malaise.\n\n(Option D) The absence of smoking in history makes lung cancer less likely. Moreover, lung cancer is associated with more systemic\nmanifestations such as weight loss.\n\n(Option E) Mycoplasma infection such as TB or atypical pneumonia caused by mycoplasma pneumonia presents with a completely\ndifferent picture. Pulmonary TB presents with signs and symptoms such as cough, weight loss, night sweats, and malaise. Mycoplasma\npneumonia presents with a prodromal syndrome followed by dry cough, sore throat, and low-grade fever. None of these infections are\nassociated with clubbing.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"medium","currentness_keywords":["hypertension"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"c668d306461e1bed20ad5ddd1a4ebd3862e49073","duplicate_group_id":"exact-c668d306461e","duplicate_sources":[{"record_id":"116f423e4aec85511338","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":59,"source_qid":null},{"record_id":"a93027c956b3d91372e7","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":156,"source_qid":null},{"record_id":"23e26aa1d87f084deb07","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":155,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('116f423e4aec85511338','src-v294-b0ec7cfe',NULL,'59','Respiratory','Respiratory','Respiratory','AMC MCQ','A 47-year-old man has developed a cough and dyspnea over the past few months. There is no history of smoking or occupational
exposure. Marked findings on examination are clubbing of the fingers and inspiratory crepitations. Which one of the following is the most
likely diagnosis?',NULL,'C','The history and physical findings are characteristic of interstitial lung disease (IDL).

Interstitial lung diseases are a group of heterogeneous lung diseases with different clinical, physiologic, radiographic, and pathologic
presentations. However, a number of common features justify their inclusion in a single disease category.

IDL is characterized by chronic inflammation and fibrosis of the interstitium and lung parenchyma.

The interstitium of the lung (supporting structure) is the area in and around the small blood vessels and alveoli where the exchange of
oxygen and carbon dioxide takes place. Inflammation and scarring of the interstitium, and eventually extension into the alveoli, will disrupt
normal gas exchange. Although the progression of IDL may be variable from one disease to another, they have common clinical,
radiographic, and spirometric findings:

¢ Dyspnea - all patients with IDL develop exertional dyspnea which is the most common complaint bringing them to medical attention
¢ Nonproductive cough

¢ Bibasal inspiratory crackles

e Evidence of pulmonary hypertension (in advanced disease) such as increased pulmonic sound, right heart failure, etc.

¢ Clubbing (not always) especially in idiopathic pulmonary fibrosis and asbestosis

¢ Reticular or reticulonodular pattern (‘ground-glass appearance) on chest X-ray

¢ Intrapulmonary restrictive pattern and decreased DLCO on pulmonary function testing

Of the given options, only pulmonary fibrosis as an ILD fits the scenario.

(Option A) Mesothelioma is a rare malignancy of the pleural and peritoneum, highly associated with asbestos exposure. It presents with
weight loss, recurrent pleural effusions, and pleural thickening and calcification on imaging. Neither the history nor the clinical findings are
consistent with mesothelioma.

(Option B) Sarcoidosis is a multisystem disease characterized by non-caseating granuloma formation in different organ systems. The
pulmonary system is the most commonly affected system. Although pulmonary sarcoidosis is classified as ILD, most patients with
pulmonary involvement (90%) are asymptomatic. Symptoms, if present, resemble those of pulmonary TB including productive cough,
hemoptysis, and constitutional symptoms such as weight loss, fever, night sweats, and malaise.

(Option D) The absence of smoking in history makes lung cancer less likely. Moreover, lung cancer is associated with more systemic
manifestations such as weight loss.

(Option E) Mycoplasma infection such as TB or atypical pneumonia caused by mycoplasma pneumonia presents with a completely
different picture. Pulmonary TB presents with signs and symptoms such as cough, weight loss, night sweats, and malaise. Mycoplasma
pneumonia presents with a prodromal syndrome followed by dry cough, sore throat, and low-grade fever. None of these infections are
associated with clubbing.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[59],"source_qid":null,"duplicate_group_id":"exact-c668d306461e","duplicate_sources":[{"record_id":"116f423e4aec85511338","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":59,"source_qid":null},{"record_id":"a93027c956b3d91372e7","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":156,"source_qid":null},{"record_id":"23e26aa1d87f084deb07","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":155,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','medium') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('116f423e4aec85511338','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='116f423e4aec85511338';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('116f423e4aec85511338-A','116f423e4aec85511338','A','A. Mesothelioma.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('116f423e4aec85511338-B','116f423e4aec85511338','B','Sarcoidosis.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('116f423e4aec85511338-C','116f423e4aec85511338','C','OC. Pulmonary fibrosis.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('116f423e4aec85511338-D','116f423e4aec85511338','D','D. Lung cancer.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('116f423e4aec85511338-E','116f423e4aec85511338','E','E. Mycoplasma infection.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('b6553b7795a8569b79b3','Respiratory and chest amedex 2025.pdf','60','Respiratory','A 69-year-old man is brought to the emergency department with severe shortness of breath and cough.
He has had 2 similar episodes in the past 6 months. His background history includes smoking of 30
cigarettes a day for the past 25 years. On examination, he is in moderate distress with a blood pressure
of 110/75mmHg, pulse of 120 bpm and respiratory rate of 34 breaths per minute. he is started on oxygen
24% through Venturi mask. A bedside pulseoxymetry shows oxygen saturation of 85%. Which one of the
following is the next best step in management?','{"A":"A. Chest X-ray.","B":"OB. ABG.","C":"C. Serum electrolytes.","D":"D. Full blood count.","E":"E. Assisted ventilation with CPAP."}','B','The clinical findings, the history of smoking, and the oxygen saturation of 85%, are suggestive of an
acute exacerbation of COPD. When hypoxemia is suspected on pulseoxymetry, an arterial blood gas
(ABG) analysis is mandatory as the next best step to not only confirm the hypoxia, but also to assess the
pH and partial arterial pressure of carbon dioxide (PaCO2) for further managment planning, as well as
having a baseline for monitoring the response to treatment.

Chest X-rat (option A) , serum electrolytes (option C) and full blood count (option D) are part of the
initial assessment, but the most important step remains ABG.

Assisted ventilation with CPAP (option E) or intubation and ventilation are considered if the patient
remains hypoxic and hypercapnic despite judicious administration of oxygen or if the patient is in severe
respiratory distress (e.g. accessory muscle use, etc).','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[60],"source_qid":null,"duplicate_group_id":"exact-dd61c6ddcaf8","duplicate_sources":[{"record_id":"b6553b7795a8569b79b3","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":60,"source_qid":null},{"record_id":"100c95e1d15f492fc878","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1773,"source_qid":"383"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"b6553b7795a8569b79b3","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":60,"supporting_pages":[60],"source_qid":null,"domain_hint":"Respiratory","stem":"A 69-year-old man is brought to the emergency department with severe shortness of breath and cough.\nHe has had 2 similar episodes in the past 6 months. His background history includes smoking of 30\ncigarettes a day for the past 25 years. On examination, he is in moderate distress with a blood pressure\nof 110/75mmHg, pulse of 120 bpm and respiratory rate of 34 breaths per minute. he is started on oxygen\n24% through Venturi mask. A bedside pulseoxymetry shows oxygen saturation of 85%. Which one of the\nfollowing is the next best step in management?","options":{"A":"A. Chest X-ray.","B":"OB. ABG.","C":"C. Serum electrolytes.","D":"D. Full blood count.","E":"E. Assisted ventilation with CPAP."},"source_answer":"B","source_explanation":"The clinical findings, the history of smoking, and the oxygen saturation of 85%, are suggestive of an\nacute exacerbation of COPD. When hypoxemia is suspected on pulseoxymetry, an arterial blood gas\n(ABG) analysis is mandatory as the next best step to not only confirm the hypoxia, but also to assess the\npH and partial arterial pressure of carbon dioxide (PaCO2) for further managment planning, as well as\nhaving a baseline for monitoring the response to treatment.\n\nChest X-rat (option A) , serum electrolytes (option C) and full blood count (option D) are part of the\ninitial assessment, but the most important step remains ABG.\n\nAssisted ventilation with CPAP (option E) or intubation and ventilation are considered if the patient\nremains hypoxic and hypercapnic despite judicious administration of oxygen or if the patient is in severe\nrespiratory distress (e.g. accessory muscle use, etc).","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","management","treatment"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"dd61c6ddcaf8ef8859a06629aa6f186cd29ea6c0","duplicate_group_id":"exact-dd61c6ddcaf8","duplicate_sources":[{"record_id":"b6553b7795a8569b79b3","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":60,"source_qid":null},{"record_id":"100c95e1d15f492fc878","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1773,"source_qid":"383"}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('b6553b7795a8569b79b3','src-v294-b0ec7cfe',NULL,'60','Respiratory','Respiratory','Respiratory','AMC MCQ','A 69-year-old man is brought to the emergency department with severe shortness of breath and cough.
He has had 2 similar episodes in the past 6 months. His background history includes smoking of 30
cigarettes a day for the past 25 years. On examination, he is in moderate distress with a blood pressure
of 110/75mmHg, pulse of 120 bpm and respiratory rate of 34 breaths per minute. he is started on oxygen
24% through Venturi mask. A bedside pulseoxymetry shows oxygen saturation of 85%. Which one of the
following is the next best step in management?',NULL,'B','The clinical findings, the history of smoking, and the oxygen saturation of 85%, are suggestive of an
acute exacerbation of COPD. When hypoxemia is suspected on pulseoxymetry, an arterial blood gas
(ABG) analysis is mandatory as the next best step to not only confirm the hypoxia, but also to assess the
pH and partial arterial pressure of carbon dioxide (PaCO2) for further managment planning, as well as
having a baseline for monitoring the response to treatment.

Chest X-rat (option A) , serum electrolytes (option C) and full blood count (option D) are part of the
initial assessment, but the most important step remains ABG.

Assisted ventilation with CPAP (option E) or intubation and ventilation are considered if the patient
remains hypoxic and hypercapnic despite judicious administration of oxygen or if the patient is in severe
respiratory distress (e.g. accessory muscle use, etc).',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[60],"source_qid":null,"duplicate_group_id":"exact-dd61c6ddcaf8","duplicate_sources":[{"record_id":"b6553b7795a8569b79b3","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":60,"source_qid":null},{"record_id":"100c95e1d15f492fc878","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1773,"source_qid":"383"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('b6553b7795a8569b79b3','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='b6553b7795a8569b79b3';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6553b7795a8569b79b3-A','b6553b7795a8569b79b3','A','A. Chest X-ray.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6553b7795a8569b79b3-B','b6553b7795a8569b79b3','B','OB. ABG.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6553b7795a8569b79b3-C','b6553b7795a8569b79b3','C','C. Serum electrolytes.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6553b7795a8569b79b3-D','b6553b7795a8569b79b3','D','D. Full blood count.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6553b7795a8569b79b3-E','b6553b7795a8569b79b3','E','E. Assisted ventilation with CPAP.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('06a34d44fea14e07d0e4','Respiratory and chest amedex 2025.pdf','61','Respiratory','A 45-year-old man presents to your office concerned about asbestosis. He is a construction worker and gets involved in the demolitions of old houses for
renovation. He has read somewhere that old houses are a source of asbestos and that asbestosis is a serious condition associated with cancer. He says
that he and his coworkers do not use protective measures during work. Which one of the following would be the most appropriate action to take in this
situation?','{"A":"A. Refer him to respiratory specialist.","B":"OB. Chest X-ray now and in 5 years’ time.","C":"C. Inform the authorities about the breach of workplace safety.","D":"D. Do nothing.","E":"E. Inform him that asbestos carries a very low risk of cancer."}','B','Asbestos has been linked to an increased risk of bronchogenic carcinoma, mesothelioma, gastrointestinal cancers, and asbestosis among
occupationally-exposed workers. Adequate screening for asbestos-related diseases does not exist at present. However, some tests, particularly chest X-
rays and pulmonary function tests, may indicate that an individual has been overexposed to asbestos. It is important for physicians to become familiar
with the operating conditions that are associated with potential asbestos exposure. This is particularly important in evaluating medical and work histories
and in performing physical examinations.

The current recommendations include taking a complete history, performing physical exam with close attention to respiratory system and the following
diagnostic measures:

¢ Chest X-ray — A chest X-ray should be taken for all patients with exposure to asbestos; however, initially, the chest X-rays are often inconclusive
because it takes approximately 3-5 years for radiographic signs of asbestos exposure to be evident on X-rays. It is recommended that chest X-rays
be repeated at 3-5 years intervals.

¢ Pulmonary function tests (PFTs) — simple PFTs available at general practice level should be applied to recognize the possible restrictive patterns
caused by asbestosis.

If the condition is work-related, involvement of a respiratory or occupational physician is needed to consider factors such as the effect of the exposure on
other workers, how to control the exposure at the workplace and appropriate use of personal protective equipment.

When a current worker has been identified to have been overexposed to asbestos, measures taken by the employer to eliminate or mitigate further
exposure should also lower the risk of serious long-term consequences. The employer is required to institute a medical surveillance program for all
employees who are or will be exposed to asbestos at or above the permissible exposure limit (0.1 fiber per cubic centimeter of air).

NOTE — Although most patients with asbestos-related lung disease have a strong exposure history, significant disease can occur with even minimal
exposure; therefore, even minor or accidental exposures mandates evaluation.

Referring the patient to respiratory specialist (option A) is not necessary at this stage because he is asymptomatic and does not seem to have any
issues right now. The surveillance program can be carried out by the general practitioner.

Infromin the case to authorities for the breach of workplace safety (option C) may be considered if there is a significant risk that other employees are at
risk of harm inflicted on their health. At this stage, however, the most important step is to perform an initial evaluation and setting a surveillance plan for
thes patient.

(Option D) While this patient is in need of assessment and being monitored, doing nothing is the most inappropriate action to take.

(Option E) Asbestos exposure and asbestosis are significant risk factor for bronchogenic cancer and mesothelioma, and telling the patient that such
correlation is not strong and there is only a slightly increased risk of cancer is incorrect.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[61],"source_qid":null,"duplicate_group_id":"exact-e3b523b4baf1","duplicate_sources":[{"record_id":"06a34d44fea14e07d0e4","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":61,"source_qid":null},{"record_id":"950658c492eada117c45","record_type":"visual_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":104,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"06a34d44fea14e07d0e4","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":61,"supporting_pages":[61],"source_qid":null,"domain_hint":"Respiratory","stem":"A 45-year-old man presents to your office concerned about asbestosis. He is a construction worker and gets involved in the demolitions of old houses for\nrenovation. He has read somewhere that old houses are a source of asbestos and that asbestosis is a serious condition associated with cancer. He says\nthat he and his coworkers do not use protective measures during work. Which one of the following would be the most appropriate action to take in this\nsituation?","options":{"A":"A. Refer him to respiratory specialist.","B":"OB. Chest X-ray now and in 5 years’ time.","C":"C. Inform the authorities about the breach of workplace safety.","D":"D. Do nothing.","E":"E. Inform him that asbestos carries a very low risk of cancer."},"source_answer":"B","source_explanation":"Asbestos has been linked to an increased risk of bronchogenic carcinoma, mesothelioma, gastrointestinal cancers, and asbestosis among\noccupationally-exposed workers. Adequate screening for asbestos-related diseases does not exist at present. However, some tests, particularly chest X-\nrays and pulmonary function tests, may indicate that an individual has been overexposed to asbestos. It is important for physicians to become familiar\nwith the operating conditions that are associated with potential asbestos exposure. This is particularly important in evaluating medical and work histories\nand in performing physical examinations.\n\nThe current recommendations include taking a complete history, performing physical exam with close attention to respiratory system and the following\ndiagnostic measures:\n\n¢ Chest X-ray — A chest X-ray should be taken for all patients with exposure to asbestos; however, initially, the chest X-rays are often inconclusive\nbecause it takes approximately 3-5 years for radiographic signs of asbestos exposure to be evident on X-rays. It is recommended that chest X-rays\nbe repeated at 3-5 years intervals.\n\n¢ Pulmonary function tests (PFTs) — simple PFTs available at general practice level should be applied to recognize the possible restrictive patterns\ncaused by asbestosis.\n\nIf the condition is work-related, involvement of a respiratory or occupational physician is needed to consider factors such as the effect of the exposure on\nother workers, how to control the exposure at the workplace and appropriate use of personal protective equipment.\n\nWhen a current worker has been identified to have been overexposed to asbestos, measures taken by the employer to eliminate or mitigate further\nexposure should also lower the risk of serious long-term consequences. The employer is required to institute a medical surveillance program for all\nemployees who are or will be exposed to asbestos at or above the permissible exposure limit (0.1 fiber per cubic centimeter of air).\n\nNOTE — Although most patients with asbestos-related lung disease have a strong exposure history, significant disease can occur with even minimal\nexposure; therefore, even minor or accidental exposures mandates evaluation.\n\nReferring the patient to respiratory specialist (option A) is not necessary at this stage because he is asymptomatic and does not seem to have any\nissues right now. The surveillance program can be carried out by the general practitioner.\n\nInfromin the case to authorities for the breach of workplace safety (option C) may be considered if there is a significant risk that other employees are at\nrisk of harm inflicted on their health. At this stage, however, the most important step is to perform an initial evaluation and setting a surveillance plan for\nthes patient.\n\n(Option D) While this patient is in need of assessment and being monitored, doing nothing is the most inappropriate action to take.\n\n(Option E) Asbestos exposure and asbestosis are significant risk factor for bronchogenic cancer and mesothelioma, and telling the patient that such\ncorrelation is not strong and there is only a slightly increased risk of cancer is incorrect.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","interval","screen","screening"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"e3b523b4baf131db827a05e0ff37244edcae59f7","duplicate_group_id":"exact-e3b523b4baf1","duplicate_sources":[{"record_id":"06a34d44fea14e07d0e4","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":61,"source_qid":null},{"record_id":"950658c492eada117c45","record_type":"visual_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":104,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('06a34d44fea14e07d0e4','src-v294-b0ec7cfe',NULL,'61','Respiratory','Respiratory','Respiratory','AMC MCQ','A 45-year-old man presents to your office concerned about asbestosis. He is a construction worker and gets involved in the demolitions of old houses for
renovation. He has read somewhere that old houses are a source of asbestos and that asbestosis is a serious condition associated with cancer. He says
that he and his coworkers do not use protective measures during work. Which one of the following would be the most appropriate action to take in this
situation?',NULL,'B','Asbestos has been linked to an increased risk of bronchogenic carcinoma, mesothelioma, gastrointestinal cancers, and asbestosis among
occupationally-exposed workers. Adequate screening for asbestos-related diseases does not exist at present. However, some tests, particularly chest X-
rays and pulmonary function tests, may indicate that an individual has been overexposed to asbestos. It is important for physicians to become familiar
with the operating conditions that are associated with potential asbestos exposure. This is particularly important in evaluating medical and work histories
and in performing physical examinations.

The current recommendations include taking a complete history, performing physical exam with close attention to respiratory system and the following
diagnostic measures:

¢ Chest X-ray — A chest X-ray should be taken for all patients with exposure to asbestos; however, initially, the chest X-rays are often inconclusive
because it takes approximately 3-5 years for radiographic signs of asbestos exposure to be evident on X-rays. It is recommended that chest X-rays
be repeated at 3-5 years intervals.

¢ Pulmonary function tests (PFTs) — simple PFTs available at general practice level should be applied to recognize the possible restrictive patterns
caused by asbestosis.

If the condition is work-related, involvement of a respiratory or occupational physician is needed to consider factors such as the effect of the exposure on
other workers, how to control the exposure at the workplace and appropriate use of personal protective equipment.

When a current worker has been identified to have been overexposed to asbestos, measures taken by the employer to eliminate or mitigate further
exposure should also lower the risk of serious long-term consequences. The employer is required to institute a medical surveillance program for all
employees who are or will be exposed to asbestos at or above the permissible exposure limit (0.1 fiber per cubic centimeter of air).

NOTE — Although most patients with asbestos-related lung disease have a strong exposure history, significant disease can occur with even minimal
exposure; therefore, even minor or accidental exposures mandates evaluation.

Referring the patient to respiratory specialist (option A) is not necessary at this stage because he is asymptomatic and does not seem to have any
issues right now. The surveillance program can be carried out by the general practitioner.

Infromin the case to authorities for the breach of workplace safety (option C) may be considered if there is a significant risk that other employees are at
risk of harm inflicted on their health. At this stage, however, the most important step is to perform an initial evaluation and setting a surveillance plan for
thes patient.

(Option D) While this patient is in need of assessment and being monitored, doing nothing is the most inappropriate action to take.

(Option E) Asbestos exposure and asbestosis are significant risk factor for bronchogenic cancer and mesothelioma, and telling the patient that such
correlation is not strong and there is only a slightly increased risk of cancer is incorrect.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[61],"source_qid":null,"duplicate_group_id":"exact-e3b523b4baf1","duplicate_sources":[{"record_id":"06a34d44fea14e07d0e4","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":61,"source_qid":null},{"record_id":"950658c492eada117c45","record_type":"visual_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":104,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('06a34d44fea14e07d0e4','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='06a34d44fea14e07d0e4';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('06a34d44fea14e07d0e4-A','06a34d44fea14e07d0e4','A','A. Refer him to respiratory specialist.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('06a34d44fea14e07d0e4-B','06a34d44fea14e07d0e4','B','OB. Chest X-ray now and in 5 years’ time.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('06a34d44fea14e07d0e4-C','06a34d44fea14e07d0e4','C','C. Inform the authorities about the breach of workplace safety.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('06a34d44fea14e07d0e4-D','06a34d44fea14e07d0e4','D','D. Do nothing.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('06a34d44fea14e07d0e4-E','06a34d44fea14e07d0e4','E','E. Inform him that asbestos carries a very low risk of cancer.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('db226a7c2b45d80df64f','Respiratory and chest amedex 2025.pdf','62','Respiratory','Which one of the following is the most appropriate initial investigation in a patient with suspected pulmonary
embolism?','{"A":"OA. Chest X-ray.","B":"B. CTPA.","C":"C.V/Q scan.","D":"D. D-dimer assay.","E":"E. Doppler ultrasound scan."}','A','When pulmonary embolism is suspected based on history and clinical findings, a chest X-ray is the most
appropriate investigation to consider first. There are two objectives; the first is to exclude other lung pathologies
that might have a similar presentation. The second is to determine whether a V/Q scan or CTPA is the most
appropriate next investigation because patients with abnormal chest X-rays are more likely to have a non-
diagnostic V/Q scan than those with normal chest X-rays.

An ECG would be indicated if there is chest pain that cannot be solely attributed to PE as the cause.

After other possible conditions are excluded by chest X-ray and ECG, a clinical pretest probability (PTP)
assessment using the Well score system, simplified Wells score or revised Geneva scoring system should be
performed. As a screening test, a D-dimer assay is then used to exclude PE in patients with a low-to-moderate
likelihood of having PE.

(Options B and C) CTPA is considered the imaging modality of choice for definite diagnosis of PE, provided that it
is available and there is no condition on the patient’s side to make its use undesirable (e.g. pregnancy, women of
reproductive age, allergic reaction to contrast media, renal impairment, etc), in which case V/Q should be
considered the first-line diagnostic modality.

(Option D) D-dimer assay is indicated in patients with low and moderate pretest probability. A negative D-dimer
excludes PE, but positive results will require further assessment with CTPA or V/Q scan. Even if D-dimer is
considered, an initial chest X-ray is required to estimate the pretest probability.

(Option E) Doppler ultrasound is used if there are leg symptoms suggesting a DVT as the source of PE. However,
CXR remains the most important initial investigation.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[62],"source_qid":null,"duplicate_group_id":"exact-9d8a597d0abb","duplicate_sources":[{"record_id":"db226a7c2b45d80df64f","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":62,"source_qid":null},{"record_id":"a82193365e45bb27c0e8","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":103,"source_qid":null},{"record_id":"95290c6ad3e212c53910","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":104,"source_qid":null},{"record_id":"3be2ddb5e3fcc3e7f3cf","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1816,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"db226a7c2b45d80df64f","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":62,"supporting_pages":[62],"source_qid":null,"domain_hint":"Respiratory","stem":"Which one of the following is the most appropriate initial investigation in a patient with suspected pulmonary\nembolism?","options":{"A":"OA. Chest X-ray.","B":"B. CTPA.","C":"C.V/Q scan.","D":"D. D-dimer assay.","E":"E. Doppler ultrasound scan."},"source_answer":"A","source_explanation":"When pulmonary embolism is suspected based on history and clinical findings, a chest X-ray is the most\nappropriate investigation to consider first. There are two objectives; the first is to exclude other lung pathologies\nthat might have a similar presentation. The second is to determine whether a V/Q scan or CTPA is the most\nappropriate next investigation because patients with abnormal chest X-rays are more likely to have a non-\ndiagnostic V/Q scan than those with normal chest X-rays.\n\nAn ECG would be indicated if there is chest pain that cannot be solely attributed to PE as the cause.\n\nAfter other possible conditions are excluded by chest X-ray and ECG, a clinical pretest probability (PTP)\nassessment using the Well score system, simplified Wells score or revised Geneva scoring system should be\nperformed. As a screening test, a D-dimer assay is then used to exclude PE in patients with a low-to-moderate\nlikelihood of having PE.\n\n(Options B and C) CTPA is considered the imaging modality of choice for definite diagnosis of PE, provided that it\nis available and there is no condition on the patient’s side to make its use undesirable (e.g. pregnancy, women of\nreproductive age, allergic reaction to contrast media, renal impairment, etc), in which case V/Q should be\nconsidered the first-line diagnostic modality.\n\n(Option D) D-dimer assay is indicated in patients with low and moderate pretest probability. A negative D-dimer\nexcludes PE, but positive results will require further assessment with CTPA or V/Q scan. Even if D-dimer is\nconsidered, an initial chest X-ray is required to estimate the pretest probability.\n\n(Option E) Doppler ultrasound is used if there are leg symptoms suggesting a DVT as the source of PE. However,\nCXR remains the most important initial investigation.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","pregnan","screen","screening"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"9d8a597d0abbd7f12362b9698c8f65a9451ed5d0","duplicate_group_id":"exact-9d8a597d0abb","duplicate_sources":[{"record_id":"db226a7c2b45d80df64f","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":62,"source_qid":null},{"record_id":"a82193365e45bb27c0e8","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":103,"source_qid":null},{"record_id":"95290c6ad3e212c53910","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":104,"source_qid":null},{"record_id":"3be2ddb5e3fcc3e7f3cf","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1816,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('db226a7c2b45d80df64f','src-v294-b0ec7cfe',NULL,'62','Respiratory','Respiratory','Respiratory','AMC MCQ','Which one of the following is the most appropriate initial investigation in a patient with suspected pulmonary
embolism?',NULL,'A','When pulmonary embolism is suspected based on history and clinical findings, a chest X-ray is the most
appropriate investigation to consider first. There are two objectives; the first is to exclude other lung pathologies
that might have a similar presentation. The second is to determine whether a V/Q scan or CTPA is the most
appropriate next investigation because patients with abnormal chest X-rays are more likely to have a non-
diagnostic V/Q scan than those with normal chest X-rays.

An ECG would be indicated if there is chest pain that cannot be solely attributed to PE as the cause.

After other possible conditions are excluded by chest X-ray and ECG, a clinical pretest probability (PTP)
assessment using the Well score system, simplified Wells score or revised Geneva scoring system should be
performed. As a screening test, a D-dimer assay is then used to exclude PE in patients with a low-to-moderate
likelihood of having PE.

(Options B and C) CTPA is considered the imaging modality of choice for definite diagnosis of PE, provided that it
is available and there is no condition on the patient’s side to make its use undesirable (e.g. pregnancy, women of
reproductive age, allergic reaction to contrast media, renal impairment, etc), in which case V/Q should be
considered the first-line diagnostic modality.

(Option D) D-dimer assay is indicated in patients with low and moderate pretest probability. A negative D-dimer
excludes PE, but positive results will require further assessment with CTPA or V/Q scan. Even if D-dimer is
considered, an initial chest X-ray is required to estimate the pretest probability.

(Option E) Doppler ultrasound is used if there are leg symptoms suggesting a DVT as the source of PE. However,
CXR remains the most important initial investigation.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[62],"source_qid":null,"duplicate_group_id":"exact-9d8a597d0abb","duplicate_sources":[{"record_id":"db226a7c2b45d80df64f","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":62,"source_qid":null},{"record_id":"a82193365e45bb27c0e8","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":103,"source_qid":null},{"record_id":"95290c6ad3e212c53910","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":104,"source_qid":null},{"record_id":"3be2ddb5e3fcc3e7f3cf","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1816,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('db226a7c2b45d80df64f','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='db226a7c2b45d80df64f';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('db226a7c2b45d80df64f-A','db226a7c2b45d80df64f','A','OA. Chest X-ray.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('db226a7c2b45d80df64f-B','db226a7c2b45d80df64f','B','B. CTPA.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('db226a7c2b45d80df64f-C','db226a7c2b45d80df64f','C','C.V/Q scan.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('db226a7c2b45d80df64f-D','db226a7c2b45d80df64f','D','D. D-dimer assay.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('db226a7c2b45d80df64f-E','db226a7c2b45d80df64f','E','E. Doppler ultrasound scan.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('a4eb51cba7b120b4e4c5','Respiratory and chest amedex 2025.pdf','63','Respiratory','A 5-year-old child is brought to your clinic with complaint of cough. His mother explains that the coughs
started 2 months ago, and sometimes wakes him up at night. He also has them when he plays with other
children or runs and sometimes is associated with small amount of clear phlegm. On history, you realize
that he had flexural eczema when he was 2 years old. There child is afebrile. On chest examination, no
wheeze is heard. The rest of the physical exam is inconclusive. Which one of the following is the most
likely diagnosis?','{"A":"A. Epiglottitis.","B":"B. Chronic sinusitis.","C":"OC. Asthma.","D":"D. Gastro-esophageal reflux disease.","E":"E. Whooping cough."}','C','The age of the child, history of atopy (eczema) and chronic intermittent cough favor the diagnosis of
asthma. Asthma is common in this age group and is usually underdiagnosed. In atopic asthma, the child
usually has the history of other atopies such as allergic rhinitis, eczema, etc.

(Option A) Epiglotitis has more pronounced and acute presentation with fever and cough, respiratory
distress and drooling. The child is usually very ill.

(Option B) Chronic sinusitis may present with nocturnal cough caused by post nasal drip, but exertional
cough is not usually a feature. Besides, the discharges tend to be more thick and purulent. There is also
history of facial tenderness or fullness and recurrent upper respiratory infections.

(Option D) Gastro-esophageal reflux is rare in this age group. If present, it may cause chronic calf and
mimic cough-variant asthma especially at night, but not exertional cough. Moreover, absence of other
features such as heart burn makes this diagnosis far less unlikely.

(Option E) Whooping cough (pertussis) has a different presentation with paroxysms of cough and the
terminal inspiratory whoop.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[63],"source_qid":null,"duplicate_group_id":"exact-72dbcd4f36ea","duplicate_sources":[{"record_id":"a4eb51cba7b120b4e4c5","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":63,"source_qid":null},{"record_id":"eb36c1d96c3809415e84","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1759,"source_qid":"373"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','medium','{"record_id":"a4eb51cba7b120b4e4c5","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":63,"supporting_pages":[63],"source_qid":null,"domain_hint":"Respiratory","stem":"A 5-year-old child is brought to your clinic with complaint of cough. His mother explains that the coughs\nstarted 2 months ago, and sometimes wakes him up at night. He also has them when he plays with other\nchildren or runs and sometimes is associated with small amount of clear phlegm. On history, you realize\nthat he had flexural eczema when he was 2 years old. There child is afebrile. On chest examination, no\nwheeze is heard. The rest of the physical exam is inconclusive. Which one of the following is the most\nlikely diagnosis?","options":{"A":"A. Epiglottitis.","B":"B. Chronic sinusitis.","C":"OC. Asthma.","D":"D. Gastro-esophageal reflux disease.","E":"E. Whooping cough."},"source_answer":"C","source_explanation":"The age of the child, history of atopy (eczema) and chronic intermittent cough favor the diagnosis of\nasthma. Asthma is common in this age group and is usually underdiagnosed. In atopic asthma, the child\nusually has the history of other atopies such as allergic rhinitis, eczema, etc.\n\n(Option A) Epiglotitis has more pronounced and acute presentation with fever and cough, respiratory\ndistress and drooling. The child is usually very ill.\n\n(Option B) Chronic sinusitis may present with nocturnal cough caused by post nasal drip, but exertional\ncough is not usually a feature. Besides, the discharges tend to be more thick and purulent. There is also\nhistory of facial tenderness or fullness and recurrent upper respiratory infections.\n\n(Option D) Gastro-esophageal reflux is rare in this age group. If present, it may cause chronic calf and\nmimic cough-variant asthma especially at night, but not exertional cough. Moreover, absence of other\nfeatures such as heart burn makes this diagnosis far less unlikely.\n\n(Option E) Whooping cough (pertussis) has a different presentation with paroxysms of cough and the\nterminal inspiratory whoop.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"medium","currentness_keywords":["age","asthma"],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"72dbcd4f36ea6b93e9f656375ba0ed19f1157c55","duplicate_group_id":"exact-72dbcd4f36ea","duplicate_sources":[{"record_id":"a4eb51cba7b120b4e4c5","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":63,"source_qid":null},{"record_id":"eb36c1d96c3809415e84","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1759,"source_qid":"373"}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('a4eb51cba7b120b4e4c5','src-v294-b0ec7cfe',NULL,'63','Respiratory','Respiratory','Respiratory','AMC MCQ','A 5-year-old child is brought to your clinic with complaint of cough. His mother explains that the coughs
started 2 months ago, and sometimes wakes him up at night. He also has them when he plays with other
children or runs and sometimes is associated with small amount of clear phlegm. On history, you realize
that he had flexural eczema when he was 2 years old. There child is afebrile. On chest examination, no
wheeze is heard. The rest of the physical exam is inconclusive. Which one of the following is the most
likely diagnosis?',NULL,'C','The age of the child, history of atopy (eczema) and chronic intermittent cough favor the diagnosis of
asthma. Asthma is common in this age group and is usually underdiagnosed. In atopic asthma, the child
usually has the history of other atopies such as allergic rhinitis, eczema, etc.

(Option A) Epiglotitis has more pronounced and acute presentation with fever and cough, respiratory
distress and drooling. The child is usually very ill.

(Option B) Chronic sinusitis may present with nocturnal cough caused by post nasal drip, but exertional
cough is not usually a feature. Besides, the discharges tend to be more thick and purulent. There is also
history of facial tenderness or fullness and recurrent upper respiratory infections.

(Option D) Gastro-esophageal reflux is rare in this age group. If present, it may cause chronic calf and
mimic cough-variant asthma especially at night, but not exertional cough. Moreover, absence of other
features such as heart burn makes this diagnosis far less unlikely.

(Option E) Whooping cough (pertussis) has a different presentation with paroxysms of cough and the
terminal inspiratory whoop.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[63],"source_qid":null,"duplicate_group_id":"exact-72dbcd4f36ea","duplicate_sources":[{"record_id":"a4eb51cba7b120b4e4c5","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":63,"source_qid":null},{"record_id":"eb36c1d96c3809415e84","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1759,"source_qid":"373"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','medium') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('a4eb51cba7b120b4e4c5','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='a4eb51cba7b120b4e4c5';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('a4eb51cba7b120b4e4c5-A','a4eb51cba7b120b4e4c5','A','A. Epiglottitis.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('a4eb51cba7b120b4e4c5-B','a4eb51cba7b120b4e4c5','B','B. Chronic sinusitis.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('a4eb51cba7b120b4e4c5-C','a4eb51cba7b120b4e4c5','C','OC. Asthma.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('a4eb51cba7b120b4e4c5-D','a4eb51cba7b120b4e4c5','D','D. Gastro-esophageal reflux disease.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('a4eb51cba7b120b4e4c5-E','a4eb51cba7b120b4e4c5','E','E. Whooping cough.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('ac2972481ed292c5835d','Respiratory and chest amedex 2025.pdf','64','Respiratory','A 67-year-old man with background history of smoking for the past 40 years and chronic obstructive
pulmonary disease (COPD) presents with acute shortness of breath, pleuretic chest pain, increased
mucus production and severe cough. Last week, he has had an episode of gout in his first
metatarsophalangeal joint, for which he was started on indomethacin 75 mg, 8-hourly. Sever pain made
him bedbound for 5 days. On examination, he has a blood pressure of 130/95 mmHg, pulse rate of 110
bpm, respiratory rate of 34 breaths per minute and temperature of 37.5°C. Which one of the following is
the next best step in management?','{"A":"A. Chest X-ray.","B":"OB. Arterial blood gas (ABG) analysis.","C":"C. Computed tomography pulmonary angiography (CTPA).","D":"D. Ventilation/perfusion scan.","E":"E. Chest CT scan."}','B','Pleuretic chest pain, tachycardia, and tachypnea and the history of immobility is highly suggestive of
pulmonary embolism (PE). PE on the other hand, can precipitate a COPD exacerbation that justifies the
increased amount of sputum production, hypoxia and hypercapnia. Under these circumstances, an ABG
is always the next best investigation to check for hypoxia (the most important concern in both PE and
COPD), worsened hypercapnia due to COPD exacerbation, and the blood pH. A chest X-ray (option A)
should be obtained for this patient to investigate any other underlying lung pathology that might, other
than the PE, has led to the condition, but immediate pulseoxymetry and ABG always come first in priority.

Ventilation/perfusion scan (option D) or CTPA (preferred) (option C) are diagnostic tools to establish the
definite diagnosis of PE. They should be performed to prove the presence if PE prior to treatment with
anticoagulation.

A conventional CT scan of the chest (option E) has no role in management of this patient for now.

With the underlying COPD and baseline chest X-ray abnormalities, ventilation/perfusion scan is unlikely
to be of diagnostic value. Conventional CT scan of the chest would add no relevant piece of information.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[64],"source_qid":null,"duplicate_group_id":"exact-68fcb60686f9","duplicate_sources":[{"record_id":"ac2972481ed292c5835d","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":64,"source_qid":null},{"record_id":"bbf54931a6e94231e7e5","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1774,"source_qid":"384"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"ac2972481ed292c5835d","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":64,"supporting_pages":[64],"source_qid":null,"domain_hint":"Respiratory","stem":"A 67-year-old man with background history of smoking for the past 40 years and chronic obstructive\npulmonary disease (COPD) presents with acute shortness of breath, pleuretic chest pain, increased\nmucus production and severe cough. Last week, he has had an episode of gout in his first\nmetatarsophalangeal joint, for which he was started on indomethacin 75 mg, 8-hourly. Sever pain made\nhim bedbound for 5 days. On examination, he has a blood pressure of 130/95 mmHg, pulse rate of 110\nbpm, respiratory rate of 34 breaths per minute and temperature of 37.5°C. Which one of the following is\nthe next best step in management?","options":{"A":"A. Chest X-ray.","B":"OB. Arterial blood gas (ABG) analysis.","C":"C. Computed tomography pulmonary angiography (CTPA).","D":"D. Ventilation/perfusion scan.","E":"E. Chest CT scan."},"source_answer":"B","source_explanation":"Pleuretic chest pain, tachycardia, and tachypnea and the history of immobility is highly suggestive of\npulmonary embolism (PE). PE on the other hand, can precipitate a COPD exacerbation that justifies the\nincreased amount of sputum production, hypoxia and hypercapnia. Under these circumstances, an ABG\nis always the next best investigation to check for hypoxia (the most important concern in both PE and\nCOPD), worsened hypercapnia due to COPD exacerbation, and the blood pH. A chest X-ray (option A)\nshould be obtained for this patient to investigate any other underlying lung pathology that might, other\nthan the PE, has led to the condition, but immediate pulseoxymetry and ABG always come first in priority.\n\nVentilation/perfusion scan (option D) or CTPA (preferred) (option C) are diagnostic tools to establish the\ndefinite diagnosis of PE. They should be performed to prove the presence if PE prior to treatment with\nanticoagulation.\n\nA conventional CT scan of the chest (option E) has no role in management of this patient for now.\n\nWith the underlying COPD and baseline chest X-ray abnormalities, ventilation/perfusion scan is unlikely\nto be of diagnostic value. Conventional CT scan of the chest would add no relevant piece of information.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","anticoag","management","treatment"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"68fcb60686f9043b13fdd78ce3a425b7161e9559","duplicate_group_id":"exact-68fcb60686f9","duplicate_sources":[{"record_id":"ac2972481ed292c5835d","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":64,"source_qid":null},{"record_id":"bbf54931a6e94231e7e5","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1774,"source_qid":"384"}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('ac2972481ed292c5835d','src-v294-b0ec7cfe',NULL,'64','Respiratory','Respiratory','Respiratory','AMC MCQ','A 67-year-old man with background history of smoking for the past 40 years and chronic obstructive
pulmonary disease (COPD) presents with acute shortness of breath, pleuretic chest pain, increased
mucus production and severe cough. Last week, he has had an episode of gout in his first
metatarsophalangeal joint, for which he was started on indomethacin 75 mg, 8-hourly. Sever pain made
him bedbound for 5 days. On examination, he has a blood pressure of 130/95 mmHg, pulse rate of 110
bpm, respiratory rate of 34 breaths per minute and temperature of 37.5°C. Which one of the following is
the next best step in management?',NULL,'B','Pleuretic chest pain, tachycardia, and tachypnea and the history of immobility is highly suggestive of
pulmonary embolism (PE). PE on the other hand, can precipitate a COPD exacerbation that justifies the
increased amount of sputum production, hypoxia and hypercapnia. Under these circumstances, an ABG
is always the next best investigation to check for hypoxia (the most important concern in both PE and
COPD), worsened hypercapnia due to COPD exacerbation, and the blood pH. A chest X-ray (option A)
should be obtained for this patient to investigate any other underlying lung pathology that might, other
than the PE, has led to the condition, but immediate pulseoxymetry and ABG always come first in priority.

Ventilation/perfusion scan (option D) or CTPA (preferred) (option C) are diagnostic tools to establish the
definite diagnosis of PE. They should be performed to prove the presence if PE prior to treatment with
anticoagulation.

A conventional CT scan of the chest (option E) has no role in management of this patient for now.

With the underlying COPD and baseline chest X-ray abnormalities, ventilation/perfusion scan is unlikely
to be of diagnostic value. Conventional CT scan of the chest would add no relevant piece of information.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[64],"source_qid":null,"duplicate_group_id":"exact-68fcb60686f9","duplicate_sources":[{"record_id":"ac2972481ed292c5835d","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":64,"source_qid":null},{"record_id":"bbf54931a6e94231e7e5","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1774,"source_qid":"384"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('ac2972481ed292c5835d','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='ac2972481ed292c5835d';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('ac2972481ed292c5835d-A','ac2972481ed292c5835d','A','A. Chest X-ray.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('ac2972481ed292c5835d-B','ac2972481ed292c5835d','B','OB. Arterial blood gas (ABG) analysis.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('ac2972481ed292c5835d-C','ac2972481ed292c5835d','C','C. Computed tomography pulmonary angiography (CTPA).',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('ac2972481ed292c5835d-D','ac2972481ed292c5835d','D','D. Ventilation/perfusion scan.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('ac2972481ed292c5835d-E','ac2972481ed292c5835d','E','E. Chest CT scan.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('b9478cbd8faa6021bd5c','Respiratory and chest amedex 2025.pdf','65','Respiratory','Which one of the following is the most common finding in a patient with pleural
effusion?','{"A":"A. Cough.","B":"B. Chest tightness.","C":"OC. Dyspnea.","D":"D. Weight loss.","E":"E. Pleuretic chest pain."}','C','Dyspnea is the most common and prominent clinical finding in pleural effusion.

(Option A) Cough may be present in patients with pleural effusion and is often mild
and non-productive. More severe cough or bloody or purulent sputum associated
with cough suggest underlying pneumonia or endobronchial lesions.

(Option B) Chest tightness is not a feature caused by pleural effusion.

(Option D) Pleural effusion per se does not cause weight loss. Weight loss,
however, can be caused by an underlying condition such as TB, lymphoma, etc.

(Option E) pleuretic chest pain is present in some patients and suggests an
exudative etiology, such as pleural infection, pulmonary infarction, or mesothelioma.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[65],"source_qid":null,"duplicate_group_id":"exact-bf9345aca1c5","duplicate_sources":[{"record_id":"b9478cbd8faa6021bd5c","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":65,"source_qid":null},{"record_id":"d793e4995ac3d7a47306","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":32,"source_qid":null},{"record_id":"216c084ad1b0c6eef95b","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":33,"source_qid":null},{"record_id":"793864f7067e1bf8a001","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1856,"source_qid":"1149"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','low','{"record_id":"b9478cbd8faa6021bd5c","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":65,"supporting_pages":[65],"source_qid":null,"domain_hint":"Respiratory","stem":"Which one of the following is the most common finding in a patient with pleural\neffusion?","options":{"A":"A. Cough.","B":"B. Chest tightness.","C":"OC. Dyspnea.","D":"D. Weight loss.","E":"E. Pleuretic chest pain."},"source_answer":"C","source_explanation":"Dyspnea is the most common and prominent clinical finding in pleural effusion.\n\n(Option A) Cough may be present in patients with pleural effusion and is often mild\nand non-productive. More severe cough or bloody or purulent sputum associated\nwith cough suggest underlying pneumonia or endobronchial lesions.\n\n(Option B) Chest tightness is not a feature caused by pleural effusion.\n\n(Option D) Pleural effusion per se does not cause weight loss. Weight loss,\nhowever, can be caused by an underlying condition such as TB, lymphoma, etc.\n\n(Option E) pleuretic chest pain is present in some patients and suggests an\nexudative etiology, such as pleural infection, pulmonary infarction, or mesothelioma.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"low","currentness_keywords":[],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"bf9345aca1c516375522288f5906bba8e12c8b23","duplicate_group_id":"exact-bf9345aca1c5","duplicate_sources":[{"record_id":"b9478cbd8faa6021bd5c","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":65,"source_qid":null},{"record_id":"d793e4995ac3d7a47306","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":32,"source_qid":null},{"record_id":"216c084ad1b0c6eef95b","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":33,"source_qid":null},{"record_id":"793864f7067e1bf8a001","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1856,"source_qid":"1149"}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('b9478cbd8faa6021bd5c','src-v294-b0ec7cfe',NULL,'65','Respiratory','Respiratory','Respiratory','AMC MCQ','Which one of the following is the most common finding in a patient with pleural
effusion?',NULL,'C','Dyspnea is the most common and prominent clinical finding in pleural effusion.

(Option A) Cough may be present in patients with pleural effusion and is often mild
and non-productive. More severe cough or bloody or purulent sputum associated
with cough suggest underlying pneumonia or endobronchial lesions.

(Option B) Chest tightness is not a feature caused by pleural effusion.

(Option D) Pleural effusion per se does not cause weight loss. Weight loss,
however, can be caused by an underlying condition such as TB, lymphoma, etc.

(Option E) pleuretic chest pain is present in some patients and suggests an
exudative etiology, such as pleural infection, pulmonary infarction, or mesothelioma.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[65],"source_qid":null,"duplicate_group_id":"exact-bf9345aca1c5","duplicate_sources":[{"record_id":"b9478cbd8faa6021bd5c","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":65,"source_qid":null},{"record_id":"d793e4995ac3d7a47306","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":32,"source_qid":null},{"record_id":"216c084ad1b0c6eef95b","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":33,"source_qid":null},{"record_id":"793864f7067e1bf8a001","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1856,"source_qid":"1149"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','low') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('b9478cbd8faa6021bd5c','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='b9478cbd8faa6021bd5c';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b9478cbd8faa6021bd5c-A','b9478cbd8faa6021bd5c','A','A. Cough.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b9478cbd8faa6021bd5c-B','b9478cbd8faa6021bd5c','B','B. Chest tightness.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b9478cbd8faa6021bd5c-C','b9478cbd8faa6021bd5c','C','OC. Dyspnea.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b9478cbd8faa6021bd5c-D','b9478cbd8faa6021bd5c','D','D. Weight loss.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b9478cbd8faa6021bd5c-E','b9478cbd8faa6021bd5c','E','E. Pleuretic chest pain.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('c5b95e416e753f0095ff','Respiratory and chest amedex 2025.pdf','66','Respiratory','A 28-year-old woman presents to the Emergency Department with sudden onset dyspnea and pleuretic chest pain. She is 18 weeks pregnant and has a
previous history of deep venous thrombosis (DVT). Which one of the following would be the most appropriate initial investigation in this patient leading to
a definite diagnosis?','{"A":"A. D-dimer assay.","B":"OB. Ventilation/perfusion scan.","C":"C. ECG.","D":"D. CTPA.","E":"E. Doppler ultrasound scan."}','B','Investigation for pulmonary embolus (PE) in pregnancy is a complicated issue. PE is the leading cause of death in pregnancy in the developed world.
Pregnant women have all the 3 components of Virchow’s triad that are (1) venous stasis, (2) vessel damage, and (3) hypercoagulable state.

Difficulty and confusion in the assessment of PE in a pregnant woman are due to the following:

¢ Normal physiological changes in pregnancy such as dyspnea, tachycardia, and leg swelling are also symptoms that PE can present with.

¢ Pre-test probability tests such as the Wells score, simplified Wells score (SWS), or revised Geneva score, cannot be applied to a pregnant woman
because pregnant women were excluded from the analysis group for criteria validation.

¢ The d-dimer will start to rise in the second trimester and remain elevated for 4-6 weeks post-partum; therefore, it is not a reliable test to use as a
screening tool.

If PE is suspected, it is important to make a definitive diagnosis, as management of PE in pregnancy needs to include the choice of anticoagulation,
mode of delivery, and consideration of prophylaxis in future pregnancies. There are debates as to optimal methods of the diagnostic workup for pregnant
women with suspected PE. For PE, we use the latest guidelines by The Royal Australian and New Zealand College of Radiologists as the most accurate
and reliable reference for the exam.

The sudden-onset chest pain and shortness of breath and previous history of DVT make PE a very likely diagnosis. If PE is suspected in a pregnant
woman, a chest radiograph (not an option) should be performed as the most appropriate initial step to exclude other causes of the symptoms such as
pneumonia, and to determine if a V/Q scan or CTPA should be performed as the diagnostic test for suspected PE. If the chest radiograph is clear, a VQ
scan using a lower dose technique is recommended because it is associated with a lower breast dose than CTPA and a comparably small dose to the
fetus.

(Option A) D-dimer levels become elevated in most patients after the first trimester. Normal values for each trimester have yet to be validated in a large
patient population to enable them to be used to screen for the possibility of pulmonary embolism during pregnancy in routine clinical practice. Therefore,
D dimer is generally not used to screen pregnant women for suspected PE, particularly during the second and third trimesters when it is physiologically
elevated.

(Option C) Ischemia is among differential diagnoses of chest pain. ECG may be considered to exclude cardiac causes of chest pain and look for ECG
changes favoring PE as a diagnosis. Given the sudden onset of chest pain and shortness of breath in an otherwise healthy young woman who has risk
factors for PE, ECG is not likely to be of significant benefit. The pleuretic nature of the pain, on the other hand, makes cardiac ischemia almost unlikely;
however, it may be considered in the initial work-up along with a chest radiograph. It is not a priority for this woman though.

(Option D) CTPA is associated with an increased risk of breast cancer in women of reproductive age and should be replaced with a V/Q scan in this
patient group if possible. An abnormal chest radiograph is the most common indication for CTPA instead of a V/Q scan.

(Option E) Lower limb venous ultrasound is negative in more than 90% of pregnant women with PE. Lower limb venous ultrasound is not recommended
as a first-line investigation unless there are clinical symptoms of DVT (e.g., unilateral leg swelling, and calf tenderness). This is due to the low lower limb
deep venous thrombosis rate in pregnant women with PE. Almost no V/Q scans or CTPAs would be avoided in pregnant women with possible PE by
performing ultrasound first because ultrasound is almost invariably negative in the absence of specific leg symptoms in favor of DVT. Therefore, the
reduction in radiation exposure to the population of women with possible PE and their fetuses that would result from an “ultrasound first” strategy is
negligible. However, a Doppler ultrasound is the most appropriate initial investigation for leg symptoms.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[66],"source_qid":null,"duplicate_group_id":"exact-47ff1882cdae","duplicate_sources":[{"record_id":"c5b95e416e753f0095ff","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":66,"source_qid":null},{"record_id":"26c5df67ae8f90ab6ff2","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":8,"source_qid":null},{"record_id":"ae313c075164ff917d1b","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1814,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"c5b95e416e753f0095ff","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":66,"supporting_pages":[66],"source_qid":null,"domain_hint":"Respiratory","stem":"A 28-year-old woman presents to the Emergency Department with sudden onset dyspnea and pleuretic chest pain. She is 18 weeks pregnant and has a\nprevious history of deep venous thrombosis (DVT). Which one of the following would be the most appropriate initial investigation in this patient leading to\na definite diagnosis?","options":{"A":"A. D-dimer assay.","B":"OB. Ventilation/perfusion scan.","C":"C. ECG.","D":"D. CTPA.","E":"E. Doppler ultrasound scan."},"source_answer":"B","source_explanation":"Investigation for pulmonary embolus (PE) in pregnancy is a complicated issue. PE is the leading cause of death in pregnancy in the developed world.\nPregnant women have all the 3 components of Virchow’s triad that are (1) venous stasis, (2) vessel damage, and (3) hypercoagulable state.\n\nDifficulty and confusion in the assessment of PE in a pregnant woman are due to the following:\n\n¢ Normal physiological changes in pregnancy such as dyspnea, tachycardia, and leg swelling are also symptoms that PE can present with.\n\n¢ Pre-test probability tests such as the Wells score, simplified Wells score (SWS), or revised Geneva score, cannot be applied to a pregnant woman\nbecause pregnant women were excluded from the analysis group for criteria validation.\n\n¢ The d-dimer will start to rise in the second trimester and remain elevated for 4-6 weeks post-partum; therefore, it is not a reliable test to use as a\nscreening tool.\n\nIf PE is suspected, it is important to make a definitive diagnosis, as management of PE in pregnancy needs to include the choice of anticoagulation,\nmode of delivery, and consideration of prophylaxis in future pregnancies. There are debates as to optimal methods of the diagnostic workup for pregnant\nwomen with suspected PE. For PE, we use the latest guidelines by The Royal Australian and New Zealand College of Radiologists as the most accurate\nand reliable reference for the exam.\n\nThe sudden-onset chest pain and shortness of breath and previous history of DVT make PE a very likely diagnosis. If PE is suspected in a pregnant\nwoman, a chest radiograph (not an option) should be performed as the most appropriate initial step to exclude other causes of the symptoms such as\npneumonia, and to determine if a V/Q scan or CTPA should be performed as the diagnostic test for suspected PE. If the chest radiograph is clear, a VQ\nscan using a lower dose technique is recommended because it is associated with a lower breast dose than CTPA and a comparably small dose to the\nfetus.\n\n(Option A) D-dimer levels become elevated in most patients after the first trimester. Normal values for each trimester have yet to be validated in a large\npatient population to enable them to be used to screen for the possibility of pulmonary embolism during pregnancy in routine clinical practice. Therefore,\nD dimer is generally not used to screen pregnant women for suspected PE, particularly during the second and third trimesters when it is physiologically\nelevated.\n\n(Option C) Ischemia is among differential diagnoses of chest pain. ECG may be considered to exclude cardiac causes of chest pain and look for ECG\nchanges favoring PE as a diagnosis. Given the sudden onset of chest pain and shortness of breath in an otherwise healthy young woman who has risk\nfactors for PE, ECG is not likely to be of significant benefit. The pleuretic nature of the pain, on the other hand, makes cardiac ischemia almost unlikely;\nhowever, it may be considered in the initial work-up along with a chest radiograph. It is not a priority for this woman though.\n\n(Option D) CTPA is associated with an increased risk of breast cancer in women of reproductive age and should be replaced with a V/Q scan in this\npatient group if possible. An abnormal chest radiograph is the most common indication for CTPA instead of a V/Q scan.\n\n(Option E) Lower limb venous ultrasound is negative in more than 90% of pregnant women with PE. Lower limb venous ultrasound is not recommended\nas a first-line investigation unless there are clinical symptoms of DVT (e.g., unilateral leg swelling, and calf tenderness). This is due to the low lower limb\ndeep venous thrombosis rate in pregnant women with PE. Almost no V/Q scans or CTPAs would be avoided in pregnant women with possible PE by\nperforming ultrasound first because ultrasound is almost invariably negative in the absence of specific leg symptoms in favor of DVT. Therefore, the\nreduction in radiation exposure to the population of women with possible PE and their fetuses that would result from an “ultrasound first” strategy is\nnegligible. However, a Doppler ultrasound is the most appropriate initial investigation for leg symptoms.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","anticoag","dose","guideline","management","pregnan","prophyl","screen","screening"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"47ff1882cdae70aad821944b2c5cef2e32fa4c10","duplicate_group_id":"exact-47ff1882cdae","duplicate_sources":[{"record_id":"c5b95e416e753f0095ff","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":66,"source_qid":null},{"record_id":"26c5df67ae8f90ab6ff2","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":8,"source_qid":null},{"record_id":"ae313c075164ff917d1b","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1814,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('c5b95e416e753f0095ff','src-v294-b0ec7cfe',NULL,'66','Respiratory','Respiratory','Respiratory','AMC MCQ','A 28-year-old woman presents to the Emergency Department with sudden onset dyspnea and pleuretic chest pain. She is 18 weeks pregnant and has a
previous history of deep venous thrombosis (DVT). Which one of the following would be the most appropriate initial investigation in this patient leading to
a definite diagnosis?',NULL,'B','Investigation for pulmonary embolus (PE) in pregnancy is a complicated issue. PE is the leading cause of death in pregnancy in the developed world.
Pregnant women have all the 3 components of Virchow’s triad that are (1) venous stasis, (2) vessel damage, and (3) hypercoagulable state.

Difficulty and confusion in the assessment of PE in a pregnant woman are due to the following:

¢ Normal physiological changes in pregnancy such as dyspnea, tachycardia, and leg swelling are also symptoms that PE can present with.

¢ Pre-test probability tests such as the Wells score, simplified Wells score (SWS), or revised Geneva score, cannot be applied to a pregnant woman
because pregnant women were excluded from the analysis group for criteria validation.

¢ The d-dimer will start to rise in the second trimester and remain elevated for 4-6 weeks post-partum; therefore, it is not a reliable test to use as a
screening tool.

If PE is suspected, it is important to make a definitive diagnosis, as management of PE in pregnancy needs to include the choice of anticoagulation,
mode of delivery, and consideration of prophylaxis in future pregnancies. There are debates as to optimal methods of the diagnostic workup for pregnant
women with suspected PE. For PE, we use the latest guidelines by The Royal Australian and New Zealand College of Radiologists as the most accurate
and reliable reference for the exam.

The sudden-onset chest pain and shortness of breath and previous history of DVT make PE a very likely diagnosis. If PE is suspected in a pregnant
woman, a chest radiograph (not an option) should be performed as the most appropriate initial step to exclude other causes of the symptoms such as
pneumonia, and to determine if a V/Q scan or CTPA should be performed as the diagnostic test for suspected PE. If the chest radiograph is clear, a VQ
scan using a lower dose technique is recommended because it is associated with a lower breast dose than CTPA and a comparably small dose to the
fetus.

(Option A) D-dimer levels become elevated in most patients after the first trimester. Normal values for each trimester have yet to be validated in a large
patient population to enable them to be used to screen for the possibility of pulmonary embolism during pregnancy in routine clinical practice. Therefore,
D dimer is generally not used to screen pregnant women for suspected PE, particularly during the second and third trimesters when it is physiologically
elevated.

(Option C) Ischemia is among differential diagnoses of chest pain. ECG may be considered to exclude cardiac causes of chest pain and look for ECG
changes favoring PE as a diagnosis. Given the sudden onset of chest pain and shortness of breath in an otherwise healthy young woman who has risk
factors for PE, ECG is not likely to be of significant benefit. The pleuretic nature of the pain, on the other hand, makes cardiac ischemia almost unlikely;
however, it may be considered in the initial work-up along with a chest radiograph. It is not a priority for this woman though.

(Option D) CTPA is associated with an increased risk of breast cancer in women of reproductive age and should be replaced with a V/Q scan in this
patient group if possible. An abnormal chest radiograph is the most common indication for CTPA instead of a V/Q scan.

(Option E) Lower limb venous ultrasound is negative in more than 90% of pregnant women with PE. Lower limb venous ultrasound is not recommended
as a first-line investigation unless there are clinical symptoms of DVT (e.g., unilateral leg swelling, and calf tenderness). This is due to the low lower limb
deep venous thrombosis rate in pregnant women with PE. Almost no V/Q scans or CTPAs would be avoided in pregnant women with possible PE by
performing ultrasound first because ultrasound is almost invariably negative in the absence of specific leg symptoms in favor of DVT. Therefore, the
reduction in radiation exposure to the population of women with possible PE and their fetuses that would result from an “ultrasound first” strategy is
negligible. However, a Doppler ultrasound is the most appropriate initial investigation for leg symptoms.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[66],"source_qid":null,"duplicate_group_id":"exact-47ff1882cdae","duplicate_sources":[{"record_id":"c5b95e416e753f0095ff","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":66,"source_qid":null},{"record_id":"26c5df67ae8f90ab6ff2","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":8,"source_qid":null},{"record_id":"ae313c075164ff917d1b","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1814,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('c5b95e416e753f0095ff','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='c5b95e416e753f0095ff';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c5b95e416e753f0095ff-A','c5b95e416e753f0095ff','A','A. D-dimer assay.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c5b95e416e753f0095ff-B','c5b95e416e753f0095ff','B','OB. Ventilation/perfusion scan.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c5b95e416e753f0095ff-C','c5b95e416e753f0095ff','C','C. ECG.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c5b95e416e753f0095ff-D','c5b95e416e753f0095ff','D','D. CTPA.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c5b95e416e753f0095ff-E','c5b95e416e753f0095ff','E','E. Doppler ultrasound scan.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('1382efe480176b633674','Respiratory and chest amedex 2025.pdf','67','Respiratory','Which of the following statements is correct regarding asthma in children?','{"A":"A. Inhaled bronchodilators are very effective under the age of 12 months.","B":"B. Oral bronchodilators are very effective under the age of 12 months.","C":"OC. Aspacer with face mask should be used for children aged between 1 to 2 years.","D":"D. Most of the children do not grow out of asthma when they become adults.","E":"E. Giving more than 6 inhaled doses of beta-2 agonist can be life-threatening in\nsevere asthma."}','C','For children aged 1-2 years (or even older) a spacer with face mask provides adequate
delivery of the inhaled drug and is a the preferred mode to deliver asthma medicine.

(Options A and B) Bronchodilators, inhaled or oral, are not very effective in children
younger than 12 months.

(Option D) Most of the children grow out of asthma in adulthood and very few continue to
be asthmatic adults.

(Option E) Giving 6 to 12 inhaled doses of beta-2 agonist is very safe and appropriate if
used in severe asthma.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[67],"source_qid":null,"duplicate_group_id":"exact-ec8b96421c06","duplicate_sources":[{"record_id":"1382efe480176b633674","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":67,"source_qid":null},{"record_id":"c5f4bdea10f0c7c8c328","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1764,"source_qid":"377"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"1382efe480176b633674","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":67,"supporting_pages":[67],"source_qid":null,"domain_hint":"Respiratory","stem":"Which of the following statements is correct regarding asthma in children?","options":{"A":"A. Inhaled bronchodilators are very effective under the age of 12 months.","B":"B. Oral bronchodilators are very effective under the age of 12 months.","C":"OC. Aspacer with face mask should be used for children aged between 1 to 2 years.","D":"D. Most of the children do not grow out of asthma when they become adults.","E":"E. Giving more than 6 inhaled doses of beta-2 agonist can be life-threatening in\nsevere asthma."},"source_answer":"C","source_explanation":"For children aged 1-2 years (or even older) a spacer with face mask provides adequate\ndelivery of the inhaled drug and is a the preferred mode to deliver asthma medicine.\n\n(Options A and B) Bronchodilators, inhaled or oral, are not very effective in children\nyounger than 12 months.\n\n(Option D) Most of the children grow out of asthma in adulthood and very few continue to\nbe asthmatic adults.\n\n(Option E) Giving 6 to 12 inhaled doses of beta-2 agonist is very safe and appropriate if\nused in severe asthma.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","asthma","dose","drug"],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"ec8b96421c065df0d9463b52111254d84fb7fac7","duplicate_group_id":"exact-ec8b96421c06","duplicate_sources":[{"record_id":"1382efe480176b633674","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":67,"source_qid":null},{"record_id":"c5f4bdea10f0c7c8c328","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1764,"source_qid":"377"}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('1382efe480176b633674','src-v294-b0ec7cfe',NULL,'67','Respiratory','Respiratory','Respiratory','AMC MCQ','Which of the following statements is correct regarding asthma in children?',NULL,'C','For children aged 1-2 years (or even older) a spacer with face mask provides adequate
delivery of the inhaled drug and is a the preferred mode to deliver asthma medicine.

(Options A and B) Bronchodilators, inhaled or oral, are not very effective in children
younger than 12 months.

(Option D) Most of the children grow out of asthma in adulthood and very few continue to
be asthmatic adults.

(Option E) Giving 6 to 12 inhaled doses of beta-2 agonist is very safe and appropriate if
used in severe asthma.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[67],"source_qid":null,"duplicate_group_id":"exact-ec8b96421c06","duplicate_sources":[{"record_id":"1382efe480176b633674","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":67,"source_qid":null},{"record_id":"c5f4bdea10f0c7c8c328","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1764,"source_qid":"377"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('1382efe480176b633674','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='1382efe480176b633674';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('1382efe480176b633674-A','1382efe480176b633674','A','A. Inhaled bronchodilators are very effective under the age of 12 months.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('1382efe480176b633674-B','1382efe480176b633674','B','B. Oral bronchodilators are very effective under the age of 12 months.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('1382efe480176b633674-C','1382efe480176b633674','C','OC. Aspacer with face mask should be used for children aged between 1 to 2 years.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('1382efe480176b633674-D','1382efe480176b633674','D','D. Most of the children do not grow out of asthma when they become adults.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('1382efe480176b633674-E','1382efe480176b633674','E','E. Giving more than 6 inhaled doses of beta-2 agonist can be life-threatening in
severe asthma.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('249120baf3816497102e','Respiratory and chest amedex 2025.pdf','68','Respiratory','Peta, aged 3 years, is brought to the Emergency Department with an acute attack of
asthma. She is initially treated with salbutamol inhaler through spacer and mask and
oxygen by face mask. She improves symptomatically, but becomes breathless and
wheezy again after 90 minutes. Which one of the following would be the most appropriate
next step in management?','{"A":"A. Double the dose of salbutamol.","B":"OB. Repeat salbutamol and commence oral corticosteroids.","C":"C. Assess the severity of the asthma with spirometry.","D":"D. Measure oxygen saturation to determine the need for hospitalization.","E":"E. Start her on in intravenous aminophylline."}','B','Peta initially responded to short-acting beta 2 agonists (salbutamol), but has deteriorated
after 90 minutes. The best initial course of action would be repeating salbutamol to treat
the current symptoms as well as early commencement of systemic corticosteroids to
prevent further attacks. Every dose of short-acting beta 2 agonists is up to 12 puffs for
those 6 years or older and up to 6 puffs for children 0-5 years. Exceeding the safe limits by
doubling the dose (option A) is not propriate

Assessment of the severity of the attack, O2 saturation (option D) and the need for
hospitalization are components of the management plan, but not the first priority.
spirometry (option C) in the acute setting is not a reliable indicator of severity.

Intravenous aminophylline (option E) may be rarely indicated for patients with severe
asthma attack and no or inadequate response to other measures.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[68],"source_qid":null,"duplicate_group_id":"exact-de128a993ec6","duplicate_sources":[{"record_id":"249120baf3816497102e","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":68,"source_qid":null},{"record_id":"cf12b4b0432d892f4ce6","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1865,"source_qid":"358"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"249120baf3816497102e","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":68,"supporting_pages":[68],"source_qid":null,"domain_hint":"Respiratory","stem":"Peta, aged 3 years, is brought to the Emergency Department with an acute attack of\nasthma. She is initially treated with salbutamol inhaler through spacer and mask and\noxygen by face mask. She improves symptomatically, but becomes breathless and\nwheezy again after 90 minutes. Which one of the following would be the most appropriate\nnext step in management?","options":{"A":"A. Double the dose of salbutamol.","B":"OB. Repeat salbutamol and commence oral corticosteroids.","C":"C. Assess the severity of the asthma with spirometry.","D":"D. Measure oxygen saturation to determine the need for hospitalization.","E":"E. Start her on in intravenous aminophylline."},"source_answer":"B","source_explanation":"Peta initially responded to short-acting beta 2 agonists (salbutamol), but has deteriorated\nafter 90 minutes. The best initial course of action would be repeating salbutamol to treat\nthe current symptoms as well as early commencement of systemic corticosteroids to\nprevent further attacks. Every dose of short-acting beta 2 agonists is up to 12 puffs for\nthose 6 years or older and up to 6 puffs for children 0-5 years. Exceeding the safe limits by\ndoubling the dose (option A) is not propriate\n\nAssessment of the severity of the attack, O2 saturation (option D) and the need for\nhospitalization are components of the management plan, but not the first priority.\nspirometry (option C) in the acute setting is not a reliable indicator of severity.\n\nIntravenous aminophylline (option E) may be rarely indicated for patients with severe\nasthma attack and no or inadequate response to other measures.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","asthma","dose","management"],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"de128a993ec690dc41ca1c1a6b156aecebadc0da","duplicate_group_id":"exact-de128a993ec6","duplicate_sources":[{"record_id":"249120baf3816497102e","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":68,"source_qid":null},{"record_id":"cf12b4b0432d892f4ce6","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1865,"source_qid":"358"}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('249120baf3816497102e','src-v294-b0ec7cfe',NULL,'68','Respiratory','Respiratory','Respiratory','AMC MCQ','Peta, aged 3 years, is brought to the Emergency Department with an acute attack of
asthma. She is initially treated with salbutamol inhaler through spacer and mask and
oxygen by face mask. She improves symptomatically, but becomes breathless and
wheezy again after 90 minutes. Which one of the following would be the most appropriate
next step in management?',NULL,'B','Peta initially responded to short-acting beta 2 agonists (salbutamol), but has deteriorated
after 90 minutes. The best initial course of action would be repeating salbutamol to treat
the current symptoms as well as early commencement of systemic corticosteroids to
prevent further attacks. Every dose of short-acting beta 2 agonists is up to 12 puffs for
those 6 years or older and up to 6 puffs for children 0-5 years. Exceeding the safe limits by
doubling the dose (option A) is not propriate

Assessment of the severity of the attack, O2 saturation (option D) and the need for
hospitalization are components of the management plan, but not the first priority.
spirometry (option C) in the acute setting is not a reliable indicator of severity.

Intravenous aminophylline (option E) may be rarely indicated for patients with severe
asthma attack and no or inadequate response to other measures.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[68],"source_qid":null,"duplicate_group_id":"exact-de128a993ec6","duplicate_sources":[{"record_id":"249120baf3816497102e","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":68,"source_qid":null},{"record_id":"cf12b4b0432d892f4ce6","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1865,"source_qid":"358"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('249120baf3816497102e','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='249120baf3816497102e';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('249120baf3816497102e-A','249120baf3816497102e','A','A. Double the dose of salbutamol.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('249120baf3816497102e-B','249120baf3816497102e','B','OB. Repeat salbutamol and commence oral corticosteroids.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('249120baf3816497102e-C','249120baf3816497102e','C','C. Assess the severity of the asthma with spirometry.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('249120baf3816497102e-D','249120baf3816497102e','D','D. Measure oxygen saturation to determine the need for hospitalization.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('249120baf3816497102e-E','249120baf3816497102e','E','E. Start her on in intravenous aminophylline.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('8c83be8c003e1106a134','Respiratory and chest amedex 2025.pdf','69','Respiratory','A 71-year-old man, known case of COPD for the past 8 years, is brought to the emergency department
by ambulance due to severe difficulty in breathing. On the way to the hospital, he is given oxygen 100%
by nasal cannula. Upon arrival to the emergency department, his oxygen saturation is 81% and his
shortness of breath is even worse, according to the paramedics. Which one of the following would be the
next best step in management?','{"A":"A. Intubation.","B":"B. Cessation of oxygen.","C":"C. Increasing the oxygen flow.","D":"OD. Decreasing the oxygen flow.","E":"E. Starting the patient on bronchodilators."}','D','COPD patients has type II respiratory failure, which by definition is hypoxia (PaO2<6O0mmbHg (8.0 kPa))
and hypercapnia (PaCO2> 50mmbHg (6.6 kPa)). Under normal condition, both decrease in PaO2 and
increase PaCO2 stimulate respiratory centers in the brainstem and increase the respiratory drive as a
compensatory mechanism, but in chronic type II respiratory failure, such as in COPD, sustained exposure
to high levels of PaCO2, desensitizes respiratory centers to elevated concentrations of CO2 in the blood.
Administration of high-concentration oxygen to these patients decreases the respiratory drive and results
in more hypercapnia, dyspnea, paradoxically decreased oxygen saturation and respiratory acidosis.

In such patients with deteriorating PaO2 and oxygen saturation despite being on oxygen the next best
step in management is to reduce the delivery of oxygen, provided that the patient is not at risk of
imminent respiratory arrest or severe acidemia (PH<7.3) in which immediate case assisted ventilation
should be considered.

If patient remains hypoxemic despite adequate controlled oxygen delivery (e.g. by Venturi mask) assisted
ventilation such as CPAP or intubation (option A) and mechanical ventilation should be considered next.

Both increasing the oxygen flow (option C) and cessation of oxygen (option B) will increase the
hypoxemia deteriorate the patient’s condition as the first decreases the respiratory drive even more while
the second deprives him of oxygen.

(Option E) While the respiratory drive is suppressed, administration of bronchodilators is not likely to be
beneficial for this patient.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[69],"source_qid":null,"duplicate_group_id":"exact-018c363caad3","duplicate_sources":[{"record_id":"8c83be8c003e1106a134","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":69,"source_qid":null},{"record_id":"b498e30b4fd854b01582","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1781,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','medium','{"record_id":"8c83be8c003e1106a134","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":69,"supporting_pages":[69],"source_qid":null,"domain_hint":"Respiratory","stem":"A 71-year-old man, known case of COPD for the past 8 years, is brought to the emergency department\nby ambulance due to severe difficulty in breathing. On the way to the hospital, he is given oxygen 100%\nby nasal cannula. Upon arrival to the emergency department, his oxygen saturation is 81% and his\nshortness of breath is even worse, according to the paramedics. Which one of the following would be the\nnext best step in management?","options":{"A":"A. Intubation.","B":"B. Cessation of oxygen.","C":"C. Increasing the oxygen flow.","D":"OD. Decreasing the oxygen flow.","E":"E. Starting the patient on bronchodilators."},"source_answer":"D","source_explanation":"COPD patients has type II respiratory failure, which by definition is hypoxia (PaO2<6O0mmbHg (8.0 kPa))\nand hypercapnia (PaCO2> 50mmbHg (6.6 kPa)). Under normal condition, both decrease in PaO2 and\nincrease PaCO2 stimulate respiratory centers in the brainstem and increase the respiratory drive as a\ncompensatory mechanism, but in chronic type II respiratory failure, such as in COPD, sustained exposure\nto high levels of PaCO2, desensitizes respiratory centers to elevated concentrations of CO2 in the blood.\nAdministration of high-concentration oxygen to these patients decreases the respiratory drive and results\nin more hypercapnia, dyspnea, paradoxically decreased oxygen saturation and respiratory acidosis.\n\nIn such patients with deteriorating PaO2 and oxygen saturation despite being on oxygen the next best\nstep in management is to reduce the delivery of oxygen, provided that the patient is not at risk of\nimminent respiratory arrest or severe acidemia (PH<7.3) in which immediate case assisted ventilation\nshould be considered.\n\nIf patient remains hypoxemic despite adequate controlled oxygen delivery (e.g. by Venturi mask) assisted\nventilation such as CPAP or intubation (option A) and mechanical ventilation should be considered next.\n\nBoth increasing the oxygen flow (option C) and cessation of oxygen (option B) will increase the\nhypoxemia deteriorate the patient’s condition as the first decreases the respiratory drive even more while\nthe second deprives him of oxygen.\n\n(Option E) While the respiratory drive is suppressed, administration of bronchodilators is not likely to be\nbeneficial for this patient.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"medium","currentness_keywords":["age","management"],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"018c363caad3c9fc104f72d876c9d7e8e671a396","duplicate_group_id":"exact-018c363caad3","duplicate_sources":[{"record_id":"8c83be8c003e1106a134","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":69,"source_qid":null},{"record_id":"b498e30b4fd854b01582","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1781,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('8c83be8c003e1106a134','src-v294-b0ec7cfe',NULL,'69','Respiratory','Respiratory','Respiratory','AMC MCQ','A 71-year-old man, known case of COPD for the past 8 years, is brought to the emergency department
by ambulance due to severe difficulty in breathing. On the way to the hospital, he is given oxygen 100%
by nasal cannula. Upon arrival to the emergency department, his oxygen saturation is 81% and his
shortness of breath is even worse, according to the paramedics. Which one of the following would be the
next best step in management?',NULL,'D','COPD patients has type II respiratory failure, which by definition is hypoxia (PaO2<6O0mmbHg (8.0 kPa))
and hypercapnia (PaCO2> 50mmbHg (6.6 kPa)). Under normal condition, both decrease in PaO2 and
increase PaCO2 stimulate respiratory centers in the brainstem and increase the respiratory drive as a
compensatory mechanism, but in chronic type II respiratory failure, such as in COPD, sustained exposure
to high levels of PaCO2, desensitizes respiratory centers to elevated concentrations of CO2 in the blood.
Administration of high-concentration oxygen to these patients decreases the respiratory drive and results
in more hypercapnia, dyspnea, paradoxically decreased oxygen saturation and respiratory acidosis.

In such patients with deteriorating PaO2 and oxygen saturation despite being on oxygen the next best
step in management is to reduce the delivery of oxygen, provided that the patient is not at risk of
imminent respiratory arrest or severe acidemia (PH<7.3) in which immediate case assisted ventilation
should be considered.

If patient remains hypoxemic despite adequate controlled oxygen delivery (e.g. by Venturi mask) assisted
ventilation such as CPAP or intubation (option A) and mechanical ventilation should be considered next.

Both increasing the oxygen flow (option C) and cessation of oxygen (option B) will increase the
hypoxemia deteriorate the patient’s condition as the first decreases the respiratory drive even more while
the second deprives him of oxygen.

(Option E) While the respiratory drive is suppressed, administration of bronchodilators is not likely to be
beneficial for this patient.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[69],"source_qid":null,"duplicate_group_id":"exact-018c363caad3","duplicate_sources":[{"record_id":"8c83be8c003e1106a134","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":69,"source_qid":null},{"record_id":"b498e30b4fd854b01582","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1781,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','medium') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('8c83be8c003e1106a134','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='8c83be8c003e1106a134';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('8c83be8c003e1106a134-A','8c83be8c003e1106a134','A','A. Intubation.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('8c83be8c003e1106a134-B','8c83be8c003e1106a134','B','B. Cessation of oxygen.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('8c83be8c003e1106a134-C','8c83be8c003e1106a134','C','C. Increasing the oxygen flow.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('8c83be8c003e1106a134-D','8c83be8c003e1106a134','D','OD. Decreasing the oxygen flow.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('8c83be8c003e1106a134-E','8c83be8c003e1106a134','E','E. Starting the patient on bronchodilators.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('198911b9754889874541','Respiratory and chest amedex 2025.pdf','70','Respiratory','A 55-year-old man presents with complains of dry cough and Hemoptysis. He had
worked in a gold mine for 15 years and in a petrol station for another 9 years.
Physical examination is inconclusive. A chest X-ray is obtained that is remarkable for
a 2x 3cm opacity in the right lung field. Which one of the following would be the
next best step in management?','{"A":"A. Bronchoscopy.","B":"OB. Computed tomogram (CT) of the chest.","C":"C. Fine needle aspiration.","D":"D. Ultrasonography.","E":"E. Chemotherapy."}','B','Considering the age and the history of working in gold mine and petrol station, this
man has bronchogenic cancer until proven otherwise. For every patient with
suspected pulmonary pathology, chest X-ray is always the best initial diagnostic tool.
With an opacity in the right lung field, two more steps would be ahead: (1) spiral CT
scan of the chest to further visualize the lesion and its extend, and (probably) (2)
sputum cytology. Once the lesion is confirmed on the spiral CT, referral specialist for
bronchoscopy or open lung biopsy is the most appropriate step.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[70],"source_qid":null,"duplicate_group_id":"exact-c9cc2c158fce","duplicate_sources":[{"record_id":"198911b9754889874541","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":70,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','medium','{"record_id":"198911b9754889874541","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":70,"supporting_pages":[70],"source_qid":null,"domain_hint":"Respiratory","stem":"A 55-year-old man presents with complains of dry cough and Hemoptysis. He had\nworked in a gold mine for 15 years and in a petrol station for another 9 years.\nPhysical examination is inconclusive. A chest X-ray is obtained that is remarkable for\na 2x 3cm opacity in the right lung field. Which one of the following would be the\nnext best step in management?","options":{"A":"A. Bronchoscopy.","B":"OB. Computed tomogram (CT) of the chest.","C":"C. Fine needle aspiration.","D":"D. Ultrasonography.","E":"E. Chemotherapy."},"source_answer":"B","source_explanation":"Considering the age and the history of working in gold mine and petrol station, this\nman has bronchogenic cancer until proven otherwise. For every patient with\nsuspected pulmonary pathology, chest X-ray is always the best initial diagnostic tool.\nWith an opacity in the right lung field, two more steps would be ahead: (1) spiral CT\nscan of the chest to further visualize the lesion and its extend, and (probably) (2)\nsputum cytology. Once the lesion is confirmed on the spiral CT, referral specialist for\nbronchoscopy or open lung biopsy is the most appropriate step.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"medium","currentness_keywords":["age","management"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"c9cc2c158fce18061e93b36106c9251906279e3a","duplicate_group_id":"exact-c9cc2c158fce","duplicate_sources":[{"record_id":"198911b9754889874541","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":70,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('198911b9754889874541','src-v294-b0ec7cfe',NULL,'70','Respiratory','Respiratory','Respiratory','AMC MCQ','A 55-year-old man presents with complains of dry cough and Hemoptysis. He had
worked in a gold mine for 15 years and in a petrol station for another 9 years.
Physical examination is inconclusive. A chest X-ray is obtained that is remarkable for
a 2x 3cm opacity in the right lung field. Which one of the following would be the
next best step in management?',NULL,'B','Considering the age and the history of working in gold mine and petrol station, this
man has bronchogenic cancer until proven otherwise. For every patient with
suspected pulmonary pathology, chest X-ray is always the best initial diagnostic tool.
With an opacity in the right lung field, two more steps would be ahead: (1) spiral CT
scan of the chest to further visualize the lesion and its extend, and (probably) (2)
sputum cytology. Once the lesion is confirmed on the spiral CT, referral specialist for
bronchoscopy or open lung biopsy is the most appropriate step.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[70],"source_qid":null,"duplicate_group_id":"exact-c9cc2c158fce","duplicate_sources":[{"record_id":"198911b9754889874541","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":70,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','medium') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('198911b9754889874541','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='198911b9754889874541';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('198911b9754889874541-A','198911b9754889874541','A','A. Bronchoscopy.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('198911b9754889874541-B','198911b9754889874541','B','OB. Computed tomogram (CT) of the chest.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('198911b9754889874541-C','198911b9754889874541','C','C. Fine needle aspiration.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('198911b9754889874541-D','198911b9754889874541','D','D. Ultrasonography.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('198911b9754889874541-E','198911b9754889874541','E','E. Chemotherapy.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('d446498fc9e4cfd80747','Respiratory and chest amedex 2025.pdf','71','Respiratory','A 10-year-old male child is brought in by his mother with a complaint of ongoing exercise-induced
asthma despite being on the maximum dose of inhaled corticosteroids. Which one of the following
is the most appropriate next step in management?','{"A":"A. Refer to respiratory physician.","B":"OB. Add leukotriene receptor antagonists.","C":"C. Cease inhaled corticosteroids and systemic steroids.","D":"D. Add long-acting B2 agonists.","E":"E. Add short-acting B2 agonists."}','B','A Short-acting Beta agonist inhaler (SABA) (reliever) is almost always the first step in managing
mild asthma in children (and adults). If adequate control is not achieved, a preventer (inhaled
corticosteroid or a trial of montelukast) is recommended. Maintaining asthma control on the
lowest effective dose of an inhaled corticosteroid (ICS) is important.

This child has asthma control on ICS but has symptoms induced by exercise. For him,
recommending a short-acting beta agonist (reliever) 20 minutes before the anticipated exercise
will be the most appropriate advice.

Referral to a specialist (option A) may be required if adequate control cannot be achieved.

Long-acting beta-agonists (_LABA) (option D) are combined with ICS as preventers if low-dose
ICS fails to yield adequate symptom control. Their use should be very judicious as they may
blunt the therapeutic response of SABA in the event of exacerbations.

Leukotriene receptor antagonists (option B) such as montelukast are sometimes tried preventers
before the commencement of low-dose ICS as an attempt to avoid the use of ICS.

Systemic steroids (option C) are used in acute asthma exacerbation management. It is
recommended that children should be started on oral steroids within one hour of presentation and
continue for three days. Systemic steroids are not helpful in the management of exercise-induced
asthma.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[71],"source_qid":null,"duplicate_group_id":"exact-30b6ec3a0ec8","duplicate_sources":[{"record_id":"d446498fc9e4cfd80747","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":71,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"d446498fc9e4cfd80747","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":71,"supporting_pages":[71],"source_qid":null,"domain_hint":"Respiratory","stem":"A 10-year-old male child is brought in by his mother with a complaint of ongoing exercise-induced\nasthma despite being on the maximum dose of inhaled corticosteroids. Which one of the following\nis the most appropriate next step in management?","options":{"A":"A. Refer to respiratory physician.","B":"OB. Add leukotriene receptor antagonists.","C":"C. Cease inhaled corticosteroids and systemic steroids.","D":"D. Add long-acting B2 agonists.","E":"E. Add short-acting B2 agonists."},"source_answer":"B","source_explanation":"A Short-acting Beta agonist inhaler (SABA) (reliever) is almost always the first step in managing\nmild asthma in children (and adults). If adequate control is not achieved, a preventer (inhaled\ncorticosteroid or a trial of montelukast) is recommended. Maintaining asthma control on the\nlowest effective dose of an inhaled corticosteroid (ICS) is important.\n\nThis child has asthma control on ICS but has symptoms induced by exercise. For him,\nrecommending a short-acting beta agonist (reliever) 20 minutes before the anticipated exercise\nwill be the most appropriate advice.\n\nReferral to a specialist (option A) may be required if adequate control cannot be achieved.\n\nLong-acting beta-agonists (_LABA) (option D) are combined with ICS as preventers if low-dose\nICS fails to yield adequate symptom control. Their use should be very judicious as they may\nblunt the therapeutic response of SABA in the event of exacerbations.\n\nLeukotriene receptor antagonists (option B) such as montelukast are sometimes tried preventers\nbefore the commencement of low-dose ICS as an attempt to avoid the use of ICS.\n\nSystemic steroids (option C) are used in acute asthma exacerbation management. It is\nrecommended that children should be started on oral steroids within one hour of presentation and\ncontinue for three days. Systemic steroids are not helpful in the management of exercise-induced\nasthma.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","asthma","dose","management"],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"30b6ec3a0ec8f8f85f59c1ebbd6d73d153e97f59","duplicate_group_id":"exact-30b6ec3a0ec8","duplicate_sources":[{"record_id":"d446498fc9e4cfd80747","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":71,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('d446498fc9e4cfd80747','src-v294-b0ec7cfe',NULL,'71','Respiratory','Respiratory','Respiratory','AMC MCQ','A 10-year-old male child is brought in by his mother with a complaint of ongoing exercise-induced
asthma despite being on the maximum dose of inhaled corticosteroids. Which one of the following
is the most appropriate next step in management?',NULL,'B','A Short-acting Beta agonist inhaler (SABA) (reliever) is almost always the first step in managing
mild asthma in children (and adults). If adequate control is not achieved, a preventer (inhaled
corticosteroid or a trial of montelukast) is recommended. Maintaining asthma control on the
lowest effective dose of an inhaled corticosteroid (ICS) is important.

This child has asthma control on ICS but has symptoms induced by exercise. For him,
recommending a short-acting beta agonist (reliever) 20 minutes before the anticipated exercise
will be the most appropriate advice.

Referral to a specialist (option A) may be required if adequate control cannot be achieved.

Long-acting beta-agonists (_LABA) (option D) are combined with ICS as preventers if low-dose
ICS fails to yield adequate symptom control. Their use should be very judicious as they may
blunt the therapeutic response of SABA in the event of exacerbations.

Leukotriene receptor antagonists (option B) such as montelukast are sometimes tried preventers
before the commencement of low-dose ICS as an attempt to avoid the use of ICS.

Systemic steroids (option C) are used in acute asthma exacerbation management. It is
recommended that children should be started on oral steroids within one hour of presentation and
continue for three days. Systemic steroids are not helpful in the management of exercise-induced
asthma.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[71],"source_qid":null,"duplicate_group_id":"exact-30b6ec3a0ec8","duplicate_sources":[{"record_id":"d446498fc9e4cfd80747","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":71,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('d446498fc9e4cfd80747','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='d446498fc9e4cfd80747';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('d446498fc9e4cfd80747-A','d446498fc9e4cfd80747','A','A. Refer to respiratory physician.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('d446498fc9e4cfd80747-B','d446498fc9e4cfd80747','B','OB. Add leukotriene receptor antagonists.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('d446498fc9e4cfd80747-C','d446498fc9e4cfd80747','C','C. Cease inhaled corticosteroids and systemic steroids.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('d446498fc9e4cfd80747-D','d446498fc9e4cfd80747','D','D. Add long-acting B2 agonists.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('d446498fc9e4cfd80747-E','d446498fc9e4cfd80747','E','E. Add short-acting B2 agonists.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('9390daaf5148ae36fe3b','Respiratory and chest amedex 2025.pdf','72','Respiratory','A 27-year-old woman presents to your clinic with a fever and cough since yesterday. On examination, she looks ill
and unwell. Her blood pressure is 110/70 mmHg, pulse rate 110 bpm, respiratory rate 22 breaths per minute and
temperature 38.7°C. Pulse oximetry shows oxygen saturation of 89% while on room air. Which one of the
following is the next best step in management?','{"A":"A. Continuous positive airway pressure (CPAP).","B":"B. 60% Oxygen through nasal prongs.","C":"OC. 100 % Oxygen through Hudson’s mask.","D":"D. Oxygen through Venturi mask — 28%.","E":"E. Intubation and ventilation."}','C','This patient has clinical features of pneumonia. With an oxygen saturation of 89% (less than 90%), she should be
considered hypoxemic until ABG results are available.

Patients with acute severe respiratory illnesses such as acute asthma, pneumonia, lung cancer, pulmonary
embolism, pleural effusion, and pneumothorax require moderate levels of supplemental oxygen. If the patient is
hypoxemic on pulse oximetry (oxygen saturation less than 90%). This may be 100% oxygen by nasal cannulae at
2 to 6 L/minute or a simple face mask at 5 to 10 L/min initially, but if the oxygen saturation is less than 85%. The
patient is not at risk of hypercapnic respiratory failure; treatment should be commenced with 100% oxygen
through a reservoir mask at 10 to 15 L/min. Mechanical ventilation such as CPAP and intubation and ventilation
are considered if the patient fails to maintain the target O2 saturation despite adequate oxygen supplementation
with other delivery systems such as nasal cannulae, simple face masks, reservoir masks or no-rebreather masks.

Oxygen through a Venturi mask is a first-line option for patients at risk of developing hypercapnic respiratory
failure (type Il). These patients include the following:

. Known cases of chronic obstructive pulmonary disease or bronchiectasis

. Severe kyphoscoliosis or ankylosing spondylitis

A known history of heavy smoking

. Severe obstructive sleep apnoea

. Morbid obesity (BMI more than 40 kg/m2)

. Musculoskeletal disorders with respiratory muscle weakness, especially if on home ventilation
. Overdose of opioids, benzodiazepines or other respiratory depressant drugs.

NOOR WD =

NOTE - ‘Hudson mask’ is a confusing name. ‘Hudson RCI’ is the manufacturer and produces a variety of
oxygen delivery devices, including nasal prongs, simple face masks, reservoir face masks and non-rebreather
masks, but historically, the Hudson mask is the inappropriate equivalent of simple face masks.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[72],"source_qid":null,"duplicate_group_id":"exact-697ee68a96ef","duplicate_sources":[{"record_id":"9390daaf5148ae36fe3b","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":72,"source_qid":null},{"record_id":"e3289dd2b1dd02b68bdb","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":12,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"9390daaf5148ae36fe3b","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":72,"supporting_pages":[72],"source_qid":null,"domain_hint":"Respiratory","stem":"A 27-year-old woman presents to your clinic with a fever and cough since yesterday. On examination, she looks ill\nand unwell. Her blood pressure is 110/70 mmHg, pulse rate 110 bpm, respiratory rate 22 breaths per minute and\ntemperature 38.7°C. Pulse oximetry shows oxygen saturation of 89% while on room air. Which one of the\nfollowing is the next best step in management?","options":{"A":"A. Continuous positive airway pressure (CPAP).","B":"B. 60% Oxygen through nasal prongs.","C":"OC. 100 % Oxygen through Hudson’s mask.","D":"D. Oxygen through Venturi mask — 28%.","E":"E. Intubation and ventilation."},"source_answer":"C","source_explanation":"This patient has clinical features of pneumonia. With an oxygen saturation of 89% (less than 90%), she should be\nconsidered hypoxemic until ABG results are available.\n\nPatients with acute severe respiratory illnesses such as acute asthma, pneumonia, lung cancer, pulmonary\nembolism, pleural effusion, and pneumothorax require moderate levels of supplemental oxygen. If the patient is\nhypoxemic on pulse oximetry (oxygen saturation less than 90%). This may be 100% oxygen by nasal cannulae at\n2 to 6 L/minute or a simple face mask at 5 to 10 L/min initially, but if the oxygen saturation is less than 85%. The\npatient is not at risk of hypercapnic respiratory failure; treatment should be commenced with 100% oxygen\nthrough a reservoir mask at 10 to 15 L/min. Mechanical ventilation such as CPAP and intubation and ventilation\nare considered if the patient fails to maintain the target O2 saturation despite adequate oxygen supplementation\nwith other delivery systems such as nasal cannulae, simple face masks, reservoir masks or no-rebreather masks.\n\nOxygen through a Venturi mask is a first-line option for patients at risk of developing hypercapnic respiratory\nfailure (type Il). These patients include the following:\n\n. Known cases of chronic obstructive pulmonary disease or bronchiectasis\n\n. Severe kyphoscoliosis or ankylosing spondylitis\n\nA known history of heavy smoking\n\n. Severe obstructive sleep apnoea\n\n. Morbid obesity (BMI more than 40 kg/m2)\n\n. Musculoskeletal disorders with respiratory muscle weakness, especially if on home ventilation\n. Overdose of opioids, benzodiazepines or other respiratory depressant drugs.\n\nNOOR WD =\n\nNOTE - ‘Hudson mask’ is a confusing name. ‘Hudson RCI’ is the manufacturer and produces a variety of\noxygen delivery devices, including nasal prongs, simple face masks, reservoir face masks and non-rebreather\nmasks, but historically, the Hudson mask is the inappropriate equivalent of simple face masks.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","asthma","dose","drug","management","treatment"],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"697ee68a96ef7bead24881883a2bd46a3708379b","duplicate_group_id":"exact-697ee68a96ef","duplicate_sources":[{"record_id":"9390daaf5148ae36fe3b","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":72,"source_qid":null},{"record_id":"e3289dd2b1dd02b68bdb","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":12,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('9390daaf5148ae36fe3b','src-v294-b0ec7cfe',NULL,'72','Respiratory','Respiratory','Respiratory','AMC MCQ','A 27-year-old woman presents to your clinic with a fever and cough since yesterday. On examination, she looks ill
and unwell. Her blood pressure is 110/70 mmHg, pulse rate 110 bpm, respiratory rate 22 breaths per minute and
temperature 38.7°C. Pulse oximetry shows oxygen saturation of 89% while on room air. Which one of the
following is the next best step in management?',NULL,'C','This patient has clinical features of pneumonia. With an oxygen saturation of 89% (less than 90%), she should be
considered hypoxemic until ABG results are available.

Patients with acute severe respiratory illnesses such as acute asthma, pneumonia, lung cancer, pulmonary
embolism, pleural effusion, and pneumothorax require moderate levels of supplemental oxygen. If the patient is
hypoxemic on pulse oximetry (oxygen saturation less than 90%). This may be 100% oxygen by nasal cannulae at
2 to 6 L/minute or a simple face mask at 5 to 10 L/min initially, but if the oxygen saturation is less than 85%. The
patient is not at risk of hypercapnic respiratory failure; treatment should be commenced with 100% oxygen
through a reservoir mask at 10 to 15 L/min. Mechanical ventilation such as CPAP and intubation and ventilation
are considered if the patient fails to maintain the target O2 saturation despite adequate oxygen supplementation
with other delivery systems such as nasal cannulae, simple face masks, reservoir masks or no-rebreather masks.

Oxygen through a Venturi mask is a first-line option for patients at risk of developing hypercapnic respiratory
failure (type Il). These patients include the following:

. Known cases of chronic obstructive pulmonary disease or bronchiectasis

. Severe kyphoscoliosis or ankylosing spondylitis

A known history of heavy smoking

. Severe obstructive sleep apnoea

. Morbid obesity (BMI more than 40 kg/m2)

. Musculoskeletal disorders with respiratory muscle weakness, especially if on home ventilation
. Overdose of opioids, benzodiazepines or other respiratory depressant drugs.

NOOR WD =

NOTE - ‘Hudson mask’ is a confusing name. ‘Hudson RCI’ is the manufacturer and produces a variety of
oxygen delivery devices, including nasal prongs, simple face masks, reservoir face masks and non-rebreather
masks, but historically, the Hudson mask is the inappropriate equivalent of simple face masks.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[72],"source_qid":null,"duplicate_group_id":"exact-697ee68a96ef","duplicate_sources":[{"record_id":"9390daaf5148ae36fe3b","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":72,"source_qid":null},{"record_id":"e3289dd2b1dd02b68bdb","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (2).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (2).pdf","source_page":12,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('9390daaf5148ae36fe3b','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='9390daaf5148ae36fe3b';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('9390daaf5148ae36fe3b-A','9390daaf5148ae36fe3b','A','A. Continuous positive airway pressure (CPAP).',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('9390daaf5148ae36fe3b-B','9390daaf5148ae36fe3b','B','B. 60% Oxygen through nasal prongs.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('9390daaf5148ae36fe3b-C','9390daaf5148ae36fe3b','C','OC. 100 % Oxygen through Hudson’s mask.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('9390daaf5148ae36fe3b-D','9390daaf5148ae36fe3b','D','D. Oxygen through Venturi mask — 28%.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('9390daaf5148ae36fe3b-E','9390daaf5148ae36fe3b','E','E. Intubation and ventilation.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('533e483f09ea2fc07f36','Respiratory and chest amedex 2025.pdf','73','Respiratory','A 40-year-old woman presents to the Emergency Department with sudden-onset chest pain, dyspnea,
and a fever of 39°C. She arrived from Canada to Sydney 2 days ago by air. Which of the following would
be the most appropriate next step in management?','{"A":"OA. Chest X-ray (CXR).","B":"B. ABG.","C":"C. Computed tomography pulmonary angiography (CTPA).","D":"D.V/Q scan.","E":"E. D-dimer assay."}','A','Travel, especially by air, longer than 3 hours is a risk factor for the development of thromboembolism
either in form of deep vein thrombosis (DVT) or pulmonary embolism (PE). Sudden onset dyspnea is the
most common presenting symptom in PE. Pleuretic chest pain, cough, hemoptysis, hypoxia, and even
collapse and hemodynamic instability can be present as well. Fever is less common, yet a possible
presenting sign. However, in the presence of a fever, more common causes should be excluded before
PE is considered as a likely diagnosis. A CXR is always required as one of the very initial measures to
investigate other likely causes other than PE. This is even more important in the presence of fever that
makes an infectious etiology more likely than or at least as likely as, PE.

(Option B) ABG is performed in the initial assessment. A typical finding for PE is the concomitant
presence of hypoxia and hypocapnia; however, this pattern is seen in only a minority of patients. Hypoxia
is frequently present but may be due to a wide variety of other cardiopulmonary complications. To put it
simply, ABG does not add diagnostic value to this case.

(Options C and D) CTPA and V/Q scan are used for definite diagnosis of PE if initial assessment favors it
but not as the next best step here.

(Option E) D-dimer assay is used when PE is considered a likely diagnosis in patients with low to
moderated pretest probability for PE after other potential causes are excluded.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[73],"source_qid":null,"duplicate_group_id":"exact-82963bb2decf","duplicate_sources":[{"record_id":"533e483f09ea2fc07f36","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":73,"source_qid":null},{"record_id":"b55220928ea0cd199619","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":28,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','medium','{"record_id":"533e483f09ea2fc07f36","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":73,"supporting_pages":[73],"source_qid":null,"domain_hint":"Respiratory","stem":"A 40-year-old woman presents to the Emergency Department with sudden-onset chest pain, dyspnea,\nand a fever of 39°C. She arrived from Canada to Sydney 2 days ago by air. Which of the following would\nbe the most appropriate next step in management?","options":{"A":"OA. Chest X-ray (CXR).","B":"B. ABG.","C":"C. Computed tomography pulmonary angiography (CTPA).","D":"D.V/Q scan.","E":"E. D-dimer assay."},"source_answer":"A","source_explanation":"Travel, especially by air, longer than 3 hours is a risk factor for the development of thromboembolism\neither in form of deep vein thrombosis (DVT) or pulmonary embolism (PE). Sudden onset dyspnea is the\nmost common presenting symptom in PE. Pleuretic chest pain, cough, hemoptysis, hypoxia, and even\ncollapse and hemodynamic instability can be present as well. Fever is less common, yet a possible\npresenting sign. However, in the presence of a fever, more common causes should be excluded before\nPE is considered as a likely diagnosis. A CXR is always required as one of the very initial measures to\ninvestigate other likely causes other than PE. This is even more important in the presence of fever that\nmakes an infectious etiology more likely than or at least as likely as, PE.\n\n(Option B) ABG is performed in the initial assessment. A typical finding for PE is the concomitant\npresence of hypoxia and hypocapnia; however, this pattern is seen in only a minority of patients. Hypoxia\nis frequently present but may be due to a wide variety of other cardiopulmonary complications. To put it\nsimply, ABG does not add diagnostic value to this case.\n\n(Options C and D) CTPA and V/Q scan are used for definite diagnosis of PE if initial assessment favors it\nbut not as the next best step here.\n\n(Option E) D-dimer assay is used when PE is considered a likely diagnosis in patients with low to\nmoderated pretest probability for PE after other potential causes are excluded.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"medium","currentness_keywords":["age","management"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"82963bb2decf162c6c84c36c6ca73b1b90eb84e2","duplicate_group_id":"exact-82963bb2decf","duplicate_sources":[{"record_id":"533e483f09ea2fc07f36","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":73,"source_qid":null},{"record_id":"b55220928ea0cd199619","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":28,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('533e483f09ea2fc07f36','src-v294-b0ec7cfe',NULL,'73','Respiratory','Respiratory','Respiratory','AMC MCQ','A 40-year-old woman presents to the Emergency Department with sudden-onset chest pain, dyspnea,
and a fever of 39°C. She arrived from Canada to Sydney 2 days ago by air. Which of the following would
be the most appropriate next step in management?',NULL,'A','Travel, especially by air, longer than 3 hours is a risk factor for the development of thromboembolism
either in form of deep vein thrombosis (DVT) or pulmonary embolism (PE). Sudden onset dyspnea is the
most common presenting symptom in PE. Pleuretic chest pain, cough, hemoptysis, hypoxia, and even
collapse and hemodynamic instability can be present as well. Fever is less common, yet a possible
presenting sign. However, in the presence of a fever, more common causes should be excluded before
PE is considered as a likely diagnosis. A CXR is always required as one of the very initial measures to
investigate other likely causes other than PE. This is even more important in the presence of fever that
makes an infectious etiology more likely than or at least as likely as, PE.

(Option B) ABG is performed in the initial assessment. A typical finding for PE is the concomitant
presence of hypoxia and hypocapnia; however, this pattern is seen in only a minority of patients. Hypoxia
is frequently present but may be due to a wide variety of other cardiopulmonary complications. To put it
simply, ABG does not add diagnostic value to this case.

(Options C and D) CTPA and V/Q scan are used for definite diagnosis of PE if initial assessment favors it
but not as the next best step here.

(Option E) D-dimer assay is used when PE is considered a likely diagnosis in patients with low to
moderated pretest probability for PE after other potential causes are excluded.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[73],"source_qid":null,"duplicate_group_id":"exact-82963bb2decf","duplicate_sources":[{"record_id":"533e483f09ea2fc07f36","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":73,"source_qid":null},{"record_id":"b55220928ea0cd199619","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":28,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','medium') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('533e483f09ea2fc07f36','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='533e483f09ea2fc07f36';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('533e483f09ea2fc07f36-A','533e483f09ea2fc07f36','A','OA. Chest X-ray (CXR).',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('533e483f09ea2fc07f36-B','533e483f09ea2fc07f36','B','B. ABG.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('533e483f09ea2fc07f36-C','533e483f09ea2fc07f36','C','C. Computed tomography pulmonary angiography (CTPA).',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('533e483f09ea2fc07f36-D','533e483f09ea2fc07f36','D','D.V/Q scan.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('533e483f09ea2fc07f36-E','533e483f09ea2fc07f36','E','E. D-dimer assay.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('f59ed52d15dcfd8dfc58','Respiratory and chest amedex 2025.pdf','74','Respiratory','A 77-year-old man presents with shortness of breath and right-sided chest discomfort. A chest X-ray shows a right-sided
pleural effusion. A thoracocentesis is performed and the pleural fluid sent to laboratory for evaluation. The results are as
follows:
e Pleural fluid protein toserum protein ratio: 0.7
e Pleural fluid LDH to serum LDH: 0.8
e Glucose of 45mg/dl
Which one of the following is the most likely underlying cause of for this pleural effusion?','{"A":"A. Congestive heart failure.","B":"B. Hepatic cirrhosis.","C":"C. Autoimmune hemolytic anemia.","D":"© D. Malignancy.","E":"OE. Nephrosis."}','D','Pleural effusion is accumulation of fluid in the pleural cavity. It can be transudative, exudative, or hemorrhagic.
Transudate

Transudate effusions are caused by either increased hydrostatic pressure e.g. congestive heart failure, or decreased oncotic
pressure, usually due to decreased serum albumin level, such as in chronic liver disease and cirrhosis or nephrosis in which
protein is lost through the urine. Because of systemic involvement, transudate pleural effusion is often bilateral and equal in
both lungs.

Exudate

Exudate effusions are caused by a local pathology such as pneumonia, tuberculosis, or malignancies. This type of effusion
is usually unilateral and needs more investigation.

Hemorrhaic

Hemorrhagic pleural effusion is seen in malignancies, trauma or pulmonary effusion.

The following table summarizes the most common causes of each type:

Transudative

e Parapneumonic effusion

Heart failure (pneumonia)

Nephrotic syndrome e Malignancies (lung, breast,

Liver disease lymphoma)

Pulmonary embolism e Tuberculosis

atelectasis e Pulmonary embolism

¢ Collagen vascular diseases
(RA, SLE)

e Drugs

Pancreatitis

¢ Mesothelioma

e Metastatic lung cancer

e Metastatic breast cancer

e Pulmonary embolism (if
with infarction)

e Trauma

RA=rheumatoid arthritis; SLE=systemic lupus erythematosus','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[74],"source_qid":null,"duplicate_group_id":"exact-a3744a2fdf6d","duplicate_sources":[{"record_id":"f59ed52d15dcfd8dfc58","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":74,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','medium','{"record_id":"f59ed52d15dcfd8dfc58","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":74,"supporting_pages":[74],"source_qid":null,"domain_hint":"Respiratory","stem":"A 77-year-old man presents with shortness of breath and right-sided chest discomfort. A chest X-ray shows a right-sided\npleural effusion. A thoracocentesis is performed and the pleural fluid sent to laboratory for evaluation. The results are as\nfollows:\ne Pleural fluid protein toserum protein ratio: 0.7\ne Pleural fluid LDH to serum LDH: 0.8\ne Glucose of 45mg/dl\nWhich one of the following is the most likely underlying cause of for this pleural effusion?","options":{"A":"A. Congestive heart failure.","B":"B. Hepatic cirrhosis.","C":"C. Autoimmune hemolytic anemia.","D":"© D. Malignancy.","E":"OE. Nephrosis."},"source_answer":"D","source_explanation":"Pleural effusion is accumulation of fluid in the pleural cavity. It can be transudative, exudative, or hemorrhagic.\nTransudate\n\nTransudate effusions are caused by either increased hydrostatic pressure e.g. congestive heart failure, or decreased oncotic\npressure, usually due to decreased serum albumin level, such as in chronic liver disease and cirrhosis or nephrosis in which\nprotein is lost through the urine. Because of systemic involvement, transudate pleural effusion is often bilateral and equal in\nboth lungs.\n\nExudate\n\nExudate effusions are caused by a local pathology such as pneumonia, tuberculosis, or malignancies. This type of effusion\nis usually unilateral and needs more investigation.\n\nHemorrhaic\n\nHemorrhagic pleural effusion is seen in malignancies, trauma or pulmonary effusion.\n\nThe following table summarizes the most common causes of each type:\n\nTransudative\n\ne Parapneumonic effusion\n\nHeart failure (pneumonia)\n\nNephrotic syndrome e Malignancies (lung, breast,\n\nLiver disease lymphoma)\n\nPulmonary embolism e Tuberculosis\n\natelectasis e Pulmonary embolism\n\n¢ Collagen vascular diseases\n(RA, SLE)\n\ne Drugs\n\nPancreatitis\n\n¢ Mesothelioma\n\ne Metastatic lung cancer\n\ne Metastatic breast cancer\n\ne Pulmonary embolism (if\nwith infarction)\n\ne Trauma\n\nRA=rheumatoid arthritis; SLE=systemic lupus erythematosus","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"medium","currentness_keywords":["age","drug"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"a3744a2fdf6d0d81c5d65f59c7d4b78670f84731","duplicate_group_id":"exact-a3744a2fdf6d","duplicate_sources":[{"record_id":"f59ed52d15dcfd8dfc58","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":74,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('f59ed52d15dcfd8dfc58','src-v294-b0ec7cfe',NULL,'74','Respiratory','Respiratory','Respiratory','AMC MCQ','A 77-year-old man presents with shortness of breath and right-sided chest discomfort. A chest X-ray shows a right-sided
pleural effusion. A thoracocentesis is performed and the pleural fluid sent to laboratory for evaluation. The results are as
follows:
e Pleural fluid protein toserum protein ratio: 0.7
e Pleural fluid LDH to serum LDH: 0.8
e Glucose of 45mg/dl
Which one of the following is the most likely underlying cause of for this pleural effusion?',NULL,'D','Pleural effusion is accumulation of fluid in the pleural cavity. It can be transudative, exudative, or hemorrhagic.
Transudate

Transudate effusions are caused by either increased hydrostatic pressure e.g. congestive heart failure, or decreased oncotic
pressure, usually due to decreased serum albumin level, such as in chronic liver disease and cirrhosis or nephrosis in which
protein is lost through the urine. Because of systemic involvement, transudate pleural effusion is often bilateral and equal in
both lungs.

Exudate

Exudate effusions are caused by a local pathology such as pneumonia, tuberculosis, or malignancies. This type of effusion
is usually unilateral and needs more investigation.

Hemorrhaic

Hemorrhagic pleural effusion is seen in malignancies, trauma or pulmonary effusion.

The following table summarizes the most common causes of each type:

Transudative

e Parapneumonic effusion

Heart failure (pneumonia)

Nephrotic syndrome e Malignancies (lung, breast,

Liver disease lymphoma)

Pulmonary embolism e Tuberculosis

atelectasis e Pulmonary embolism

¢ Collagen vascular diseases
(RA, SLE)

e Drugs

Pancreatitis

¢ Mesothelioma

e Metastatic lung cancer

e Metastatic breast cancer

e Pulmonary embolism (if
with infarction)

e Trauma

RA=rheumatoid arthritis; SLE=systemic lupus erythematosus',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[74],"source_qid":null,"duplicate_group_id":"exact-a3744a2fdf6d","duplicate_sources":[{"record_id":"f59ed52d15dcfd8dfc58","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":74,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','medium') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('f59ed52d15dcfd8dfc58','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='f59ed52d15dcfd8dfc58';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('f59ed52d15dcfd8dfc58-A','f59ed52d15dcfd8dfc58','A','A. Congestive heart failure.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('f59ed52d15dcfd8dfc58-B','f59ed52d15dcfd8dfc58','B','B. Hepatic cirrhosis.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('f59ed52d15dcfd8dfc58-C','f59ed52d15dcfd8dfc58','C','C. Autoimmune hemolytic anemia.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('f59ed52d15dcfd8dfc58-D','f59ed52d15dcfd8dfc58','D','© D. Malignancy.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('f59ed52d15dcfd8dfc58-E','f59ed52d15dcfd8dfc58','E','OE. Nephrosis.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('3a614049139e401e0c2d','Respiratory and chest amedex 2025.pdf','76','Respiratory','A 35-year-old woman presents to the Emergency Department with sudden onset shortness of breath and
right-sided pleuretic chest pain. On examination, she has a blood pressure of 130/89 mmHg, pulse rate
of 102 bpm, and respiratory rate of 25 breaths per minute. Neck and forehead veins are flat and the
trachea slightly deviates to the right side. Her right-lung field has reduced breath sounds and is hyper-
resonance to percussion. A chest X-ray shows a 25% right-sided pneumothorax. There are no other
abnormalities on the chest X-ray. Which one of the following is the most appropriate next step in
management?','{"A":"A. Chest tube drainage.","B":"OB. Needle aspiration.","C":"C. Intubation and mechanical ventilation.","D":"D. Observation for 24 hours.","E":"E. Thoracotomy."}','B','This woman has developed pneumothorax in the absence of a history of trauma or an invasive
procedure. Such pneumothoraces are termed ''spontaneous pneumothorax’. She has no chest X-ray
abnormalities apart from those related to the pneumothorax. She also has no history of lung disease,
making ‘primary spontaneous pneumothorax (PSP)’ the most likely diagnosis. The management option
of choice for patients with symptomatic PSPs or asymptomatic PSPs that are large (>15%) is needle
aspiration.

(Option A) Chest tube insertion is the management of choice in patients with traumatic pneumothorax,
patients with a large (>15%) secondary spontaneous pneumothorax, or when a patient with
pneumothorax is about to undergo mechanical ventilation or being transferred by air (see topic review).

(Option C) Mechanical ventilation or positive pressure ventilation of any kind makes pneumothorax
worse.

(Option D) Observation is an acceptable management option for patients with primary spontaneous
pneumothoraces that are asymptomatic and small ($15%).

(Option E) Thoracotomy has no role in the management of pneumothorax but may be indicated for the
underlying airway disease as the cause of the pneumothorax.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[76],"source_qid":null,"duplicate_group_id":"exact-1acbed3d75f3","duplicate_sources":[{"record_id":"3a614049139e401e0c2d","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":76,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','medium','{"record_id":"3a614049139e401e0c2d","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":76,"supporting_pages":[76],"source_qid":null,"domain_hint":"Respiratory","stem":"A 35-year-old woman presents to the Emergency Department with sudden onset shortness of breath and\nright-sided pleuretic chest pain. On examination, she has a blood pressure of 130/89 mmHg, pulse rate\nof 102 bpm, and respiratory rate of 25 breaths per minute. Neck and forehead veins are flat and the\ntrachea slightly deviates to the right side. Her right-lung field has reduced breath sounds and is hyper-\nresonance to percussion. A chest X-ray shows a 25% right-sided pneumothorax. There are no other\nabnormalities on the chest X-ray. Which one of the following is the most appropriate next step in\nmanagement?","options":{"A":"A. Chest tube drainage.","B":"OB. Needle aspiration.","C":"C. Intubation and mechanical ventilation.","D":"D. Observation for 24 hours.","E":"E. Thoracotomy."},"source_answer":"B","source_explanation":"This woman has developed pneumothorax in the absence of a history of trauma or an invasive\nprocedure. Such pneumothoraces are termed ''spontaneous pneumothorax’. She has no chest X-ray\nabnormalities apart from those related to the pneumothorax. She also has no history of lung disease,\nmaking ‘primary spontaneous pneumothorax (PSP)’ the most likely diagnosis. The management option\nof choice for patients with symptomatic PSPs or asymptomatic PSPs that are large (>15%) is needle\naspiration.\n\n(Option A) Chest tube insertion is the management of choice in patients with traumatic pneumothorax,\npatients with a large (>15%) secondary spontaneous pneumothorax, or when a patient with\npneumothorax is about to undergo mechanical ventilation or being transferred by air (see topic review).\n\n(Option C) Mechanical ventilation or positive pressure ventilation of any kind makes pneumothorax\nworse.\n\n(Option D) Observation is an acceptable management option for patients with primary spontaneous\npneumothoraces that are asymptomatic and small ($15%).\n\n(Option E) Thoracotomy has no role in the management of pneumothorax but may be indicated for the\nunderlying airway disease as the cause of the pneumothorax.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"medium","currentness_keywords":["age","management"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"1acbed3d75f3976ebf702127ad7398e2264031ce","duplicate_group_id":"exact-1acbed3d75f3","duplicate_sources":[{"record_id":"3a614049139e401e0c2d","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":76,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('3a614049139e401e0c2d','src-v294-b0ec7cfe',NULL,'76','Respiratory','Respiratory','Respiratory','AMC MCQ','A 35-year-old woman presents to the Emergency Department with sudden onset shortness of breath and
right-sided pleuretic chest pain. On examination, she has a blood pressure of 130/89 mmHg, pulse rate
of 102 bpm, and respiratory rate of 25 breaths per minute. Neck and forehead veins are flat and the
trachea slightly deviates to the right side. Her right-lung field has reduced breath sounds and is hyper-
resonance to percussion. A chest X-ray shows a 25% right-sided pneumothorax. There are no other
abnormalities on the chest X-ray. Which one of the following is the most appropriate next step in
management?',NULL,'B','This woman has developed pneumothorax in the absence of a history of trauma or an invasive
procedure. Such pneumothoraces are termed ''spontaneous pneumothorax’. She has no chest X-ray
abnormalities apart from those related to the pneumothorax. She also has no history of lung disease,
making ‘primary spontaneous pneumothorax (PSP)’ the most likely diagnosis. The management option
of choice for patients with symptomatic PSPs or asymptomatic PSPs that are large (>15%) is needle
aspiration.

(Option A) Chest tube insertion is the management of choice in patients with traumatic pneumothorax,
patients with a large (>15%) secondary spontaneous pneumothorax, or when a patient with
pneumothorax is about to undergo mechanical ventilation or being transferred by air (see topic review).

(Option C) Mechanical ventilation or positive pressure ventilation of any kind makes pneumothorax
worse.

(Option D) Observation is an acceptable management option for patients with primary spontaneous
pneumothoraces that are asymptomatic and small ($15%).

(Option E) Thoracotomy has no role in the management of pneumothorax but may be indicated for the
underlying airway disease as the cause of the pneumothorax.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[76],"source_qid":null,"duplicate_group_id":"exact-1acbed3d75f3","duplicate_sources":[{"record_id":"3a614049139e401e0c2d","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":76,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','medium') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('3a614049139e401e0c2d','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='3a614049139e401e0c2d';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('3a614049139e401e0c2d-A','3a614049139e401e0c2d','A','A. Chest tube drainage.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('3a614049139e401e0c2d-B','3a614049139e401e0c2d','B','OB. Needle aspiration.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('3a614049139e401e0c2d-C','3a614049139e401e0c2d','C','C. Intubation and mechanical ventilation.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('3a614049139e401e0c2d-D','3a614049139e401e0c2d','D','D. Observation for 24 hours.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('3a614049139e401e0c2d-E','3a614049139e401e0c2d','E','E. Thoracotomy.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('b6a311d5ac824d738912','Respiratory and chest amedex 2025.pdf','79','Respiratory','Mr. Browny brings her wife to the emergency department because he found her walking in the front yard
in her night gown and speaking to herself incoherently. She is 68 years old and has the established
diagnosis of chronic obstructive pulmonary disease (COPD) made 3 years ago. She has had 3 episodes
of COPD exacerbation in the past 18 months, for which she has been hospitalized. On examination, she
looks confused, with a mini mental status exam (MMSE) score of 24. Which one of the following
investigations is more likely to establish the cause of her presentation?','{"A":"OA. ABG.","B":"B. Chest X-ray.","C":"C. CT scan of the head.","D":"D. Urinalysis.","E":"E. Basic metabolic panel."}','A','Patients with exacerbation of COPP have deterioration of the pre-existing hypoxia and hypercapnia, both
of which can cause a confusional state and delirium. With COPD in history, the initial investigation would
always be an arterial blood gas (ABG) analysis to for hypoxia, reflected by a decreased PaO2 level, or
hypercapnia indicated by an elevated PaCO2.

Management of hypoxia always takes precedent over correction of hypercapnia.

(Option B) Achest X-ray is always required for patient with exacerbations of COPD to look for an
underlying cause for the deterioration, but this is not the first step.

(Option C) CT scan of the head may be indicated to exclude intracranial bleeding, tumors, etc, but as
mentioned earlier, ABG always comes first.

(Option D) Urinalysis is considered when urosepsis is suspected. Although there is no comment about
‘fever’, it should be borne in mind and investigated, as a part of workup plan in elderly patients with new-
onset confusion.

(Option E) Electrolyte disturbances (e.g. hypo/hypernatremia) are other possible causes of suppressed
mental status and confusion, and should always be investigated promptly.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[79],"source_qid":null,"duplicate_group_id":"exact-daff7559953f","duplicate_sources":[{"record_id":"b6a311d5ac824d738912","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":79,"source_qid":null},{"record_id":"5eb8c0dab491e1f5c3c9","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1786,"source_qid":"399"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','medium','{"record_id":"b6a311d5ac824d738912","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":79,"supporting_pages":[79],"source_qid":null,"domain_hint":"Respiratory","stem":"Mr. Browny brings her wife to the emergency department because he found her walking in the front yard\nin her night gown and speaking to herself incoherently. She is 68 years old and has the established\ndiagnosis of chronic obstructive pulmonary disease (COPD) made 3 years ago. She has had 3 episodes\nof COPD exacerbation in the past 18 months, for which she has been hospitalized. On examination, she\nlooks confused, with a mini mental status exam (MMSE) score of 24. Which one of the following\ninvestigations is more likely to establish the cause of her presentation?","options":{"A":"OA. ABG.","B":"B. Chest X-ray.","C":"C. CT scan of the head.","D":"D. Urinalysis.","E":"E. Basic metabolic panel."},"source_answer":"A","source_explanation":"Patients with exacerbation of COPP have deterioration of the pre-existing hypoxia and hypercapnia, both\nof which can cause a confusional state and delirium. With COPD in history, the initial investigation would\nalways be an arterial blood gas (ABG) analysis to for hypoxia, reflected by a decreased PaO2 level, or\nhypercapnia indicated by an elevated PaCO2.\n\nManagement of hypoxia always takes precedent over correction of hypercapnia.\n\n(Option B) Achest X-ray is always required for patient with exacerbations of COPD to look for an\nunderlying cause for the deterioration, but this is not the first step.\n\n(Option C) CT scan of the head may be indicated to exclude intracranial bleeding, tumors, etc, but as\nmentioned earlier, ABG always comes first.\n\n(Option D) Urinalysis is considered when urosepsis is suspected. Although there is no comment about\n‘fever’, it should be borne in mind and investigated, as a part of workup plan in elderly patients with new-\nonset confusion.\n\n(Option E) Electrolyte disturbances (e.g. hypo/hypernatremia) are other possible causes of suppressed\nmental status and confusion, and should always be investigated promptly.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"medium","currentness_keywords":["age","management"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"daff7559953f7b54f8b84b8ed092a12984d3e621","duplicate_group_id":"exact-daff7559953f","duplicate_sources":[{"record_id":"b6a311d5ac824d738912","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":79,"source_qid":null},{"record_id":"5eb8c0dab491e1f5c3c9","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1786,"source_qid":"399"}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('b6a311d5ac824d738912','src-v294-b0ec7cfe',NULL,'79','Respiratory','Respiratory','Respiratory','AMC MCQ','Mr. Browny brings her wife to the emergency department because he found her walking in the front yard
in her night gown and speaking to herself incoherently. She is 68 years old and has the established
diagnosis of chronic obstructive pulmonary disease (COPD) made 3 years ago. She has had 3 episodes
of COPD exacerbation in the past 18 months, for which she has been hospitalized. On examination, she
looks confused, with a mini mental status exam (MMSE) score of 24. Which one of the following
investigations is more likely to establish the cause of her presentation?',NULL,'A','Patients with exacerbation of COPP have deterioration of the pre-existing hypoxia and hypercapnia, both
of which can cause a confusional state and delirium. With COPD in history, the initial investigation would
always be an arterial blood gas (ABG) analysis to for hypoxia, reflected by a decreased PaO2 level, or
hypercapnia indicated by an elevated PaCO2.

Management of hypoxia always takes precedent over correction of hypercapnia.

(Option B) Achest X-ray is always required for patient with exacerbations of COPD to look for an
underlying cause for the deterioration, but this is not the first step.

(Option C) CT scan of the head may be indicated to exclude intracranial bleeding, tumors, etc, but as
mentioned earlier, ABG always comes first.

(Option D) Urinalysis is considered when urosepsis is suspected. Although there is no comment about
‘fever’, it should be borne in mind and investigated, as a part of workup plan in elderly patients with new-
onset confusion.

(Option E) Electrolyte disturbances (e.g. hypo/hypernatremia) are other possible causes of suppressed
mental status and confusion, and should always be investigated promptly.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[79],"source_qid":null,"duplicate_group_id":"exact-daff7559953f","duplicate_sources":[{"record_id":"b6a311d5ac824d738912","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":79,"source_qid":null},{"record_id":"5eb8c0dab491e1f5c3c9","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1786,"source_qid":"399"}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','medium') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('b6a311d5ac824d738912','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='b6a311d5ac824d738912';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6a311d5ac824d738912-A','b6a311d5ac824d738912','A','OA. ABG.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6a311d5ac824d738912-B','b6a311d5ac824d738912','B','B. Chest X-ray.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6a311d5ac824d738912-C','b6a311d5ac824d738912','C','C. CT scan of the head.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6a311d5ac824d738912-D','b6a311d5ac824d738912','D','D. Urinalysis.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b6a311d5ac824d738912-E','b6a311d5ac824d738912','E','E. Basic metabolic panel.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('b230eab62a668144ad5a','Respiratory and chest amedex 2025.pdf','80','Respiratory','A 4-year-old boy, with background history of asthma, presents with a severe attack of asthma following an upper respiratory
infection. On physical examination, he appears distressed with a pulse rate of 130 bpm, respiratory rate of 48 breaths per
minute and temperature 37.1°C. Bedside pulseoxymetry shows an oxygen saturation of 85% while on room air. Which one of
the following is the most appropriate initial step in management?','{"A":"A. Give salbutamol inhalation and recommend salbutamol inhaler 4-hourly at home and review in 24 hours.","B":"B. Start 4-hourly salbutamol and ipratropium bromide inhalers and oral prednisolone, and review in 24 hours.","C":"C. Start inhaled salbutamol and oral amoxicillin 4-hourly, and review in 24 hours.","D":"OD. Give oxygen and continuous salbutamol inhalations and transfer to the hospital by ambulance.","E":"E. Refer for admission to the hospital for salbutamol and ipratropium inhalations."}','D','Initial assessment of the severity of an asthma attack in children is according to the following table:

No
Increased accessory muscle
ry marked

Sentences Phrases Words
100 — 200 >200
PEF (% predicted) 40%-60% <40%**
>60% 40%-60% <40%***

Oxymetry while breathing 594% 90%-94% <90%

CO

Hospital admission No ERO BAR WeSbedla Mme eo mine Yes, consider ICU
treatment response

With an oxygen saturation of less than 90%, this child has a severe asthma attack and should be transferred to the hospital
for close monitoring and treatment; however, initial treatment with oxygen and short-acting 82 agonists (e.g. salbutamol)
should be started without delay and maintained on the way to the hospital.

Options suggesting outpatient management are incorrect. Transferring to the hospital without oxygen supplementation and
bronchodilators is inappropriate, because this boy is hypoxic and at increased risk of respiratory failure.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[80],"source_qid":null,"duplicate_group_id":"exact-27cc2b886e48","duplicate_sources":[{"record_id":"b230eab62a668144ad5a","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":80,"source_qid":null},{"record_id":"33e8d95524a9e4280046","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1760,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"b230eab62a668144ad5a","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":80,"supporting_pages":[80],"source_qid":null,"domain_hint":"Respiratory","stem":"A 4-year-old boy, with background history of asthma, presents with a severe attack of asthma following an upper respiratory\ninfection. On physical examination, he appears distressed with a pulse rate of 130 bpm, respiratory rate of 48 breaths per\nminute and temperature 37.1°C. Bedside pulseoxymetry shows an oxygen saturation of 85% while on room air. Which one of\nthe following is the most appropriate initial step in management?","options":{"A":"A. Give salbutamol inhalation and recommend salbutamol inhaler 4-hourly at home and review in 24 hours.","B":"B. Start 4-hourly salbutamol and ipratropium bromide inhalers and oral prednisolone, and review in 24 hours.","C":"C. Start inhaled salbutamol and oral amoxicillin 4-hourly, and review in 24 hours.","D":"OD. Give oxygen and continuous salbutamol inhalations and transfer to the hospital by ambulance.","E":"E. Refer for admission to the hospital for salbutamol and ipratropium inhalations."},"source_answer":"D","source_explanation":"Initial assessment of the severity of an asthma attack in children is according to the following table:\n\nNo\nIncreased accessory muscle\nry marked\n\nSentences Phrases Words\n100 — 200 >200\nPEF (% predicted) 40%-60% <40%**\n>60% 40%-60% <40%***\n\nOxymetry while breathing 594% 90%-94% <90%\n\nCO\n\nHospital admission No ERO BAR WeSbedla Mme eo mine Yes, consider ICU\ntreatment response\n\nWith an oxygen saturation of less than 90%, this child has a severe asthma attack and should be transferred to the hospital\nfor close monitoring and treatment; however, initial treatment with oxygen and short-acting 82 agonists (e.g. salbutamol)\nshould be started without delay and maintained on the way to the hospital.\n\nOptions suggesting outpatient management are incorrect. Transferring to the hospital without oxygen supplementation and\nbronchodilators is inappropriate, because this boy is hypoxic and at increased risk of respiratory failure.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","asthma","management","treatment"],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"27cc2b886e48325d4f622ca650384eecea994b0f","duplicate_group_id":"exact-27cc2b886e48","duplicate_sources":[{"record_id":"b230eab62a668144ad5a","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":80,"source_qid":null},{"record_id":"33e8d95524a9e4280046","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1760,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('b230eab62a668144ad5a','src-v294-b0ec7cfe',NULL,'80','Respiratory','Respiratory','Respiratory','AMC MCQ','A 4-year-old boy, with background history of asthma, presents with a severe attack of asthma following an upper respiratory
infection. On physical examination, he appears distressed with a pulse rate of 130 bpm, respiratory rate of 48 breaths per
minute and temperature 37.1°C. Bedside pulseoxymetry shows an oxygen saturation of 85% while on room air. Which one of
the following is the most appropriate initial step in management?',NULL,'D','Initial assessment of the severity of an asthma attack in children is according to the following table:

No
Increased accessory muscle
ry marked

Sentences Phrases Words
100 — 200 >200
PEF (% predicted) 40%-60% <40%**
>60% 40%-60% <40%***

Oxymetry while breathing 594% 90%-94% <90%

CO

Hospital admission No ERO BAR WeSbedla Mme eo mine Yes, consider ICU
treatment response

With an oxygen saturation of less than 90%, this child has a severe asthma attack and should be transferred to the hospital
for close monitoring and treatment; however, initial treatment with oxygen and short-acting 82 agonists (e.g. salbutamol)
should be started without delay and maintained on the way to the hospital.

Options suggesting outpatient management are incorrect. Transferring to the hospital without oxygen supplementation and
bronchodilators is inappropriate, because this boy is hypoxic and at increased risk of respiratory failure.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[80],"source_qid":null,"duplicate_group_id":"exact-27cc2b886e48","duplicate_sources":[{"record_id":"b230eab62a668144ad5a","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":80,"source_qid":null},{"record_id":"33e8d95524a9e4280046","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1760,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('b230eab62a668144ad5a','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='b230eab62a668144ad5a';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b230eab62a668144ad5a-A','b230eab62a668144ad5a','A','A. Give salbutamol inhalation and recommend salbutamol inhaler 4-hourly at home and review in 24 hours.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b230eab62a668144ad5a-B','b230eab62a668144ad5a','B','B. Start 4-hourly salbutamol and ipratropium bromide inhalers and oral prednisolone, and review in 24 hours.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b230eab62a668144ad5a-C','b230eab62a668144ad5a','C','C. Start inhaled salbutamol and oral amoxicillin 4-hourly, and review in 24 hours.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b230eab62a668144ad5a-D','b230eab62a668144ad5a','D','OD. Give oxygen and continuous salbutamol inhalations and transfer to the hospital by ambulance.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('b230eab62a668144ad5a-E','b230eab62a668144ad5a','E','E. Refer for admission to the hospital for salbutamol and ipratropium inhalations.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('6cc77e542a8c2b5164fc','Respiratory and chest amedex 2025.pdf','81','Respiratory','A 28-year-old man sustains multiple limb fractures in a motor vehicle accident and undergoes surgical fixation of the fractures. On the
third day after the surgery, he develops sudden right-sided pleuretic chest pain and shortness of breath. On examination, the findings are
otherwise inconclusive. Which one of the following would be the most likely diagnosis?','{"A":"OA. Pulmonary embolism.","B":"B. Fat embolism.","C":"C. Atelectasis.","D":"D. Pneumonia.","E":"E. Air embolism."}','A','The history of orthopedic surgery and clinical findings of pleuritic chest pain and shortness of breath make pulmonary embolism (PE) the
most likely diagnosis. PE may have been caused by clot (thromboembolism) or fat from a fractured bone where fat can escape from bone
marrow into circulation.

NOTE - differential diagnoses of pleuritic chest pain include the following 5 ‘P’s:

Pulmonary embolism
Pericarditis
Pneumonia
Pneumothorax
Pneumomediastinum.

oS iO Nis

(Option B) Fat embolism syndrome (FES) is systemic involvement due to occlusion of vessels by free-circulating fat drops and droplets.
Brain, eyes, kidneys, skin, and lungs are the most common affected organs. Lung involvement is termed as pulmonary embolism, not fat
embolism because the latter is, by definition, a systemic condition not just confined to the lungs.

The history of a patient with fat embolism syndrome (FES) may include the following:

¢ Trauma to a long bone or the pelvis, including trauma sustained in orthopedic procedures
e Parenteral lipid infusion
¢ Recent corticosteroid administration

Major physical criteria of FES are respiratory symptoms, cerebral signs without other etiologies and petechial rash. Minor criteria are
pulse rate higher than 110 bpm, fever higher than 38.5° C, retinal changes of fat globules or petechiae, renal dysfunction, jaundice, acute
drop in hemoglobin level, platelet count, or both and elevated erythrocyte sedimentation rate

A formal diagnosis of FES requires the presence of at least one major criterion and four minor criteria, plus fat microglobulinemia. With
only shortness of breath and pleuretic chest pain and otherwise normal findings on exam this patient is unlikely to have FES.

(Options C and D) Atelectasis after the first day of operation, and pneumonia without preceding atelectasis are less likely.

(Option E) Air embolism is a rapidly lethal condition with sudden death being the most common presentation. It does not cause pleuritic
chest pain. Often the patient will not have enough time to even become short of breath.','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[81],"source_qid":null,"duplicate_group_id":"exact-7217ebb6b085","duplicate_sources":[{"record_id":"6cc77e542a8c2b5164fc","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":81,"source_qid":null},{"record_id":"98139d3110cb84f5e4e1","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":1,"source_qid":null},{"record_id":"6da1b3954721cc6e2a81","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1843,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','low','{"record_id":"6cc77e542a8c2b5164fc","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":81,"supporting_pages":[81],"source_qid":null,"domain_hint":"Respiratory","stem":"A 28-year-old man sustains multiple limb fractures in a motor vehicle accident and undergoes surgical fixation of the fractures. On the\nthird day after the surgery, he develops sudden right-sided pleuretic chest pain and shortness of breath. On examination, the findings are\notherwise inconclusive. Which one of the following would be the most likely diagnosis?","options":{"A":"OA. Pulmonary embolism.","B":"B. Fat embolism.","C":"C. Atelectasis.","D":"D. Pneumonia.","E":"E. Air embolism."},"source_answer":"A","source_explanation":"The history of orthopedic surgery and clinical findings of pleuritic chest pain and shortness of breath make pulmonary embolism (PE) the\nmost likely diagnosis. PE may have been caused by clot (thromboembolism) or fat from a fractured bone where fat can escape from bone\nmarrow into circulation.\n\nNOTE - differential diagnoses of pleuritic chest pain include the following 5 ‘P’s:\n\nPulmonary embolism\nPericarditis\nPneumonia\nPneumothorax\nPneumomediastinum.\n\noS iO Nis\n\n(Option B) Fat embolism syndrome (FES) is systemic involvement due to occlusion of vessels by free-circulating fat drops and droplets.\nBrain, eyes, kidneys, skin, and lungs are the most common affected organs. Lung involvement is termed as pulmonary embolism, not fat\nembolism because the latter is, by definition, a systemic condition not just confined to the lungs.\n\nThe history of a patient with fat embolism syndrome (FES) may include the following:\n\n¢ Trauma to a long bone or the pelvis, including trauma sustained in orthopedic procedures\ne Parenteral lipid infusion\n¢ Recent corticosteroid administration\n\nMajor physical criteria of FES are respiratory symptoms, cerebral signs without other etiologies and petechial rash. Minor criteria are\npulse rate higher than 110 bpm, fever higher than 38.5° C, retinal changes of fat globules or petechiae, renal dysfunction, jaundice, acute\ndrop in hemoglobin level, platelet count, or both and elevated erythrocyte sedimentation rate\n\nA formal diagnosis of FES requires the presence of at least one major criterion and four minor criteria, plus fat microglobulinemia. With\nonly shortness of breath and pleuretic chest pain and otherwise normal findings on exam this patient is unlikely to have FES.\n\n(Options C and D) Atelectasis after the first day of operation, and pneumonia without preceding atelectasis are less likely.\n\n(Option E) Air embolism is a rapidly lethal condition with sudden death being the most common presentation. It does not cause pleuritic\nchest pain. Often the patient will not have enough time to even become short of breath.","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"low","currentness_keywords":[],"likely_visual_question":false,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"7217ebb6b08500ed092828f886f1ca2f11a5d1a4","duplicate_group_id":"exact-7217ebb6b085","duplicate_sources":[{"record_id":"6cc77e542a8c2b5164fc","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":81,"source_qid":null},{"record_id":"98139d3110cb84f5e4e1","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":1,"source_qid":null},{"record_id":"6da1b3954721cc6e2a81","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1843,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('6cc77e542a8c2b5164fc','src-v294-b0ec7cfe',NULL,'81','Respiratory','Respiratory','Respiratory','AMC MCQ','A 28-year-old man sustains multiple limb fractures in a motor vehicle accident and undergoes surgical fixation of the fractures. On the
third day after the surgery, he develops sudden right-sided pleuretic chest pain and shortness of breath. On examination, the findings are
otherwise inconclusive. Which one of the following would be the most likely diagnosis?',NULL,'A','The history of orthopedic surgery and clinical findings of pleuritic chest pain and shortness of breath make pulmonary embolism (PE) the
most likely diagnosis. PE may have been caused by clot (thromboembolism) or fat from a fractured bone where fat can escape from bone
marrow into circulation.

NOTE - differential diagnoses of pleuritic chest pain include the following 5 ‘P’s:

Pulmonary embolism
Pericarditis
Pneumonia
Pneumothorax
Pneumomediastinum.

oS iO Nis

(Option B) Fat embolism syndrome (FES) is systemic involvement due to occlusion of vessels by free-circulating fat drops and droplets.
Brain, eyes, kidneys, skin, and lungs are the most common affected organs. Lung involvement is termed as pulmonary embolism, not fat
embolism because the latter is, by definition, a systemic condition not just confined to the lungs.

The history of a patient with fat embolism syndrome (FES) may include the following:

¢ Trauma to a long bone or the pelvis, including trauma sustained in orthopedic procedures
e Parenteral lipid infusion
¢ Recent corticosteroid administration

Major physical criteria of FES are respiratory symptoms, cerebral signs without other etiologies and petechial rash. Minor criteria are
pulse rate higher than 110 bpm, fever higher than 38.5° C, retinal changes of fat globules or petechiae, renal dysfunction, jaundice, acute
drop in hemoglobin level, platelet count, or both and elevated erythrocyte sedimentation rate

A formal diagnosis of FES requires the presence of at least one major criterion and four minor criteria, plus fat microglobulinemia. With
only shortness of breath and pleuretic chest pain and otherwise normal findings on exam this patient is unlikely to have FES.

(Options C and D) Atelectasis after the first day of operation, and pneumonia without preceding atelectasis are less likely.

(Option E) Air embolism is a rapidly lethal condition with sudden death being the most common presentation. It does not cause pleuritic
chest pain. Often the patient will not have enough time to even become short of breath.',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[81],"source_qid":null,"duplicate_group_id":"exact-7217ebb6b085","duplicate_sources":[{"record_id":"6cc77e542a8c2b5164fc","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":81,"source_qid":null},{"record_id":"98139d3110cb84f5e4e1","record_type":"text_mcq","source_file":"AMEDEX 2025 Respiratory  (1).pdf","source_relative_path":"AMEDEX 2025.09更新包/AMEDEX 2025 Respiratory  (1).pdf","source_page":1,"source_qid":null},{"record_id":"6da1b3954721cc6e2a81","record_type":"text_mcq","source_file":"Amedex 2023.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Amedex 2023.pdf","source_page":1843,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','low') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('6cc77e542a8c2b5164fc','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='6cc77e542a8c2b5164fc';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('6cc77e542a8c2b5164fc-A','6cc77e542a8c2b5164fc','A','OA. Pulmonary embolism.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('6cc77e542a8c2b5164fc-B','6cc77e542a8c2b5164fc','B','B. Fat embolism.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('6cc77e542a8c2b5164fc-C','6cc77e542a8c2b5164fc','C','C. Atelectasis.',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('6cc77e542a8c2b5164fc-D','6cc77e542a8c2b5164fc','D','D. Pneumonia.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('6cc77e542a8c2b5164fc-E','6cc77e542a8c2b5164fc','E','E. Air embolism.',NULL,5);
--> statement-breakpoint
INSERT INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES ('src-v294-b0ec7cfe','Respiratory and chest amedex 2025.pdf','AMC question-bank source','2025','AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf','private-study','v2.9.4-imported','needs-verification','{"import_version":"v2.9.4"}') ON CONFLICT(id) DO UPDATE SET name=excluded.name,source_year=excluded.source_year,import_status=excluded.import_status,current_guideline_status=excluded.current_guideline_status,metadata_json=excluded.metadata_json;
--> statement-breakpoint
INSERT INTO canonical_records (record_id,source_file,source_page,domain,stem,options_json,source_answer,source_explanation,provenance_json,visual_asset,visual_url,options_mode,current_answer,current_answer_status,current_evidence_json,currentness_risk,record_json,active_quiz,import_version,imported_at) VALUES ('c55be535f0be796a8b05','Respiratory and chest amedex 2025.pdf','82','Respiratory','A 42-year-old woman sustained a motor vehicle accident (MVA) and fractured her femoral neck, which is surgically fixed. Five days after
the surgery, she develops sudden-onset chest pain and dyspnea. She is on oral contraceptive pills. On examination, she is afebrile and
has a heart rate of 100 bpm, BP of 110/70 mmHg, and a respiratory rate of 24 breaths per minute. Lungs are clear to auscultation. Chest
X-ray and ECG are normal. Which one of the following is the most appropriate next step in management?','{"A":"A. Duplex doppler ultrasound scan of lower limbs.","B":"B. D-dimer assay.","C":"C. Computed tomography pulmonary angiography (CTPA).","D":"D. Arterial blood gas (ABG) analysis.","E":"OE. V/Q scan."}','E','Orthopedic surgery is a strong risk factor for the development of venous thromboembolism in the post-op period. For every patient with
major surgery within the past 4 weeks or immobilization longer than 3 days, who have signs and symptoms such as dyspnea, chest pain
(especially pleuretic or sudden onset), cough, hemoptysis, or hypoxia, pulmonary embolism (PE) should always be suspected and
promptly investigated.

CTPA and V/Q scan are confirmatory tests for PE if, through pretest probability assessment, PE is a likely diagnosis. There are rules
referred to as Clinical Decision Rules (CDR) for this purpose. CDRs consider different items to calculate the likelihood of PE as a
diagnosis to prevent unnecessary diagnostic testing or treatment.

One of the most recently validated and practical of these CDRs is Simplified Wells Score (SWS). SWS gives seven items one score each
(if present). Patients with scores 2 or higher are likely to have PE and should undergo imaging studies either by CTPA or V/Q scan, while
patients with scores 0 or 1 are unlikely to have PE. In this group, a D-dimer assay is used to safely exclude PE.

D-dimer is a fibrin degeneration product. High levels of D-dimer represent the presence of thrombus and trigger further confirmatory
diagnostic tests for a definite diagnosis. Negative results have a high negative predictive value and are sensitive enough to exclude PE in
patients with low to moderate pretest probability of PE. D-dimer levels are, however, elevated in the post-surgery (first 2 weeks) period,
pregnancy, inflammation, infection, and cancer, making a negative result less likely and the test less desirable where these conditions are
present.

The following diagram shows the approach to patients with suspected PE based on SWS:

ified Wells Score

1
1
1
1
1

1 PE unlikely

Pulmonary Embolism Rule-out Criteria (PERC)
= Aer','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[82],"source_qid":null,"duplicate_group_id":"exact-2e9bc18464dc","duplicate_sources":[{"record_id":"c55be535f0be796a8b05","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":82,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,NULL,NULL,NULL,'needs_verification','[]','high','{"record_id":"c55be535f0be796a8b05","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_year":2025,"source_page":82,"supporting_pages":[82],"source_qid":null,"domain_hint":"Respiratory","stem":"A 42-year-old woman sustained a motor vehicle accident (MVA) and fractured her femoral neck, which is surgically fixed. Five days after\nthe surgery, she develops sudden-onset chest pain and dyspnea. She is on oral contraceptive pills. On examination, she is afebrile and\nhas a heart rate of 100 bpm, BP of 110/70 mmHg, and a respiratory rate of 24 breaths per minute. Lungs are clear to auscultation. Chest\nX-ray and ECG are normal. Which one of the following is the most appropriate next step in management?","options":{"A":"A. Duplex doppler ultrasound scan of lower limbs.","B":"B. D-dimer assay.","C":"C. Computed tomography pulmonary angiography (CTPA).","D":"D. Arterial blood gas (ABG) analysis.","E":"OE. V/Q scan."},"source_answer":"E","source_explanation":"Orthopedic surgery is a strong risk factor for the development of venous thromboembolism in the post-op period. For every patient with\nmajor surgery within the past 4 weeks or immobilization longer than 3 days, who have signs and symptoms such as dyspnea, chest pain\n(especially pleuretic or sudden onset), cough, hemoptysis, or hypoxia, pulmonary embolism (PE) should always be suspected and\npromptly investigated.\n\nCTPA and V/Q scan are confirmatory tests for PE if, through pretest probability assessment, PE is a likely diagnosis. There are rules\nreferred to as Clinical Decision Rules (CDR) for this purpose. CDRs consider different items to calculate the likelihood of PE as a\ndiagnosis to prevent unnecessary diagnostic testing or treatment.\n\nOne of the most recently validated and practical of these CDRs is Simplified Wells Score (SWS). SWS gives seven items one score each\n(if present). Patients with scores 2 or higher are likely to have PE and should undergo imaging studies either by CTPA or V/Q scan, while\npatients with scores 0 or 1 are unlikely to have PE. In this group, a D-dimer assay is used to safely exclude PE.\n\nD-dimer is a fibrin degeneration product. High levels of D-dimer represent the presence of thrombus and trigger further confirmatory\ndiagnostic tests for a definite diagnosis. Negative results have a high negative predictive value and are sensitive enough to exclude PE in\npatients with low to moderate pretest probability of PE. D-dimer levels are, however, elevated in the post-surgery (first 2 weeks) period,\npregnancy, inflammation, infection, and cancer, making a negative result less likely and the test less desirable where these conditions are\npresent.\n\nThe following diagram shows the approach to patients with suspected PE based on SWS:\n\nified Wells Score\n\n1\n1\n1\n1\n1\n\n1 PE unlikely\n\nPulmonary Embolism Rule-out Criteria (PERC)\n= Aer","source_answer_status":"present","current_answer":null,"current_answer_status":"needs_verification","current_evidence":[],"currentness_risk":"high","currentness_keywords":["age","contracept","management","pregnan","treatment"],"likely_visual_question":true,"parser_confidence":"medium","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","stem_hash":"2e9bc18464dcae70125df0ddc73f57f0ed08bd93","duplicate_group_id":"exact-2e9bc18464dc","duplicate_sources":[{"record_id":"c55be535f0be796a8b05","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":82,"source_qid":null}]}',1,'v2.9.4','2026-09-24T00:00:00.000Z') ON CONFLICT(record_id) DO UPDATE SET source_file=excluded.source_file,source_page=excluded.source_page,domain=excluded.domain,stem=excluded.stem,options_json=excluded.options_json,source_answer=excluded.source_answer,source_explanation=excluded.source_explanation,provenance_json=excluded.provenance_json,visual_asset=excluded.visual_asset,visual_url=excluded.visual_url,options_mode=excluded.options_mode,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk,record_json=excluded.record_json,active_quiz=excluded.active_quiz,import_version=excluded.import_version,imported_at=excluded.imported_at;
--> statement-breakpoint
INSERT INTO questions (id,source_id,source_question_no,source_page,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,image_ref,source_year,import_version,active,options_mode,provenance_json,current_answer,current_answer_status,current_evidence_json,currentness_risk) VALUES ('c55be535f0be796a8b05','src-v294-b0ec7cfe',NULL,'82','Respiratory','Respiratory','Respiratory','AMC MCQ','A 42-year-old woman sustained a motor vehicle accident (MVA) and fractured her femoral neck, which is surgically fixed. Five days after
the surgery, she develops sudden-onset chest pain and dyspnea. She is on oral contraceptive pills. On examination, she is afebrile and
has a heart rate of 100 bpm, BP of 110/70 mmHg, and a respiratory rate of 24 breaths per minute. Lungs are clear to auscultation. Chest
X-ray and ECG are normal. Which one of the following is the most appropriate next step in management?',NULL,'E','Orthopedic surgery is a strong risk factor for the development of venous thromboembolism in the post-op period. For every patient with
major surgery within the past 4 weeks or immobilization longer than 3 days, who have signs and symptoms such as dyspnea, chest pain
(especially pleuretic or sudden onset), cough, hemoptysis, or hypoxia, pulmonary embolism (PE) should always be suspected and
promptly investigated.

CTPA and V/Q scan are confirmatory tests for PE if, through pretest probability assessment, PE is a likely diagnosis. There are rules
referred to as Clinical Decision Rules (CDR) for this purpose. CDRs consider different items to calculate the likelihood of PE as a
diagnosis to prevent unnecessary diagnostic testing or treatment.

One of the most recently validated and practical of these CDRs is Simplified Wells Score (SWS). SWS gives seven items one score each
(if present). Patients with scores 2 or higher are likely to have PE and should undergo imaging studies either by CTPA or V/Q scan, while
patients with scores 0 or 1 are unlikely to have PE. In this group, a D-dimer assay is used to safely exclude PE.

D-dimer is a fibrin degeneration product. High levels of D-dimer represent the presence of thrombus and trigger further confirmatory
diagnostic tests for a definite diagnosis. Negative results have a high negative predictive value and are sensitive enough to exclude PE in
patients with low to moderate pretest probability of PE. D-dimer levels are, however, elevated in the post-surgery (first 2 weeks) period,
pregnancy, inflammation, infection, and cancer, making a negative result less likely and the test less desirable where these conditions are
present.

The following diagram shows the approach to patients with suspected PE based on SWS:

ified Wells Score

1
1
1
1
1

1 PE unlikely

Pulmonary Embolism Rule-out Criteria (PERC)
= Aer',NULL,'Retain the source-era answer for question-bank study; verify current Australian guidance before clinical use.',NULL,NULL,'2025','v2.9.4',1,'text','{"source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","supporting_pages":[82],"source_qid":null,"duplicate_group_id":"exact-2e9bc18464dc","duplicate_sources":[{"record_id":"c55be535f0be796a8b05","record_type":"text_mcq","source_file":"Respiratory and chest amedex 2025.pdf","source_relative_path":"AMEDEX2025+redbook+handbook图片题/Respiratory and chest amedex 2025.pdf","source_page":82,"source_qid":null}],"parser_version":"2.7.1-parser-only-conservative-staging-2026-09-22","parser_mode":"v27_same_page_five_structural","text_method":"tesseract_retry_200dpi_psm3","visual_asset":null,"asset_preview_url":null}',NULL,'needs_verification','[]','high') ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,source_question_no=excluded.source_question_no,source_page=excluded.source_page,domain=excluded.domain,system=excluded.system,topic=excluded.topic,clinical_task=excluded.clinical_task,stem_en=excluded.stem_en,answer_key=excluded.answer_key,source_explanation_en=excluded.source_explanation_en,memory_rule_en=excluded.memory_rule_en,image_ref=excluded.image_ref,source_year=excluded.source_year,import_version=excluded.import_version,active=1,options_mode=excluded.options_mode,provenance_json=excluded.provenance_json,current_answer=excluded.current_answer,current_answer_status=excluded.current_answer_status,current_evidence_json=excluded.current_evidence_json,currentness_risk=excluded.currentness_risk;
--> statement-breakpoint
INSERT INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES ('node-v294-16df2dfb','Respiratory — question-bank review','Respiratory','Respiratory','Respiratory','AMC MCQ','Imported source-era questions in Respiratory; current Australian guidance remains separately verified.',NULL) ON CONFLICT(id) DO UPDATE SET canonical_name=excluded.canonical_name,domain=excluded.domain,system=excluded.system,condition=excluded.condition,current_summary=excluded.current_summary;
--> statement-breakpoint
INSERT INTO question_node_links (question_id,node_id,weight,relation_type) VALUES ('c55be535f0be796a8b05','node-v294-16df2dfb',1,'domain') ON CONFLICT(question_id,node_id) DO UPDATE SET weight=excluded.weight,relation_type=excluded.relation_type;
--> statement-breakpoint
DELETE FROM question_options WHERE question_id='c55be535f0be796a8b05';
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c55be535f0be796a8b05-A','c55be535f0be796a8b05','A','A. Duplex doppler ultrasound scan of lower limbs.',NULL,1);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c55be535f0be796a8b05-B','c55be535f0be796a8b05','B','B. D-dimer assay.',NULL,2);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c55be535f0be796a8b05-C','c55be535f0be796a8b05','C','C. Computed tomography pulmonary angiography (CTPA).',NULL,3);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c55be535f0be796a8b05-D','c55be535f0be796a8b05','D','D. Arterial blood gas (ABG) analysis.',NULL,4);
--> statement-breakpoint
INSERT INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES ('c55be535f0be796a8b05-E','c55be535f0be796a8b05','E','OE. V/Q scan.',NULL,5);
