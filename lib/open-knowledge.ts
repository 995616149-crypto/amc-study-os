import { scheduleFsrs, ratingFor, type FsrsCard } from "./fsrs";

export const PSVT_CHAPTER_ID = "cardiology_psvt";
export const PSVT_CHAPTER = {
  id: PSVT_CHAPTER_ID,
  title: "Paroxysmal supraventricular tachycardia (PSVT / SVT)",
  condition: "Paroxysmal supraventricular tachycardia",
  system: "Cardiovascular medicine",
  version: "v12.0.0",
  sections: [
    { id: "definition", title: "1. Definition and clinical frame", body: "PSVT is a clinical description for a rapid rhythm arising above the ventricles that starts and stops abruptly. It most often refers to AVNRT or AVRT, but the label should never replace rhythm analysis.", blocks: [
      { type: "paragraph", text: "A useful bedside definition is a sudden-onset, usually regular tachycardia whose circuit or focus is supraventricular. The patient may use the word ‘racing’, but the clinician must still establish rate, regularity, QRS width and haemodynamic effect." },
      { type: "callout", title: "Core distinction", text: "PSVT describes the presentation. AVNRT, AVRT and atrial tachycardia describe mechanisms. Management begins with physiology and ECG pattern before the precise mechanism is proven." },
    ] },
    { id: "classification", title: "2. Classification at the bedside", body: "Classify by stability, regularity and QRS width before naming a drug.", blocks: [
      { type: "table", headers: ["Axis", "Finding", "Why it matters"], rows: [["Haemodynamics","Stable vs unstable","Instability overrides fine rhythm classification and prompts urgent electrical management."],["Regularity","Regular vs irregular","Irregularity raises atrial fibrillation/flutter with variable conduction and changes drug safety."],["QRS","Narrow vs broad","Broad-complex tachycardia is treated cautiously; ventricular tachycardia must be considered."],["Mechanism","AVNRT / AVRT / atrial tachycardia","Explains P-wave position, recurrence and definitive treatment."]] },
    ] },
    { id: "electrophysiological_mechanisms", title: "3. Electrophysiological mechanisms", body: "Most PSVT is re-entry: an impulse continuously travels around tissue with different conduction and recovery properties.", blocks: [
      { type: "table", headers: ["Mechanism", "Circuit", "Typical ECG clue"], rows: [["AVNRT","Re-entry within or adjacent to the AV node using fast and slow pathways.","Atrial and ventricular activation are nearly simultaneous; P waves may be hidden or appear just after QRS."],["Orthodromic AVRT","Antegrade conduction through the AV node and retrograde return through an accessory pathway.","Usually narrow QRS with a retrograde P wave after QRS."],["Antidromic AVRT","Antegrade conduction through an accessory pathway and return through the AV node.","Broad QRS; requires expert differentiation from ventricular tachycardia."],["Focal atrial tachycardia","Automatic, triggered or micro-re-entrant atrial focus; AV node is not required for the atrial rhythm.","Abnormal P-wave morphology; AV block may reveal continuing atrial activity."]] },
      { type: "callout", title: "Why AV-nodal manoeuvres help", text: "AVNRT and orthodromic AVRT require the AV node, so transient AV-nodal block can terminate the circuit. Atrial flutter or atrial tachycardia may continue while ventricular conduction briefly slows, revealing the diagnosis." },
    ] },
    { id: "epidemiology_precipitants", title: "4. Epidemiology and precipitants", body: "Episodes can occur in structurally normal hearts and across the lifespan.", blocks: [
      { type: "bullets", items: ["Ask about caffeine and other stimulants, alcohol, decongestants, recreational drugs and recent medication changes.","Consider fever, pain, anaemia, hypovolaemia, thyroid disease and electrolyte disturbance when the history suggests a secondary driver.","Pregnancy, congenital heart disease and prior cardiac surgery alter the differential and escalation threshold.","A trigger may explain an episode but does not prove the rhythm mechanism."] },
    ] },
    { id: "clinical_presentation", title: "5. Clinical presentation", body: "Abrupt palpitations are common; symptoms reflect rate, duration, comorbidity and ventricular filling.", blocks: [
      { type: "table", headers: ["History", "Examination"], rows: [["Abrupt or gradual onset; abrupt offset; prior identical episodes","Pulse rate and regularity; blood pressure; perfusion and mental state"],["Palpitations, light-headedness, dyspnoea, chest discomfort, polyuria","Heart failure signs, ongoing ischaemia, shock or syncope-related injury"],["Precipitant, medication, pregnancy possibility, structural heart disease","Look for a secondary cause rather than attributing every tachycardia to PSVT"]] },
    ] },
    { id: "red_flags_instability", title: "6. Red flags and haemodynamic instability", body: "Instability is a clinical judgement linking the tachycardia to compromised perfusion.", blocks: [
      { type: "callout", title: "Treat the patient, not a rate threshold", text: "Hypotension with shock, altered consciousness, ongoing ischaemic chest pain or acute pulmonary oedema attributable to the tachycardia supports urgent synchronised cardioversion and senior escalation." },
      { type: "bullets", items: ["Apply monitoring, IV access and resuscitation readiness while the rhythm is assessed.","Do not delay time-critical electrical treatment to obtain a perfect 12-lead trace.","If the patient is stable, preserve diagnostic information with a 12-lead ECG before termination when feasible."] },
    ] },
    { id: "ecg_features", title: "7. ECG analysis", body: "Read the ECG in a fixed order: rate, regularity, QRS width, atrial activity and the relationship of P waves to QRS.", blocks: [
      { type: "algorithm", steps: ["Is the rhythm causing instability?","Is it regular or irregular?","Is the QRS narrow or broad?","Can atrial activity be identified before, within or after QRS?","Compare a post-conversion ECG for pre-excitation, baseline conduction disease or ischaemia."] },
      { type: "table", headers: ["Pattern", "Interpretive clue"], rows: [["Regular narrow-complex tachycardia","AVNRT and orthodromic AVRT are common; atrial tachycardia/flutter remain possible."],["Pseudo r′ in V1 or pseudo S in inferior leads","May reflect retrograde atrial activation in typical AVNRT; not required for diagnosis."],["Short RP with retrograde P after QRS","Can support AVNRT or orthodromic AVRT; exact mechanism may require EP study."],["Irregular broad-complex tachycardia","Do not assume benign SVT with aberrancy; consider pre-excited AF and polymorphic VT."]] },
    ] },
    { id: "differential_diagnosis", title: "8. Differential diagnosis", body: "The differential is organised by onset, regularity, width and atrial activity.", blocks: [
      { type: "table", headers: ["Rhythm", "Features against simple PSVT"], rows: [["Sinus tachycardia","Usually gradual onset/offset with a physiological driver and sinus P waves."],["Atrial flutter","Atrial activity may be concealed at 2:1 conduction; transient AV block can expose flutter waves."],["Atrial fibrillation","Irregularly irregular; broad irregular rhythm raises pre-excitation concern."],["Focal atrial tachycardia","Abnormal P morphology and atrial rhythm that persists despite AV block."],["Ventricular tachycardia","Broad complex, AV dissociation or structural heart disease; when uncertain, use a VT-safe pathway."]] },
    ] },
    { id: "investigations", title: "9. Investigations", body: "Testing should capture the rhythm and identify contributors without delaying urgent care.", blocks: [
      { type: "table", headers: ["Investigation", "Purpose"], rows: [["12-lead ECG during symptoms","Defines width, regularity and atrial–ventricular relationship."],["Post-conversion ECG","Looks for pre-excitation, baseline conduction abnormalities and other substrate."],["Electrolytes ± magnesium; glucose","Detects reversible metabolic contributors when clinically relevant."],["Thyroid testing, full blood count, troponin","Selected by history; not a mandatory panel for every uncomplicated episode."],["Ambulatory monitor","Documents intermittent symptoms when no ECG was captured."],["Echocardiography","Assesses structural disease when examination, ECG or clinical course indicates." ]] },
    ] },
    { id: "acute_management", title: "10. Acute management", body: "The acute pathway separates unstable tachycardia from stable regular narrow-complex SVT.", blocks: [
      { type: "algorithm", steps: ["Assess ABCs, monitor the rhythm and decide whether the tachycardia is causing haemodynamic instability.","If unstable: follow the urgent synchronised cardioversion pathway with appropriate sedation only when it does not delay treatment.","If stable and regular narrow-complex: attempt an appropriate vagal manoeuvre, commonly a modified Valsalva in a cooperative adult.","If the rhythm persists: use the monitored local pharmacological termination protocol with resuscitation capability.","Record the rhythm response. Transient AV block without termination may reveal flutter or atrial tachycardia."] },
      { type: "callout", title: "Exam sequence", text: "The first manoeuvre, the next monitored drug and definitive recurrence prevention are different questions. Match the option to the point in the sequence described by the stem." },
    ] },
    { id: "pharmacology", title: "11. Pharmacology and response", body: "Short-acting AV-nodal blockade can be diagnostic and therapeutic for AV-node-dependent regular SVT.", blocks: [
      { type: "table", headers: ["Class", "Role", "Important cautions"], rows: [["Rapid short-acting AV-nodal blocker","Terminates many AVNRT/orthodromic AVRT episodes under monitored protocol; may unmask atrial activity.","Transient flushing, chest discomfort and dyspnoea are common; severe bronchospasm risk and transplant/drug interactions require protocol-specific care."],["Non-dihydropyridine calcium-channel blocker","Selected stable patients when the standard short-acting pathway is unsuitable or unsuccessful.","Avoid in hypotension, significant systolic dysfunction and situations where an irregular pre-excited rhythm is possible."],["Beta blocker","May be considered in selected stable or recurrent settings.","Bradycardia, hypotension, bronchospasm and combined AV-nodal blockade require caution."]] },
      { type: "paragraph", text: "Exact drug selection and dose are current-practice claims. In this Study OS they belong to the evidence-gated Current Guidance layer rather than being silently inferred from an old question-bank answer." },
    ] },
    { id: "contraindications_cautions", title: "12. Contraindications and high-risk patterns", body: "The greatest safety error is applying a narrow regular SVT algorithm to a rhythm that does not fit it.", blocks: [
      { type: "bullets", items: ["Irregular broad-complex tachycardia with suspected pre-excitation: avoid reflex AV-nodal blockade and escalate urgently.","Regular broad-complex tachycardia: ventricular tachycardia remains a priority diagnosis until safely characterised.","Asthma or active bronchospasm, severe hypotension and relevant drug interactions change pharmacological choices.","Carotid sinus massage is not a routine substitute for a safer vagal strategy and has vascular/neurological contraindications.","Never let medication preparation displace synchronised cardioversion when the tachycardia is causing instability."] },
    ] },
    { id: "wpw_preexcitation", title: "13. WPW and pre-excitation", body: "An accessory pathway may be concealed during sinus rhythm or produce pre-excitation.", blocks: [
      { type: "paragraph", text: "A short PR interval and delta wave on a resting ECG suggest manifest pre-excitation. Orthodromic AVRT usually travels down the AV node and back up the pathway, so its tachycardia QRS can still be narrow." },
      { type: "callout", title: "Pre-excited atrial fibrillation", text: "A very rapid, irregular, broad-complex rhythm can conduct through the accessory pathway. This is not the setting for a routine AV-nodal blocking sequence; obtain urgent expert management through the current protocol." },
    ] },
    { id: "long_term_management", title: "14. Long-term management and follow-up", body: "Follow-up converts an isolated episode into a documented diagnosis and shared recurrence plan.", blocks: [
      { type: "bullets", items: ["Keep the episode ECG and obtain a baseline ECG after conversion.","Review frequency, duration, syncope, occupation, pregnancy plans, structural heart disease and patient preference.","Teach a safe self-management plan only after the rhythm and manoeuvre have been reviewed.","Address genuine triggers without implying that lifestyle alone cures a re-entry circuit.","Refer for cardiology/electrophysiology review when episodes recur, cause high-risk symptoms, remain diagnostically uncertain or when definitive therapy is preferred."] },
    ] },
    { id: "catheter_ablation", title: "15. Electrophysiology study and catheter ablation", body: "Ablation can provide definitive treatment for recurrent symptomatic AVNRT, AVRT and selected atrial tachycardias.", blocks: [
      { type: "paragraph", text: "An EP study induces and maps the circuit. AVNRT treatment modifies the slow pathway; AVRT treatment targets the accessory pathway. The consent discussion includes success, recurrence, vascular complications, cardiac perforation and mechanism-specific conduction-system risk." },
      { type: "callout", title: "When it becomes attractive", text: "Frequent symptoms, syncope or high-risk features, medication intolerance, patient preference and an accessory pathway can all move definitive therapy earlier in the discussion." },
    ] },
    { id: "special_populations", title: "16. Pregnancy and paediatrics", body: "Physiology, manoeuvre choice and escalation differ across life stages.", blocks: [
      { type: "table", headers: ["Population", "Study focus"], rows: [["Pregnancy","Assess maternal stability first, involve obstetric/cardiology expertise, minimise fetal risk without withholding time-critical maternal treatment, and verify drug-specific advice in current guidance."],["Infants and children","Presentation may include poor feeding, pallor, irritability or heart failure. Age-appropriate vagal manoeuvres and weight-based protocols require paediatric support."],["Older or structural-heart-disease patients","Lower tolerance of rapid rates and a broader differential increase the need for cautious rhythm classification and monitoring."]] },
      { type: "paragraph", text: "For a stable infant, a correctly performed cold-stimulus facial vagal manoeuvre may be used within a paediatric protocol. It is not equivalent to unsupervised whole-body immersion." },
    ] },
    { id: "complications", title: "17. Complications and common traps", body: "Most episodes terminate without permanent harm, but prolonged or poorly tolerated tachycardia can cause important complications.", blocks: [
      { type: "table", headers: ["Complication", "Clinical implication"], rows: [["Syncope or injury","Raises risk and changes referral urgency."],["Myocardial ischaemia / acute heart failure","May represent instability requiring urgent electrical treatment."],["Tachycardia-mediated cardiomyopathy","Consider with frequent or incessant tachycardia and reduced ventricular function."],["Diagnostic anchoring","A regular tachycardia is not automatically AVNRT; preserve ECG evidence and reassess after transient AV block."]] },
    ] },
    { id: "amc_high_yield", title: "18. AMC high-yield reasoning", body: "The safe answer follows the stem's stability, rhythm pattern and point in the treatment sequence.", blocks: [
      { type: "bullets", items: ["Unstable because of the tachycardia → urgent synchronised cardioversion pathway.","Stable + regular + narrow → vagal manoeuvre before the monitored pharmacological step, unless the stem states it has already failed.","Irregular or broad → stop and reclassify; do not force the rhythm into the narrow-SVT algorithm.","AV-nodal blockade can terminate AVNRT/AVRT but may only expose atrial activity in flutter or atrial tachycardia.","Recurrent symptomatic AVNRT/AVRT → recognise catheter ablation as a potentially definitive strategy."] },
    ] },
    { id: "australian_current_practice", title: "19. Australian Current Practice Overlay", body: "This section is deliberately separated from the stable textbook core.", blocks: [
      { type: "callout", title: "Evidence gate", text: "Current answer, exact dosing, contraindication and guideline-change claims are displayed only when the existing Current Evidence service has verified Australian authoritative sources. Otherwise the status stays UNVERIFIED and the source-era answer remains visibly separate." },
    ] },
    { id: "my_weak_points", title: "20. My Weak Points", body: "Personal weakness is generated only from real attempts mapped to the tested concept.", blocks: [
      { type: "bullets", items: ["Wrong + Confident is a high-priority misconception signal.","Correct + Guess remains a hidden weakness rather than mastery.","Unattempted concepts remain unassessed.","Notes are personal study aids and never alter evidence status, marking or FSRS ratings."] },
    ] },
  ],
};

