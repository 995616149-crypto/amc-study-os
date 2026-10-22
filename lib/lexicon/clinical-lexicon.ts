/**
 * Core clinical English → Simplified Chinese lexicon.
 *
 * Scope and provenance:
 *  - This is a hand-curated *core* list (a few hundred high-frequency AMC /
 *    clinical-examination words), not a general-purpose dictionary. It exists so the
 *    common case is answered locally, with no model call and no network round trip.
 *  - It is deliberately small so it can be lazily loaded as its own chunk. It is
 *    never imported by the first-paint bundle and never bulk-fetched at boot.
 *  - ECDICT (MIT licensed) was evaluated for the冷词 layer. Its full CSV/StarDict
 *    payload is far too large for a learner-facing page and carries no clinical
 *    context, so it is not bundled; unknown words keep using the existing
 *    RxNorm + contextual model path.
 *
 * Multi-sense words (tenderness, discharge, mass, shock) resolve by the question
 * context first, then fall back to the clinical default sense.
 */

import { lemmaFor, normalizeSurface } from "./tokenize";
export const LEXICON_SOURCE = "core-clinical-lexicon";

export { LEXICON_VERSION, lemmaFor, normalizeSurface } from "./tokenize";

export type LexiconEntry = {
  /** Default clinical gloss, Simplified Chinese. */
  gloss: string;
  /** Part of speech label shown in the panel. */
  pos: string;
  entity?: string;
  /** Context-first senses: [regular expression source, gloss]. */
  senses?: Array<[string, string]>;
};

const NO_SPLIT = "暂无可可靠拆解或来源依据，不对该词做推测性拆分。";

