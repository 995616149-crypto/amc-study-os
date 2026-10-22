// Deterministic, versioned topic ontology. Every source record receives a
// topic node, but only explicit evidence can produce a disease/condition node.
// OCR-damaged records fall back to specialty + clinical task, never a guessed
// diagnosis. This keeps coverage complete without overstating precision.
type Entry = readonly [label: string, domain: string, aliases: readonly string[]];
const TERMS: Entry[] = [
  ["Acute coronary syndrome","Cardiology",["acute coronary syndrome","myocardial infarction","stemi","nstemi","unstable angina"]],
  ["Heart failure","Cardiology",["heart failure","cardiac failure","pulmonary oedema","pulmonary edema"]],
  ["Atrial fibrillation","Cardiology",["atrial fibrillation","atrial flutter"]],
  ["Venous thromboembolism","Cardiology",["pulmonary embolism","deep vein thrombosis","dvt","venous thromboembolism"]],
  ["Peripheral arterial disease","Cardiology",["claudication","peripheral arterial","limb ischaemia","limb ischemia"]],
  ["Hypertension","Cardiology",["hypertension","hypertensive emergency","high blood pressure"]],
  ["Valvular heart disease","Cardiology",["aortic stenosis","mitral stenosis","mitral regurgitation","aortic regurgitation"]],
  ["Cardiac arrhythmia","Cardiology",["supraventricular tachycardia","ventricular tachycardia","bradycardia","heart block","long qt"]],
  ["Stroke and TIA","Neurology",["stroke","transient ischaemic attack","transient ischemic attack","tia","hemiparesis"]],
  ["Seizures and epilepsy","Neurology",["seizure","epilepsy","status epilepticus","convulsion"]],
  ["Headache and migraine","Neurology",["migraine","cluster headache","thunderclap headache"]],
  ["Meningitis and encephalitis","Neurology",["meningitis","encephalitis","meningococcal"]],
  ["Parkinson disease","Neurology",["parkinson","resting tremor"]],
  ["Dementia and cognitive impairment","Neurology",["dementia","alzheimer","cognitive impairment"]],
  ["Asthma","Respiratory",["asthma","status asthmaticus"]],
  ["Chronic obstructive pulmonary disease","Respiratory",["copd","chronic obstructive pulmonary","emphysema"]],
  ["Pneumonia","Respiratory",["pneumonia","pneumonitis","chest infection"]],
  ["Pneumothorax","Respiratory",["pneumothorax","tension pneumothorax"]],
  ["Lung cancer","Respiratory",["lung cancer","bronchogenic carcinoma"]],
  ["Sleep apnoea","Respiratory",["sleep apnoea","sleep apnea","obstructive sleep"]],
  ["Tuberculosis","Infectious Disease",["tuberculosis","pulmonary tb","latent tb"]],
  ["HIV infection","Infectious Disease",["hiv","aids"]],
  ["Sepsis","Emergency Medicine",["sepsis","septic shock","septicaemia"]],
  ["Anaphylaxis","Emergency Medicine",["anaphylaxis","anaphylactic"]],
  ["Poisoning and overdose","Emergency Medicine",["overdose","poisoning","paracetamol toxicity","toxic ingestion"]],
  ["Burns","Emergency Medicine",["burn injury","thermal burn","burns"]],
  ["Bowel obstruction","Gastroenterology",["bowel obstruction","intestinal obstruction","small bowel obstruction","large bowel obstruction","no bowel movement","no flatus"]],
  ["Appendicitis","Gastroenterology",["appendicitis","appendix"]],
  ["Cholecystitis and gallstones","Gastroenterology",["cholecystitis","cholelithiasis","gallstone","biliary colic"]],
  ["Pancreatitis","Gastroenterology",["pancreatitis"]],
  ["Gastrointestinal bleeding","Gastroenterology",["gastrointestinal bleeding","gi bleed","haematemesis","hematemesis","melaena","melena"]],
  ["Peptic ulcer disease","Gastroenterology",["peptic ulcer","duodenal ulcer","gastric ulcer"]],
  ["Inflammatory bowel disease","Gastroenterology",["crohn","ulcerative colitis","inflammatory bowel disease"]],
  ["Colorectal cancer","Gastroenterology",["colorectal cancer","colon cancer","rectal cancer","bowel cancer"]],
  ["Hernia","Gastroenterology",["hernia","strangulated femoral"]],
  ["Haemorrhoids and anal fissure","Gastroenterology",["hemorrhoid","haemorrhoid","anal fissure","perianal pain"]],
  ["Hepatitis and liver disease","Gastroenterology",["hepatitis","cirrhosis","liver failure"]],
  ["Diabetes mellitus","Endocrinology",["diabetes mellitus","diabetic ketoacidosis","dka","hyperosmolar"]],
  ["Thyroid disorders","Endocrinology",["hyperthyroid","hypothyroid","thyrotoxicosis","thyroid nodule","goitre"]],
  ["Adrenal disorders","Endocrinology",["addison","adrenal insufficiency","cushing","phaeochromocytoma"]],
  ["Osteoporosis","Endocrinology",["osteoporosis","osteopenia","fragility fracture"]],
  ["Acute kidney injury","Renal/Urology",["acute kidney injury","acute renal failure","aki"]],
  ["Chronic kidney disease","Renal/Urology",["chronic kidney disease","chronic renal failure","hemodialysis","haemodialysis"]],
  ["Urinary tract infection","Renal/Urology",["urinary tract infection","pyelonephritis","cystitis","uti"]],
  ["Renal stones","Renal/Urology",["renal colic","kidney stone","ureteric stone","nephrolithiasis"]],
  ["Prostate disease","Renal/Urology",["prostate cancer","prostatic hyperplasia","prostatitis","prostate-specific antigen"]],
  ["Urinary retention","Renal/Urology",["urinary retention","unable to void"]],
  ["Anaemia","Haematology",["anaemia","anemia","iron deficiency","haemolysis","hemolysis"]],
  ["Anticoagulation and bleeding","Haematology",["warfarin","anticoagulation","clopidogrel","heparin-induced"]],
  ["Breast cancer","Women's Health",["breast cancer","breast carcinoma","mammogram"]],
  ["Cervical screening","Women's Health",["cervical screening","pap smear","hpv screening","cervical screening test"]],
  ["Ectopic pregnancy","Obstetrics",["ectopic pregnancy"]],
  ["Pregnancy bleeding","Obstetrics",["vaginal bleeding","antepartum haemorrhage","antepartum hemorrhage","miscarriage"]],
  ["Preeclampsia","Obstetrics",["preeclampsia","pre-eclampsia","eclampsia"]],
  ["Gestational diabetes","Obstetrics",["gestational diabetes"]],
  ["Antenatal care","Obstetrics",["antenatal","pregnancy screening","weeks gestation","weeks pregnant"]],
  ["Postpartum haemorrhage","Obstetrics",["postpartum haemorrhage","postpartum hemorrhage"]],
  ["Contraception","Women's Health",["contraception","intrauterine device","oral contraceptive"]],
  ["Depression","Mental Health",["depression","depressive disorder","suicidal ideation"]],
  ["Bipolar disorder","Mental Health",["bipolar","acute manic","mania"]],
  ["Psychosis","Mental Health",["psychosis","schizophrenia","hallucination"]],
  ["Anxiety disorders","Mental Health",["panic attack","generalised anxiety","generalized anxiety","anxiety disorder"]],
  ["Alcohol and substance use","Mental Health",["alcohol withdrawal","alcohol dependence","opioid withdrawal","substance use"]],
  ["Contact dermatitis","Dermatology",["contact dermatitis"]],
  ["Eczema and atopic dermatitis","Dermatology",["eczema","atopic dermatitis"]],
  ["Melanoma and skin cancer","Dermatology",["melanoma","squamous cell carcinoma","basal cell carcinoma","skin cancer"]],
  ["Cellulitis and skin infection","Dermatology",["cellulitis","impetigo","erysipelas"]],
  ["Fracture and dislocation","Orthopaedics",["fracture","dislocation","broken bone"]],
  ["Osteoarthritis","Orthopaedics",["osteoarthritis"]],
  ["Rheumatoid arthritis","Rheumatology",["rheumatoid arthritis"]],
  ["Back pain and radiculopathy","Orthopaedics",["back pain","sciatica","radiculopathy"]],
  ["Otitis media","ENT",["otitis media","ear infection"]],
  ["Post tonsillectomy bleeding","ENT",["tonsillectomy","tonsillar bleed"]],
  ["Glaucoma","Ophthalmology",["glaucoma"]],
  ["Cataract","Ophthalmology",["cataract"]],
  ["Consent and capacity","Ethics",["informed consent","capacity to consent","advance directive","do not resuscitate","dnr"]],
  ["Child development","Paediatrics",["developmental delay","developmental milestone","autism spectrum"]],
  ["Childhood immunisation","Paediatrics",["immunisation","immunization","vaccination schedule"]],
  ["Neonatal jaundice","Paediatrics",["neonatal jaundice","newborn jaundice"]],
  ["Fever in children","Paediatrics",["febrile child","fever in a child","fever in children"]],
];

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slug = (s: string) => normalise(s).replace(/ /g, "-");
const fnv = (s: string) => { let hash=2166136261; for (const c of s) hash=Math.imul(hash^c.charCodeAt(0),16777619); return (hash>>>0).toString(16).padStart(8,"0") };
const tidy = (s: string) => String(s??"").replace(/^[^a-z0-9]*(?:o?[a-e])[.)\s:-]+/i,"").replace(/\s+/g," ").replace(/\s*(?:report|select)\s+(?:the\s+)?correct option.*$/i,"").trim();
const DOMAIN_ALIASES: Record<string,string> = {
  "Mixed/Unclassified":"Cross-specialty", "Endocrine/Breast":"Endocrinology/Breast",
  "Ophthalmology/ENT":"Ophthalmology/ENT", "Orthopaedics/Rheumatology":"Orthopaedics/Rheumatology",
};
function inferredDomain(record:any) {
  const declared=DOMAIN_ALIASES[record.domain]??record.domain??"Cross-specialty";
  if(declared!=="Cross-specialty") return declared;
  const file=normalise(record.source_file??"");
  const clues:[RegExp,string][]=[[/neuro/,"Neurology"],[/psych/,"Mental Health"],[/cardio|\bcvs\b/,"Cardiology"],[/paed|pediatric/,"Paediatrics"],[/obst|\bobs\b/,"Obstetrics"],[/gynae/,"Gynaecology"],[/dermat/,"Dermatology"],[/renal|urology/,"Renal/Urology"],[/infect/,"Infectious Disease"],[/public health|ethics/,"Ethics/Population Health"],[/ophtha|\beye\b|\bent\b/,"Ophthalmology/ENT"],[/gastro|\bgit\b/,"Gastroenterology"],[/emergency/,"Emergency Medicine"],[/resp/,"Respiratory"],[/ortho|rheum/,"Orthopaedics/Rheumatology"],[/endo|breast/,"Endocrinology/Breast"],[/haem|hema/,"Haematology"]];
  return clues.find(([re])=>re.test(file))?.[1]??"Cross-specialty";
}
function taskFor(text:string) {
  const s=normalise(text);
  if(/relative risk|odds ratio|sensitivity|specificity|study design|randomized|randomised|prevalence|incidence/.test(s)) return "Epidemiology and evidence";
  if(/consent|capacity|confidential|mandatory report|duty of care|advance directive|ethical|ethics/.test(s)) return "Ethics and communication";
  if(/screen|prevent|vaccin|immunis|immuniz|risk factor/.test(s)) return "Prevention and screening";
  if(/adverse|side effect|contraindicat|complication|toxicity|poison|overdose/.test(s)) return "Safety and complications";
  if(/nerve|dermatome|anatom|locali[sz]|lesion site/.test(s)) return "Anatomy and localisation";
  if(/investigat|test of choice|most appropriate test|imaging|scan|laboratory|blood test|diagnostic test/.test(s)) return "Investigation";
  if(/treat|management|manage|next best step|most appropriate step|therapy|medication|surgery/.test(s)) return "Management";
  if(/diagnos|most likely|what is the condition|which condition|could be the/.test(s)) return "Diagnosis and recognition";
  if(/drug|dose|mechanism|pharmac/.test(s)) return "Pharmacology";
  return "Clinical reasoning";
}
function parseOptions(value:unknown):Record<string,string>{try{const parsed=typeof value==="string"?JSON.parse(value):value;return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed as Record<string,string>:{} }catch{return {}}}
function correctOption(record:any){const options=parseOptions(record.options_json);const key=String(record.source_answer??"").trim().toUpperCase();return tidy(options[key]??"")}
function titleTopic(stem:string){
  const clean=String(stem??"").replace(/\r/g,"");
  const title=clean.match(/(?:MCQ\s*[\d.]+\s*)?[—-]\s*([^\n—-]{6,90})\s*[—-]\s*(?:DIAGNOSIS|MANAGEMENT|TREATMENT|INVESTIGATION|CAUSE)/i)?.[1]
    ?? clean.match(/\bTitle\s+([^\n]{6,90})/i)?.[1];
  return title?tidy(title).replace(/\b\w/g,(c)=>c.toUpperCase()):null;
}
function dynamicNode(name:string,domain:string,task:string,kind:"answer"|"title"|"fallback"){
  const key=`${kind}|${normalise(domain)}|${normalise(task)}|${normalise(name)}`;
  return {id:`topic:${kind}:${fnv(key)}`,canonical_name:name,domain,system:domain,condition:name,clinical_task:task,
    current_summary:kind==="fallback"?"Broad task-level grouping used because the source record does not contain enough reliable text for a condition-level label.":"Topic derived from explicit source-era text; current Australian guidance requires separate verification.",
    aliases:[normalise(name)],subtopics:[] as string[],mapping_kind:kind};
}
export const ontology = TERMS.map(([name, domain, aliases]) => ({
  id: `topic:${slug(name)}`, canonical_name: name, domain, system: domain,
  condition: name, clinical_task: "AMC MCQ", current_summary: "Topic grouping from the source question; Australian guidance requires separate verification.",
  aliases: [...new Set([name, ...aliases].map(normalise))],
  subtopics: [] as string[],
}));
export function mapTopic(record: any) {
  const domain=inferredDomain(record); const stem=String(record.stem??record.stem_en??"");
  const answer=correctOption(record); const explanation=String(record.source_explanation??record.source_explanation_en??"");
  const fields=[{text:answer,weight:120},{text:explanation,weight:60},{text:stem,weight:50}];
  const matches = ontology.flatMap((node) => fields.flatMap((field) => {
    const hay=` ${normalise(field.text)} `;const alias=node.aliases.filter((term)=>term.length>3&&hay.includes(` ${term} `)).sort((a,b)=>b.length-a.length)[0];
    return alias?[{node,alias,score:field.weight+alias.length+(domain===node.domain?5:0)}]:[];
  })).sort((a,b)=>b.score-a.score || a.node.id.localeCompare(b.node.id));
  const unique = matches.filter((match, i, all) => all.findIndex((other)=>other.node.id===match.node.id)===i);
  const primary = unique[0];
  if(primary) return {question_id:record.record_id??record.id??"",primary_node_id:primary.node.id,secondary_node_ids:unique.slice(1,3).map((m)=>m.node.id),subtopic:primary.alias,mapping_status:"MATCHED_ONTOLOGY" as const,node:null};
  const task=taskFor(stem); const title=titleTopic(stem);
  const generic=/^(?:yes|no|none|all of the above|reassure|observation|follow up|refer|admit|discharge|do nothing|not known)$/i;
  if(answer&&answer.length>=4&&answer.length<=110&&!generic.test(answer)){
    const answerName=/^(?:[a-z][a-z '-]+ disease|[a-z][a-z '-]+ syndrome|[a-z][a-z '-]+ carcinoma|[a-z][a-z '-]+ infection|[a-z][a-z '-]+ fracture)$/i.test(answer)?answer:`${domain} — ${task}: ${answer}`;
    const node=dynamicNode(answerName,domain,task,"answer");return {question_id:record.record_id??record.id??"",primary_node_id:node.id,secondary_node_ids:[],subtopic:answer,mapping_status:"ANSWER_TOPIC" as const,node};
  }
  if(title){const node=dynamicNode(title,domain,task,"title");return {question_id:record.record_id??record.id??"",primary_node_id:node.id,secondary_node_ids:[],subtopic:title,mapping_status:"TITLE_TOPIC" as const,node};}
  const fallbackName=`${domain} — ${task}`;const node=dynamicNode(fallbackName,domain,task,"fallback");
  return {question_id:record.record_id??record.id??"",primary_node_id:node.id,secondary_node_ids:[],subtopic:task,mapping_status:"TASK_LEVEL_FALLBACK" as const,node};
}