export const PSVT_MAPPINGS = [
  {
    questionId: "008089fac064a6c9d88a", chapterId: PSVT_CHAPTER_ID, sectionId: "acute_management",
    testedConceptId: "cardiology_psvt.acute_management.pharmacological_termination_stable",
    testedConceptLabel: "Pharmacological termination of stable PSVT", clinicalTask: "Immediate management / drug choice", errorDomain: "drug_choice",
  },
  {
    questionId: "e4e52e1f723ae0282489", chapterId: PSVT_CHAPTER_ID, sectionId: "acute_management",
    testedConceptId: "cardiology_psvt.acute_management.initial_vagal_manoeuvre_paediatric_stable",
    testedConceptLabel: "Initial vagal manoeuvre for stable paediatric SVT", clinicalTask: "Immediate management / first step", errorDomain: "treatment_sequence",
  },
] as const;

export async function ensureOpenKnowledgeCatalog(database: D1Database) {
  const now = new Date().toISOString();
  const statements = [database.prepare(`INSERT INTO knowledge_chapters (id,title,condition,system,sections_json,version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title, condition=excluded.condition, system=excluded.system, sections_json=excluded.sections_json, version=excluded.version, updated_at=excluded.updated_at`)
    .bind(PSVT_CHAPTER.id, PSVT_CHAPTER.title, PSVT_CHAPTER.condition, PSVT_CHAPTER.system, JSON.stringify(PSVT_CHAPTER.sections), PSVT_CHAPTER.version, now, now)];
  for (const mapping of PSVT_MAPPINGS) statements.push(database.prepare(`INSERT INTO question_concept_map (question_id,chapter_id,section_id,tested_concept_id,tested_concept_label,clinical_task,error_domain,mapping_version,updated_at)
    SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM questions WHERE id=?)
    ON CONFLICT(question_id) DO UPDATE SET chapter_id=excluded.chapter_id, section_id=excluded.section_id, tested_concept_id=excluded.tested_concept_id, tested_concept_label=excluded.tested_concept_label, clinical_task=excluded.clinical_task, error_domain=excluded.error_domain, mapping_version=excluded.mapping_version, updated_at=excluded.updated_at`)
    .bind(mapping.questionId,mapping.chapterId,mapping.sectionId,mapping.testedConceptId,mapping.testedConceptLabel,mapping.clinicalTask,mapping.errorDomain,PSVT_CHAPTER.version,now,mapping.questionId));
  await database.batch(statements);
}