/** Surface/lemma → entry. Keys are already lower-case ASCII tokens. */
const ENTRIES: Record<string, LexiconEntry> = {
  // --- acceptance vocabulary: context-sensitive clinical words ---
  tenderness: {
    gloss: "压痛（触诊时患者感到疼痛）", pos: "noun", entity: "clinical sign",
    senses: [
      ["abdom|abdomen|palpat|rebound|guarding|iliac fossa|epigastr|periton", "腹部压痛：触诊按压腹部时引出的疼痛，是腹膜炎或腹腔内炎症的体征之一。"],
      ["breast|joint|knee|muscle|musculoskelet|costovertebral|flank|shoulder", "局部压痛：按压该部位时出现疼痛，提示局部炎症、损伤或牵拉。"],
    ],
  },
  discharge: {
    gloss: "排出物；分泌物", pos: "noun / verb", entity: "clinical finding",
    senses: [
      ["hospital|admitted|admission|ward|follow.?up|home|unit|clinic", "出院：患者离开医院或结束住院诊疗（动词/名词）。"],
      ["vaginal|urethral|penile|ear|eye|wound|nasal|nipple|rectal", "分泌物：从腔道、伤口或器官异常流出的液体，需描述颜色、量、气味。"],
      ["fluid|pus|bleeding|water", "排出：液体或分泌物自体内流出。"],
    ],
  },
  mass: {
    gloss: "肿块；团块", pos: "noun", entity: "clinical finding",
    senses: [
      ["abdom|abdomen|pelvi|breast|neck|testis|scrot|thyroid|renal|flank|rectal|palpab|lesion|lump", "肿块：可触及或影像上见到的占位性团块，需记录部位、大小、质地、活动度。"],
      ["body|index|muscle|lean|fat|bone", "质量/体重（体格指标语境），如 body mass index。"],
    ],
  },
  shock: {
    gloss: "休克（组织灌注不足的循环衰竭状态）", pos: "noun", entity: "haemodynamic state",
    senses: [
      ["hypotens|tachycard|pallor|clammy|capillary|perfusion|blood pressure|collapse|resuscitat|fluid|haemorrhag|hemorrhag|septic|anaphyla|cardiogenic", "休克：有效循环血量或心输出量不足导致组织灌注不良，表现为低血压、心动过速、苍白、湿冷、意识改变。"],
      ["electric|electrical|defibrillat|device", "电击（如 electric shock）；非循环衰竭义。"],
    ],
  },
  dyspnoea: { gloss: "呼吸困难", pos: "noun", entity: "symptom" },
  dyspnea: { gloss: "呼吸困难（美式拼写）", pos: "noun", entity: "symptom" },
  haematemesis: { gloss: "呕血：呕吐物中含新鲜或咖啡样血液，提示上消化道出血。", pos: "noun", entity: "symptom" },
  hematemesis: { gloss: "呕血（美式拼写）：呕吐血液，提示上消化道出血。", pos: "noun", entity: "symptom" },
  guarding: {
    gloss: "腹肌紧张（防御性肌卫）", pos: "noun", entity: "clinical sign",
    senses: [
      ["abdom|abdomen|palpat|rebound|rigid|periton", "腹肌紧张：触诊时腹壁肌肉不自主收缩，常提示腹膜刺激或腹腔内炎症。"],
    ],
  },
  "rebound tenderness": { gloss: "反跳痛：按压腹部后迅速松手时疼痛加重，提示腹膜刺激。", pos: "noun", entity: "clinical sign" },
  rebound: {
    gloss: "反跳（如反跳痛）", pos: "noun / adjective", entity: "clinical sign",
    senses: [
      ["tenderness|abdom|abdomen|palpat", "反跳痛：按压后迅速松手时疼痛加重，提示腹膜刺激。"],
    ],
  },

  // --- general clinical description ---
  acute: { gloss: "急性的：起病快、病程短。", pos: "adjective" },
  chronic: { gloss: "慢性的：病程长、进展缓慢。", pos: "adjective" },
  subacute: { gloss: "亚急性的：介于急性与慢性之间。", pos: "adjective" },
  severe: { gloss: "严重的", pos: "adjective" },
  mild: { gloss: "轻微的", pos: "adjective" },
  moderate: { gloss: "中度的", pos: "adjective" },
  sudden: { gloss: "突然的", pos: "adjective" },
  gradual: { gloss: "逐渐的", pos: "adjective" },
  intermittent: { gloss: "间歇性的", pos: "adjective" },
  persistent: { gloss: "持续性的", pos: "adjective" },
  recurrent: { gloss: "反复发作的", pos: "adjective" },
  progressive: { gloss: "进行性加重的", pos: "adjective" },
  bilateral: { gloss: "双侧的", pos: "adjective" },
  unilateral: { gloss: "单侧的", pos: "adjective" },
  localized: { gloss: "局限的", pos: "adjective" },
  diffuse: { gloss: "弥漫的", pos: "adjective" },
  radiating: { gloss: "放射性的（疼痛向其他部位放射）", pos: "adjective" },
  associated: { gloss: "伴随的；相关的", pos: "adjective" },
  generalized: { gloss: "全身性的；广泛的", pos: "adjective" },

  // --- symptoms ---
  pain: { gloss: "疼痛", pos: "noun" },
  fever: { gloss: "发热", pos: "noun" },
  rigors: { gloss: "寒战", pos: "noun" },
  chills: { gloss: "畏寒；寒战", pos: "noun" },
  fatigue: { gloss: "疲乏", pos: "noun" },
  lethargy: { gloss: "倦怠；嗜睡", pos: "noun" },
  malaise: { gloss: "全身不适", pos: "noun" },
  anorexia: { gloss: "食欲不振；厌食", pos: "noun" },
  nausea: { gloss: "恶心", pos: "noun" },
  vomiting: { gloss: "呕吐", pos: "noun" },
  vomit: { gloss: "呕吐；呕吐物", pos: "verb / noun" },
  diarrhoea: { gloss: "腹泻", pos: "noun" },
  diarrhea: { gloss: "腹泻（美式拼写）", pos: "noun" },
  constipation: { gloss: "便秘", pos: "noun" },
  melaena: { gloss: "黑便：上消化道出血后血液经肠道消化形成的黑色柏油样便。", pos: "noun" },
  melena: { gloss: "黑便（美式拼写）", pos: "noun" },
  haematochezia: { gloss: "便血：排出鲜红色血液，多提示下消化道出血。", pos: "noun" },
  hematochezia: { gloss: "便血（美式拼写）", pos: "noun" },
  jaundice: { gloss: "黄疸：皮肤、巩膜黄染，提示胆红素升高。", pos: "noun" },
  pruritus: { gloss: "瘙痒", pos: "noun" },
  rash: { gloss: "皮疹", pos: "noun" },
  erythema: { gloss: "红斑", pos: "noun" },
  oedema: { gloss: "水肿", pos: "noun" },
  edema: { gloss: "水肿（美式拼写）", pos: "noun" },
  cyanosis: { gloss: "发绀：皮肤黏膜呈青紫色，提示低氧。", pos: "noun" },
  pallor: { gloss: "苍白", pos: "noun" },
  diaphoresis: { gloss: "出汗；多汗", pos: "noun" },
  syncope: { gloss: "晕厥：短暂意识丧失伴姿势张力消失。", pos: "noun" },
  presyncope: { gloss: "晕厥前兆：头晕、眼前发黑但未完全失去意识。", pos: "noun" },
  palpitations: { gloss: "心悸", pos: "noun" },
  dysphagia: { gloss: "吞咽困难", pos: "noun" },
  odynophagia: { gloss: "吞咽痛", pos: "noun" },
  dysuria: { gloss: "排尿困难；尿痛", pos: "noun" },
  haematuria: { gloss: "血尿", pos: "noun" },
  hematuria: { gloss: "血尿（美式拼写）", pos: "noun" },
  oliguria: { gloss: "少尿：尿量明显减少。", pos: "noun" },
  polyuria: { gloss: "多尿", pos: "noun" },
  nocturia: { gloss: "夜尿增多", pos: "noun" },
  incontinence: { gloss: "失禁（不能自主控制排尿或排便）", pos: "noun" },
  retention: { gloss: "潴留（如尿潴留）", pos: "noun" },
  haemoptysis: { gloss: "咯血：咳出血液，来源于呼吸道。", pos: "noun" },
  hemoptysis: { gloss: "咯血（美式拼写）", pos: "noun" },
  wheeze: { gloss: "喘鸣：气流通过狭窄气道产生的哨音。", pos: "noun" },
  stridor: { gloss: "喉鸣：上气道梗阻产生的吸气性杂音。", pos: "noun" },
  cough: { gloss: "咳嗽", pos: "noun / verb" },
  sputum: { gloss: "痰", pos: "noun" },
  breathlessness: { gloss: "气短；呼吸困难", pos: "noun" },
  orthopnoea: { gloss: "端坐呼吸：平卧时呼吸困难、坐起后缓解。", pos: "noun" },
  orthopnea: { gloss: "端坐呼吸（美式拼写）", pos: "noun" },
  headache: { gloss: "头痛", pos: "noun" },
  migraine: { gloss: "偏头痛", pos: "noun" },
  seizure: { gloss: "癫痫发作；抽搐发作", pos: "noun" },
  vertigo: { gloss: "眩晕：自身或环境旋转的感觉。", pos: "noun" },
  paraesthesia: { gloss: "感觉异常（麻木、针刺感）", pos: "noun" },
  paresthesia: { gloss: "感觉异常（美式拼写）", pos: "noun" },
  weakness: { gloss: "无力；乏力", pos: "noun" },
  tremor: { gloss: "震颤", pos: "noun" },
  ataxia: { gloss: "共济失调", pos: "noun" },
  diplopia: { gloss: "复视", pos: "noun" },
  photophobia: { gloss: "畏光", pos: "noun" },
  confusion: { gloss: "意识模糊；定向障碍", pos: "noun" },
  delirium: { gloss: "谵妄：急性、波动的注意力与意识障碍。", pos: "noun" },
  dementia: { gloss: "痴呆：慢性进行性认知功能下降。", pos: "noun" },
  collapse: { gloss: "虚脱；倒地", pos: "noun / verb" },

  // --- signs / examination ---
  clubbing: { gloss: "杵状指：指端增宽、甲床角度消失，见于慢性缺氧等。", pos: "noun" },
  crackles: { gloss: "湿啰音；爆裂音", pos: "noun" },
  crepitations: { gloss: "捻发音；湿啰音", pos: "noun" },
  murmur: { gloss: "心脏杂音", pos: "noun" },
  bruit: { gloss: "血管杂音", pos: "noun" },
  rigidity: { gloss: "强直；僵硬（如腹肌强直）", pos: "noun" },
  distension: { gloss: "膨胀；腹胀", pos: "noun" },
  distention: { gloss: "膨胀；腹胀（美式拼写）", pos: "noun" },
  hepatomegaly: { gloss: "肝大", pos: "noun" },
  splenomegaly: { gloss: "脾大", pos: "noun" },
  lymphadenopathy: { gloss: "淋巴结肿大", pos: "noun" },
  ascites: { gloss: "腹水：腹腔内液体积聚。", pos: "noun" },
  pulsation: { gloss: "搏动", pos: "noun" },
  swelling: { gloss: "肿胀；肿块", pos: "noun" },
  lump: { gloss: "肿块；结节", pos: "noun" },
  ulcer: { gloss: "溃疡", pos: "noun" },
  ulceration: { gloss: "溃疡形成", pos: "noun" },
  erosion: { gloss: "糜烂；侵蚀", pos: "noun" },
  fistula: { gloss: "瘘：两个腔道或腔道与体表之间的异常通道。", pos: "noun" },
  hernia: { gloss: "疝：器官或组织经薄弱处突出。", pos: "noun" },
  abscess: { gloss: "脓肿", pos: "noun" },
  cellulitis: { gloss: "蜂窝织炎：皮下深层组织的弥漫性细菌感染。", pos: "noun" },
  gangrene: { gloss: "坏疽", pos: "noun" },
  necrosis: { gloss: "坏死", pos: "noun" },
  ischaemia: { gloss: "缺血", pos: "noun" },
  ischemia: { gloss: "缺血（美式拼写）", pos: "noun" },
  infarction: { gloss: "梗死", pos: "noun" },
  haemorrhage: { gloss: "出血；大出血", pos: "noun" },
  hemorrhage: { gloss: "出血（美式拼写）", pos: "noun" },
  perforation: { gloss: "穿孔", pos: "noun" },
  obstruction: { gloss: "梗阻；阻塞", pos: "noun" },
  stricture: { gloss: "狭窄（管腔结构性缩窄）", pos: "noun" },
  torsion: { gloss: "扭转（如卵巢或睾丸扭转）", pos: "noun" },
  volvulus: { gloss: "肠扭转", pos: "noun" },
  intussusception: { gloss: "肠套叠", pos: "noun" },
  sepsis: { gloss: "脓毒症：感染引起失调的宿主反应并导致器官功能障碍。", pos: "noun" },
  septic: { gloss: "脓毒性的；感染性的", pos: "adjective" },
  septicaemia: { gloss: "败血症（旧称）", pos: "noun" },
  anaphylaxis: { gloss: "过敏性休克：严重、全身性、速发型过敏反应。", pos: "noun" },
  allergy: { gloss: "过敏；变态反应", pos: "noun" },

  // --- conditions ---
  asthma: { gloss: "哮喘", pos: "noun" },
  pneumonia: { gloss: "肺炎", pos: "noun" },
  pneumothorax: { gloss: "气胸", pos: "noun" },
  haemothorax: { gloss: "血胸", pos: "noun" },
  empyema: { gloss: "脓胸", pos: "noun" },
  bronchitis: { gloss: "支气管炎", pos: "noun" },
  emphysema: { gloss: "肺气肿", pos: "noun" },
  "pulmonary embolism": { gloss: "肺栓塞：血栓阻塞肺动脉及其分支。", pos: "noun" },
  "deep vein thrombosis": { gloss: "深静脉血栓形成", pos: "noun" },
  "myocardial infarction": { gloss: "心肌梗死", pos: "noun" },
  angina: { gloss: "心绞痛", pos: "noun" },
  arrhythmia: { gloss: "心律失常", pos: "noun" },
  "atrial fibrillation": { gloss: "心房颤动", pos: "noun" },
  hypertension: { gloss: "高血压", pos: "noun" },
  hypotension: { gloss: "低血压", pos: "noun" },
  tachycardia: { gloss: "心动过速", pos: "noun" },
  bradycardia: { gloss: "心动过缓", pos: "noun" },
  atherosclerosis: { gloss: "动脉粥样硬化", pos: "noun" },
  aneurysm: { gloss: "动脉瘤", pos: "noun" },
  dissection: { gloss: "夹层（如主动脉夹层）", pos: "noun" },
  diabetes: { gloss: "糖尿病", pos: "noun" },
  hypoglycaemia: { gloss: "低血糖", pos: "noun" },
  hypoglycemia: { gloss: "低血糖（美式拼写）", pos: "noun" },
  hyperglycaemia: { gloss: "高血糖", pos: "noun" },
  hyperthyroidism: { gloss: "甲状腺功能亢进", pos: "noun" },
  hypothyroidism: { gloss: "甲状腺功能减退", pos: "noun" },
  anaemia: { gloss: "贫血", pos: "noun" },
  anemia: { gloss: "贫血（美式拼写）", pos: "noun" },
  thrombocytopenia: { gloss: "血小板减少", pos: "noun" },
  leukocytosis: { gloss: "白细胞增多", pos: "noun" },
  leucocytosis: { gloss: "白细胞增多（英式拼写）", pos: "noun" },
  neutropenia: { gloss: "中性粒细胞减少", pos: "noun" },
  coagulopathy: { gloss: "凝血功能障碍", pos: "noun" },
  pancreatitis: { gloss: "胰腺炎", pos: "noun" },
  cholecystitis: { gloss: "胆囊炎", pos: "noun" },
  cholangitis: { gloss: "胆管炎", pos: "noun" },
  appendicitis: { gloss: "阑尾炎", pos: "noun" },
  diverticulitis: { gloss: "憩室炎", pos: "noun" },
  gastroenteritis: { gloss: "胃肠炎", pos: "noun" },
  hepatitis: { gloss: "肝炎", pos: "noun" },
  cirrhosis: { gloss: "肝硬化", pos: "noun" },
  reflux: { gloss: "反流", pos: "noun" },
  haemorrhoid: { gloss: "痔", pos: "noun" },
  haemorrhoids: { gloss: "痔（复数）", pos: "noun" },
  antibiotics: { gloss: "抗生素（复数）", pos: "noun" },
  nephritis: { gloss: "肾炎", pos: "noun" },
  "renal failure": { gloss: "肾衰竭", pos: "noun" },
  "acute kidney injury": { gloss: "急性肾损伤", pos: "noun" },
  calculus: { gloss: "结石", pos: "noun" },
  colic: { gloss: "绞痛（阵发性剧痛）", pos: "noun" },
  ectopic: { gloss: "异位的（如异位妊娠）", pos: "adjective" },
  pregnancy: { gloss: "妊娠", pos: "noun" },
  gestation: { gloss: "妊娠期", pos: "noun" },
  postpartum: { gloss: "产后的", pos: "adjective" },
  menopause: { gloss: "绝经", pos: "noun" },
  contraception: { gloss: "避孕", pos: "noun" },
  stroke: { gloss: "卒中；脑卒中", pos: "noun" },
  "transient ischaemic attack": { gloss: "短暂性脑缺血发作", pos: "noun" },
  "multiple sclerosis": { gloss: "多发性硬化", pos: "noun" },
  epilepsy: { gloss: "癫痫", pos: "noun" },
  arthritis: { gloss: "关节炎", pos: "noun" },
  osteoarthritis: { gloss: "骨关节炎", pos: "noun" },
  "rheumatoid arthritis": { gloss: "类风湿关节炎", pos: "noun" },
  gout: { gloss: "痛风", pos: "noun" },
  psoriasis: { gloss: "银屑病", pos: "noun" },
  eczema: { gloss: "湿疹", pos: "noun" },
  melanoma: { gloss: "黑色素瘤", pos: "noun" },
  carcinoma: { gloss: "癌（上皮来源的恶性肿瘤）", pos: "noun" },
  sarcoma: { gloss: "肉瘤（间叶来源的恶性肿瘤）", pos: "noun" },
  lymphoma: { gloss: "淋巴瘤", pos: "noun" },
  leukaemia: { gloss: "白血病", pos: "noun" },
  leukemia: { gloss: "白血病（美式拼写）", pos: "noun" },
  metastasis: { gloss: "转移（肿瘤）", pos: "noun" },
  malignancy: { gloss: "恶性肿瘤；恶性", pos: "noun" },
  neoplasm: { gloss: "肿瘤；新生物", pos: "noun" },

  // --- anatomy ---
  abdomen: { gloss: "腹部", pos: "noun" },
  abdominal: { gloss: "腹部的", pos: "adjective" },
  epigastric: { gloss: "上腹部的（剑突下区域）", pos: "adjective" },
  suprapubic: { gloss: "耻骨上的", pos: "adjective" },
  "right iliac fossa": { gloss: "右髂窝（右下腹，阑尾区）", pos: "noun" },
  "left iliac fossa": { gloss: "左髂窝（左下腹）", pos: "noun" },
  flank: { gloss: "胁腹；侧腹部", pos: "noun" },
  loin: { gloss: "腰部；胁腹", pos: "noun" },
  pelvis: { gloss: "骨盆", pos: "noun" },
  pelvic: { gloss: "骨盆的", pos: "adjective" },
  perineum: { gloss: "会阴", pos: "noun" },
  rectum: { gloss: "直肠", pos: "noun" },
  rectal: { gloss: "直肠的", pos: "adjective" },
  anus: { gloss: "肛门", pos: "noun" },
  anal: { gloss: "肛门的", pos: "adjective" },
  oesophagus: { gloss: "食管", pos: "noun" },
  esophagus: { gloss: "食管（美式拼写）", pos: "noun" },
  stomach: { gloss: "胃", pos: "noun" },
  duodenum: { gloss: "十二指肠", pos: "noun" },
  jejunum: { gloss: "空肠", pos: "noun" },
  ileum: { gloss: "回肠", pos: "noun" },
  colon: { gloss: "结肠", pos: "noun" },
  bowel: { gloss: "肠", pos: "noun" },
  intestine: { gloss: "肠", pos: "noun" },
  liver: { gloss: "肝", pos: "noun" },
  hepatic: { gloss: "肝脏的", pos: "adjective" },
  biliary: { gloss: "胆道的", pos: "adjective" },
  gallbladder: { gloss: "胆囊", pos: "noun" },
  pancreas: { gloss: "胰腺", pos: "noun" },
  spleen: { gloss: "脾", pos: "noun" },
  kidney: { gloss: "肾", pos: "noun" },
  renal: { gloss: "肾脏的", pos: "adjective" },
  bladder: { gloss: "膀胱", pos: "noun" },
  urethra: { gloss: "尿道", pos: "noun" },
  ureter: { gloss: "输尿管", pos: "noun" },
  uterus: { gloss: "子宫", pos: "noun" },
  uterine: { gloss: "子宫的", pos: "adjective" },
  ovary: { gloss: "卵巢", pos: "noun" },
  ovarian: { gloss: "卵巢的", pos: "adjective" },
  fallopian: { gloss: "输卵管的", pos: "adjective" },
  vagina: { gloss: "阴道", pos: "noun" },
  vaginal: { gloss: "阴道的", pos: "adjective" },
  testis: { gloss: "睾丸", pos: "noun" },
  scrotum: { gloss: "阴囊", pos: "noun" },
  prostate: { gloss: "前列腺", pos: "noun" },
  thyroid: { gloss: "甲状腺", pos: "noun" },
  adrenal: { gloss: "肾上腺的", pos: "adjective" },
  lung: { gloss: "肺", pos: "noun" },
  pulmonary: { gloss: "肺的；肺动脉的", pos: "adjective" },
  pleural: { gloss: "胸膜的", pos: "adjective" },
  chest: { gloss: "胸部", pos: "noun" },
  thorax: { gloss: "胸廓；胸腔", pos: "noun" },
  heart: { gloss: "心脏", pos: "noun" },
  cardiac: { gloss: "心脏的", pos: "adjective" },
  coronary: { gloss: "冠状动脉的", pos: "adjective" },
  aorta: { gloss: "主动脉", pos: "noun" },
  aortic: { gloss: "主动脉的", pos: "adjective" },
  artery: { gloss: "动脉", pos: "noun" },
  vein: { gloss: "静脉", pos: "noun" },
  venous: { gloss: "静脉的", pos: "adjective" },
  lymph: { gloss: "淋巴", pos: "noun" },
  brain: { gloss: "脑", pos: "noun" },
  cerebral: { gloss: "大脑的", pos: "adjective" },
  cerebellar: { gloss: "小脑的", pos: "adjective" },
  spinal: { gloss: "脊柱的；脊髓的", pos: "adjective" },
  nerve: { gloss: "神经", pos: "noun" },
  neurological: { gloss: "神经系统的", pos: "adjective" },
  skin: { gloss: "皮肤", pos: "noun" },
  mucosa: { gloss: "黏膜", pos: "noun" },
  mucous: { gloss: "黏液的", pos: "adjective" },
  muscle: { gloss: "肌肉", pos: "noun" },
  joint: { gloss: "关节", pos: "noun" },
  bone: { gloss: "骨", pos: "noun" },
  spine: { gloss: "脊柱", pos: "noun" },

  // --- investigations / management ---
  investigation: { gloss: "检查；辅助检查", pos: "noun" },
  screening: { gloss: "筛查", pos: "noun" },
  diagnosis: { gloss: "诊断", pos: "noun" },
  "differential diagnosis": { gloss: "鉴别诊断", pos: "noun" },
  differential: { gloss: "鉴别的；鉴别诊断", pos: "noun / adjective" },
  management: { gloss: "处理；诊疗方案", pos: "noun" },
  treatment: { gloss: "治疗", pos: "noun" },
  therapy: { gloss: "治疗；疗法", pos: "noun" },
  referral: { gloss: "转诊；转介", pos: "noun" },
  admission: { gloss: "入院；收治", pos: "noun" },
  "follow-up": { gloss: "随访", pos: "noun" },
  prognosis: { gloss: "预后", pos: "noun" },
  complication: { gloss: "并发症", pos: "noun" },
  recurrence: { gloss: "复发", pos: "noun" },
  remission: { gloss: "缓解", pos: "noun" },
  biopsy: { gloss: "活检", pos: "noun" },
  endoscopy: { gloss: "内镜检查", pos: "noun" },
  colonoscopy: { gloss: "结肠镜检查", pos: "noun" },
  gastroscopy: { gloss: "胃镜检查", pos: "noun" },
  ultrasound: { gloss: "超声检查", pos: "noun" },
  radiograph: { gloss: "X 线片", pos: "noun" },
  tomography: { gloss: "断层成像（如 CT）", pos: "noun" },
  electrocardiogram: { gloss: "心电图", pos: "noun" },
  spirometry: { gloss: "肺量计检查", pos: "noun" },
  culture: { gloss: "培养", pos: "noun" },
  sensitivity: { gloss: "敏感度；敏感性", pos: "noun" },
  specificity: { gloss: "特异度", pos: "noun" },
  "positive predictive value": { gloss: "阳性预测值", pos: "noun" },
  "negative predictive value": { gloss: "阴性预测值", pos: "noun" },
  incidence: { gloss: "发病率（新发病例）", pos: "noun" },
  prevalence: { gloss: "患病率（现患病例）", pos: "noun" },
  mortality: { gloss: "死亡率", pos: "noun" },
  morbidity: { gloss: "患病率；病残率", pos: "noun" },
  aetiology: { gloss: "病因学；病因", pos: "noun" },
  etiology: { gloss: "病因学（美式拼写）", pos: "noun" },
  pathophysiology: { gloss: "病理生理学", pos: "noun" },
  mechanism: { gloss: "机制", pos: "noun" },
  "risk factor": { gloss: "危险因素", pos: "noun" },
  comorbidity: { gloss: "合并症", pos: "noun" },
  guideline: { gloss: "指南", pos: "noun" },
  evidence: { gloss: "证据", pos: "noun" },
  randomised: { gloss: "随机化的", pos: "adjective" },
  randomized: { gloss: "随机化的（美式拼写）", pos: "adjective" },
  placebo: { gloss: "安慰剂", pos: "noun" },
  trial: { gloss: "试验", pos: "noun" },
  cohort: { gloss: "队列", pos: "noun" },
  meta: { gloss: "元（如 meta-analysis 元分析）", pos: "prefix" },

  // --- drugs ---
  dose: { gloss: "剂量", pos: "noun" },
  dosage: { gloss: "剂量；用法用量", pos: "noun" },
  prescribing: { gloss: "开具处方", pos: "noun" },
  prescription: { gloss: "处方", pos: "noun" },
  contraindication: { gloss: "禁忌证", pos: "noun" },
  indication: { gloss: "适应证", pos: "noun" },
  adverse: { gloss: "不良的（如不良反应）", pos: "adjective" },
  "side effect": { gloss: "副作用", pos: "noun" },
  antibiotic: { gloss: "抗生素", pos: "noun" },
  analgesia: { gloss: "镇痛", pos: "noun" },
  analgesic: { gloss: "镇痛药；镇痛的", pos: "noun / adjective" },
  antipyretic: { gloss: "退热药", pos: "noun" },
  antiemetic: { gloss: "止吐药", pos: "noun" },
  anticoagulant: { gloss: "抗凝药", pos: "noun" },
  antiplatelet: { gloss: "抗血小板药", pos: "noun" },
  diuretic: { gloss: "利尿剂", pos: "noun" },
  steroid: { gloss: "类固醇；糖皮质激素", pos: "noun" },
  corticosteroid: { gloss: "糖皮质激素", pos: "noun" },
  inhaler: { gloss: "吸入器", pos: "noun" },
  nebuliser: { gloss: "雾化器", pos: "noun" },
  insulin: { gloss: "胰岛素", pos: "noun" },
  opioid: { gloss: "阿片类药物", pos: "noun" },
  nsaid: { gloss: "非甾体抗炎药（NSAID）", pos: "noun" },
  paracetamol: { gloss: "对乙酰氨基酚（扑热息痛）", pos: "noun" },
  aspirin: { gloss: "阿司匹林", pos: "noun" },
  propranolol: { gloss: "普萘洛尔（非选择性 β 受体阻滞剂）", pos: "noun" },
  salbutamol: { gloss: "沙丁胺醇（短效 β2 受体激动剂）", pos: "noun" },
  adrenaline: { gloss: "肾上腺素", pos: "noun" },
  morphine: { gloss: "吗啡", pos: "noun" },
  heparin: { gloss: "肝素", pos: "noun" },
  warfarin: { gloss: "华法林", pos: "noun" },
  furosemide: { gloss: "呋塞米（袢利尿剂）", pos: "noun" },
  omeprazole: { gloss: "奥美拉唑（质子泵抑制剂）", pos: "noun" },
  metformin: { gloss: "二甲双胍", pos: "noun" },
  atorvastatin: { gloss: "阿托伐他汀（他汀类调脂药）", pos: "noun" },
  amoxicillin: { gloss: "阿莫西林（青霉素类抗生素）", pos: "noun" },
  ceftriaxone: { gloss: "头孢曲松（第三代头孢菌素）", pos: "noun" },
  ondansetron: { gloss: "昂丹司琼（止吐药）", pos: "noun" },
  prednisolone: { gloss: "泼尼松龙（糖皮质激素）", pos: "noun" },

  // --- everyday clinical English (high frequency in stems) ---
  be: { gloss: "是；处于（系动词）", pos: "verb" },
  been: { gloss: "（一直）处于；已经（be 的过去分词，用于完成或持续时态）", pos: "verb" },
  patient: { gloss: "患者", pos: "noun" },
  presents: { gloss: "就诊；表现为", pos: "verb" },
  presented: { gloss: "就诊；表现为（过去式）", pos: "verb" },
  presenting: { gloss: "就诊；表现为（现在分词）", pos: "verb" },
  complains: { gloss: "主诉", pos: "verb" },
  reported: { gloss: "报告；主诉", pos: "verb" },
  denies: { gloss: "否认（如否认吸烟史）", pos: "verb" },
  history: { gloss: "病史", pos: "noun" },
  examination: { gloss: "查体；检查", pos: "noun" },
  revealed: { gloss: "显示；发现", pos: "verb" },
  noted: { gloss: "注意到；记录到", pos: "verb" },
  otherwise: { gloss: "除此之外", pos: "adverb" },
  unwell: { gloss: "不适；身体欠佳", pos: "adjective" },
  normal: { gloss: "正常的", pos: "adjective" },
  abnormal: { gloss: "异常的", pos: "adjective" },
  raised: { gloss: "升高的", pos: "adjective" },
  elevated: { gloss: "升高的", pos: "adjective" },
  reduced: { gloss: "降低的；减弱的", pos: "adjective" },
  decreased: { gloss: "降低的", pos: "adjective" },
  increased: { gloss: "增加的", pos: "adjective" },
  within: { gloss: "在……范围内", pos: "preposition" },
  range: { gloss: "范围", pos: "noun" },
  prior: { gloss: "先前的", pos: "adjective" },
  since: { gloss: "自从；自……以来", pos: "preposition / conjunction" },
  onset: { gloss: "起病；发作起始", pos: "noun" },
  duration: { gloss: "持续时间", pos: "noun" },
  episode: { gloss: "发作；一次事件", pos: "noun" },
  current: { gloss: "当前的", pos: "adjective" },
  recent: { gloss: "近期的", pos: "adjective" },
  medications: { gloss: "药物（正在使用的）", pos: "noun" },
  medication: { gloss: "药物", pos: "noun" },
  allergies: { gloss: "过敏史", pos: "noun" },
  smoker: { gloss: "吸烟者", pos: "noun" },
  alcohol: { gloss: "酒精；饮酒", pos: "noun" },
  family: { gloss: "家族；家庭", pos: "noun" },
  social: { gloss: "社会的（如社会史）", pos: "adjective" },
  male: { gloss: "男性（的）", pos: "noun / adjective" },
  female: { gloss: "女性（的）", pos: "noun / adjective" },
  years: { gloss: "年；岁", pos: "noun" },
  days: { gloss: "天", pos: "noun" },
  weeks: { gloss: "周", pos: "noun" },
  months: { gloss: "月", pos: "noun" },
  hours: { gloss: "小时", pos: "noun" },
  today: { gloss: "今天", pos: "adverb" },
  yesterday: { gloss: "昨天", pos: "adverb" },
  suddenly: { gloss: "突然", pos: "adverb" },
  gradually: { gloss: "逐渐地", pos: "adverb" },
  however: { gloss: "然而", pos: "adverb" },
  therefore: { gloss: "因此", pos: "adverb" },
  because: { gloss: "因为", pos: "conjunction" },
  although: { gloss: "尽管", pos: "conjunction" },
  which: { gloss: "哪一个；……的那个", pos: "pronoun" },
  most: { gloss: "最；大多数", pos: "adverb / adjective" },
  likely: { gloss: "可能的", pos: "adjective" },
  appropriate: { gloss: "适当的", pos: "adjective" },
  initial: { gloss: "初始的；首要的", pos: "adjective" },
  definitive: { gloss: "确定的；决定性的", pos: "adjective" },
  immediate: { gloss: "立即的", pos: "adjective" },
  urgent: { gloss: "紧急的", pos: "adjective" },
  stable: { gloss: "稳定的（生命体征）", pos: "adjective" },
  unstable: { gloss: "不稳定的", pos: "adjective" },
  common: { gloss: "常见的", pos: "adjective" },
  rare: { gloss: "罕见的", pos: "adjective" },
  benign: { gloss: "良性的", pos: "adjective" },
  malignant: { gloss: "恶性的", pos: "adjective" },
};

const SUFFIX_RULES: Array<[RegExp, string, string]> = [
  [/(itis)$/, "itis", "炎症（希腊语后缀 -itis）"],
  [/(ectomy)$/, "ectomy", "切除术（-ectomy）"],
  [/(otomy)$/, "otomy", "切开术（-otomy）"],
  [/(ostomy)$/, "ostomy", "造口术（-ostomy）"],
  [/(plasty)$/, "plasty", "成形术（-plasty）"],
  [/(scopy)$/, "scopy", "内镜/镜检查（-scopy）"],
  [/(graphy)$/, "graphy", "显像或记录方法（-graphy）"],
  [/(pathy)$/, "pathy", "病变（-pathy）"],
  [/(aemia|emia)$/, "aemia", "血液状态（-aemia）"],
  [/(uria)$/, "uria", "尿相关状态（-uria）"],
  [/(megaly)$/, "megaly", "增大（-megaly）"],
  [/(pnoea|pnea)$/, "pnoea", "呼吸（-pnoea）"],
  [/(algia)$/, "algia", "疼痛（-algia）"],
  [/(plegia)$/, "plegia", "瘫痪（-plegia）"],
  [/(oma)$/, "oma", "肿块或肿瘤（-oma）"],
  [/(osis)$/, "osis", "状态或病变（-osis）"],
];