export async function ensureHistoricalConceptFsrs(database: D1Database, userId: string) {
  const existing = await database.prepare(`SELECT tested_concept_id FROM concept_fsrs_state WHERE user_id=?`).bind(userId).all<{tested_concept_id:string}>();
  const existingIds = new Set(existing.results.map((row) => row.tested_concept_id));
  const history = await database.prepare(`SELECT a.id,a.question_id,a.correct,a.confidence,a.attempted_at,m.chapter_id,m.section_id,m.tested_concept_id,m.error_domain
    FROM attempts a JOIN question_concept_map m ON m.question_id=a.question_id WHERE a.user_id=? ORDER BY a.attempted_at ASC`).bind(userId).all<any>();
  const cards = new Map<string, FsrsCard>();
  const meta = new Map<string, any>();
  for (const row of history.results) {
    if (existingIds.has(row.tested_concept_id)) continue;
    const rating = ratingFor(Boolean(row.correct), row.confidence);
    cards.set(row.tested_concept_id, scheduleFsrs(cards.get(row.tested_concept_id) ?? null, rating, new Date(row.attempted_at)));
    meta.set(row.tested_concept_id, row);
  }
  const statements: D1PreparedStatement[] = [];
  for (const [conceptId, card] of cards) {
    const row = meta.get(conceptId);
    statements.push(database.prepare(`INSERT OR IGNORE INTO concept_fsrs_state (user_id,tested_concept_id,chapter_id,section_id,due_at,stability,difficulty,last_reviewed_at,scheduled_days,reps,lapses,state,last_rating,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(userId,conceptId,row.chapter_id,row.section_id,card.dueAt,card.stability,card.difficulty,card.lastReviewedAt,card.scheduledDays,card.reps,card.lapses,card.state,card.lastRating,card.priority));
  }
  if (statements.length) await database.batch(statements);
  await database.prepare(`UPDATE attempts SET chapter_id=(SELECT chapter_id FROM question_concept_map WHERE question_id=attempts.question_id), section_id=(SELECT section_id FROM question_concept_map WHERE question_id=attempts.question_id), tested_concept_id=(SELECT tested_concept_id FROM question_concept_map WHERE question_id=attempts.question_id), error_domain=coalesce(error_domain,(SELECT error_domain FROM question_concept_map WHERE question_id=attempts.question_id)) WHERE user_id=? AND question_id IN (SELECT question_id FROM question_concept_map)`).bind(userId).run();
}

const V11_E2E_ATTEMPT = {
  id: "4793ac1c-7b40-4c2d-91cd-0ab3b0c6cdc6",
  questionId: "008089fac064a6c9d88a",
  attemptedAt: "2026-09-26T14:12:26.640Z",
};

// One narrowly-scoped, idempotent cleanup.  It cannot match or delete any
// genuine attempt because every identifying field of the v11 E2E record is
// checked before deletion.  Derived concept scheduling is then replayed from
// the learner's remaining real history.
export async function applyV12DataHygiene(database: D1Database, userId: string) {
  const migrationId = "v12-remove-explicit-v11-e2e-attempt";
  // The row identity is (user_id, id), not id alone: `id` is a constant
  // migration name, so reusing it as the primary key made the second learner to
  // ever sign in fail the whole boot with a UNIQUE violation.  The row is now
  // namespaced per user, and the original un-namespaced row (written before this
  // fix) is still recognised so nothing is replayed for that learner.
  const rowId = `${migrationId}:${userId}`;
  const applied = await database.prepare("SELECT id FROM data_hygiene_migrations WHERE user_id=? AND (id=? OR id=?)").bind(userId, rowId, migrationId).first();
  if (applied) return;
  const target = await database.prepare(`SELECT id,tested_concept_id FROM attempts WHERE id=? AND user_id=? AND question_id=? AND selected_answer='A' AND confidence='confident' AND error_type='misconception' AND attempted_at=?`)
    .bind(V11_E2E_ATTEMPT.id, userId, V11_E2E_ATTEMPT.questionId, V11_E2E_ATTEMPT.attemptedAt).first<any>();
  const touchedNodes = target ? await database.prepare("SELECT DISTINCT node_id FROM node_evidence WHERE user_id=? AND attempt_id=?").bind(userId, target.id).all<{node_id:string}>() : { results: [] as {node_id:string}[] };
  if (target) {
    await database.prepare("DELETE FROM node_evidence WHERE user_id=? AND attempt_id=?").bind(userId, target.id).run();
    await database.prepare("DELETE FROM attempts WHERE id=? AND user_id=?").bind(target.id, userId).run();
    const mapping = await database.prepare("SELECT chapter_id,section_id,tested_concept_id FROM question_concept_map WHERE question_id=?").bind(V11_E2E_ATTEMPT.questionId).first<any>();
    if (mapping) {
      const history = await database.prepare(`SELECT a.correct,a.confidence,a.attempted_at FROM attempts a JOIN question_concept_map m ON m.question_id=a.question_id WHERE a.user_id=? AND m.tested_concept_id=? ORDER BY a.attempted_at ASC`).bind(userId, mapping.tested_concept_id).all<any>();
      let card: FsrsCard | null = null;
      for (const row of history.results) card = scheduleFsrs(card, ratingFor(Boolean(row.correct), row.confidence), new Date(row.attempted_at));
      if (card) {
        await database.prepare(`INSERT INTO concept_fsrs_state (user_id,tested_concept_id,chapter_id,section_id,due_at,stability,difficulty,last_reviewed_at,scheduled_days,reps,lapses,state,last_rating,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(user_id,tested_concept_id) DO UPDATE SET chapter_id=excluded.chapter_id,section_id=excluded.section_id,due_at=excluded.due_at,stability=excluded.stability,difficulty=excluded.difficulty,last_reviewed_at=excluded.last_reviewed_at,scheduled_days=excluded.scheduled_days,reps=excluded.reps,lapses=excluded.lapses,state=excluded.state,last_rating=excluded.last_rating,priority=excluded.priority`)
          .bind(userId,mapping.tested_concept_id,mapping.chapter_id,mapping.section_id,card.dueAt,card.stability,card.difficulty,card.lastReviewedAt,card.scheduledDays,card.reps,card.lapses,card.state,card.lastRating,card.priority).run();
        for (const node of touchedNodes.results) await database.prepare(`UPDATE review_state SET due_at=?,stability=?,difficulty=?,interval_days=?,last_reviewed_at=?,lapse_count=?,priority=? WHERE user_id=? AND node_id=?`)
          .bind(card.dueAt,card.stability,card.difficulty,Math.max(0,Math.round(card.scheduledDays)),card.lastReviewedAt,card.lapses,card.priority,userId,node.node_id).run();
      } else {
        await database.prepare("DELETE FROM concept_fsrs_state WHERE user_id=? AND tested_concept_id=?").bind(userId, mapping.tested_concept_id).run();
      }
    }
  }
  await database.prepare("INSERT OR IGNORE INTO data_hygiene_migrations (id,user_id,applied_at,details_json) VALUES (?,?,?,?)")
    .bind(rowId, userId, new Date().toISOString(), JSON.stringify({ matchedAndDeleted: Boolean(target), attemptId: V11_E2E_ATTEMPT.id, genuineHistoryPreserved: true })).run();
}