const PREFIX_RULES: Array<[RegExp, string]> = [
  [/^dys/, "困难或异常（dys-）"],
  [/^tachy/, "快（tachy-）"],
  [/^brady/, "慢（brady-）"],
  [/^hypo/, "低或不足（hypo-）"],
  [/^hyper/, "高或过度（hyper-）"],
  [/^anti/, "抗（anti-）"],
  [/^sub/, "下方或次于（sub-）"],
  [/^peri/, "周围（peri-）"],
  [/^intra/, "内部（intra-）"],
  [/^extra/, "外部（extra-）"],
  [/^gastro/, "胃（gastro-）"],
  [/^hepato/, "肝（hepato-）"],
  [/^nephro/, "肾（nephro-）"],
  [/^neuro/, "神经（neuro-）"],
  [/^cardio/, "心脏（cardio-）"],
  [/^pulmo/, "肺（pulmo-）"],
];

const MULTIWORD = new Set(Object.keys(ENTRIES).filter((key) => key.includes(" ") || key.includes("-")));
const MAX_PHRASE_WORDS = 3;

function morphologyFor(token: string): string {
  const rule = SUFFIX_RULES.find(([pattern]) => pattern.test(token));
  if (rule) return `可识别后缀 ${rule[2]}；这只是构词线索，具体词义仍以词条释义为准。`;
  const prefix = PREFIX_RULES.find(([pattern]) => pattern.test(token));
  if (prefix) return `可识别前缀：${prefix[1]}；具体词义仍以词条释义为准。`;
  return NO_SPLIT;
}

function etymologyFor(token: string): string {
  const rule = SUFFIX_RULES.find(([pattern]) => pattern.test(token));
  if (rule) return `该词含有医学希腊语/拉丁语来源的后缀 ${rule[2].split("（")[0]}，属于现代医学术语的常规构词方式。`;
  return NO_SPLIT;
}

function sentenceCaseGloss(gloss: string, context: string): string {
  const trimmed = context.replace(/\s+/g, " ").trim();
  if (!trimmed) return `医学常用义：${gloss}`;
  return `本题语境取此义：${gloss}`;
}

/**
 * Look up one token or a short phrase. Returns null when the word is not in the
 * core lexicon, which is the signal to fall back to the existing server path.
 */
export function lookupLocal(surface: string, context = ""): {
  lemma: string;
  translationZh: string;
  contextualMeaningZh: string;
  partOfSpeech: string;
  morphologyZh: string;
  etymologyZh: string;
  mnemonicZh: string;
  entityType: string;
  source: string;
} | null {
  const normalized = normalizeSurface(surface);
  if (!normalized) return null;
  const candidates = [normalized, lemmaFor(normalized), `${lemmaFor(normalized)}e`, `${lemmaFor(normalized)}y`];
  let key = candidates.find((candidate) => ENTRIES[candidate]);

  // Phrase support: "rebound tenderness", "right iliac fossa".
  if (!key) {
    const words = normalized.split(/\s+/).filter(Boolean);
    for (let size = Math.min(MAX_PHRASE_WORDS, words.length); size >= 2; size -= 1) {
      for (let start = 0; start + size <= words.length; start += 1) {
        const phrase = words.slice(start, start + size).join(" ");
        if (ENTRIES[phrase] && (MULTIWORD.has(phrase) || size >= 2)) { key = phrase; break; }
      }
      if (key) break;
    }
  }
  if (!key) return null;

  const entry = ENTRIES[key];
  const sense = entry.senses?.find(([pattern]) => {
    try { return new RegExp(pattern, "i").test(context); } catch { return false; }
  });
  const gloss = sense ? sense[1] : entry.gloss;
  return {
    lemma: key,
    translationZh: gloss,
    contextualMeaningZh: sentenceCaseGloss(gloss, context),
    partOfSpeech: entry.pos,
    morphologyZh: morphologyFor(key),
    etymologyZh: etymologyFor(key),
    mnemonicZh: `${key} → ${gloss.replace(/[：:].*$/, "")}`,
    entityType: entry.entity ?? "clinical vocabulary",
    source: LEXICON_SOURCE,
  };
}

export function lexiconSize(): number {
  return Object.keys(ENTRIES).length;
}

/** True when the core lexicon already answers this token (used for warm-up). */
export function hasLocalEntry(surface: string): boolean {
  const normalized = normalizeSurface(surface);
  if (!normalized) return false;
  return Boolean(ENTRIES[normalized] || ENTRIES[lemmaFor(normalized)]);
}
