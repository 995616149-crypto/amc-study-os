// AMC Coach: an exam-scoring coach, not an explanation paraphraser and not a
// translator.  The model produces native Simplified Chinese directly from the
// original stem, options, source-era answer and source-era explanation.
//
// Fewer and sharper beats a filled-in template: when the available source
// evidence is thin, the coach is allowed — and asked — to return fewer
// sections instead of padding every heading with generic text.

export const COACH_VERSION = "amc-coach-v2";

export type CoachCue = { cue: string; think: string };
export type CoachCueDecision = { cue: string; decision: string };
export type CoachDifferentiator = { pair: string; discriminator: string; supporting: string; opposing: string };
export type CoachEvidenceLevel = "RICH" | "THIN" | "NONE";
export type AmcCoach = {
  diagnosis: string | null;
  cues: CoachCue[];
  cueDecisions: CoachCueDecision[];
  differentiators: CoachDifferentiator[];
  trap: { option: string | null; why: string } | null;
  takeaway: string;
};

export type CoachInput = {
  stem: string;
  options: { key: string; text: string }[];
  answerKey: string;
  sourceExplanation: string;
  memoryRule?: string | null;
  topic?: string | null;
};

export type CoachEvidence = {
  level: CoachEvidenceLevel;
  sourceChars: number;
  optionCount: number;
  answerKnown: boolean;
  /** Sections the coach is allowed to use at this evidence level. */
  allowed: string[];
  /** Sections deliberately not requested at this evidence level. */
  withheld: string[];
};

/**
 * Deterministic evidence budget.  The model is never asked for a section that
 * the available source text cannot support, so "少而准" is enforced by
 * construction and not just by a prompt instruction.
 */
// The v2.9.4 import wrote this sentence whenever the canonical record carried no
// explanation.  It is an absence marker, not evidence, and must never license a
// padded coach section.
const PLACEHOLDER_EXPLANATIONS = [
  "no source-era explanation was supplied in the canonical record.",
  "retain the source-era answer for question-bank study; verify current australian guidance before clinical use.",
];

function realExplanation(value: unknown) {
  const text = String(value ?? "").trim();
  const lower = text.toLowerCase();
  return PLACEHOLDER_EXPLANATIONS.some((placeholder) => lower === placeholder || lower.startsWith(placeholder)) ? "" : text;
}

export function coachEvidence(input: Pick<CoachInput, "sourceExplanation" | "options" | "answerKey">): CoachEvidence {
  const sourceChars = realExplanation(input.sourceExplanation).length;
  const optionCount = input.options.length;
  const answerKnown = /^[A-E]$/.test(String(input.answerKey ?? "").trim().toUpperCase());
  const level: CoachEvidenceLevel = sourceChars >= 260 ? "RICH" : sourceChars >= 80 ? "THIN" : "NONE";
  const allowed = ["cues", "takeaway"];
  const withheld: string[] = [];
  if (level !== "NONE" || answerKnown) allowed.push("cueDecisions");
  else withheld.push("cueDecisions");
  if (level === "RICH") allowed.push("differentiators");
  else withheld.push("differentiators");
  if (level !== "NONE") allowed.push("trap");
  else withheld.push("trap");
  if (optionCount >= 5 && answerKnown) allowed.push("diagnosis");
  else withheld.push("diagnosis");
  return { level, sourceChars, optionCount, answerKnown, allowed, withheld };
}

const LANGUAGE_RULES = [
  "全程使用自然、简洁、临床口语化的简体中文。",
  "保留必要的英文医学术语与缩写（例如 pearly papule、umbilication、dermatomal、AVNRT），不要硬翻。",
  "不要逐句翻译或改写 source explanation；不要复述它的句子、结构与顺序。",
  "不要复述题干原文；不要使用“该患者为……因此……”“综上所述”“本例提示”这类模板反复绕回题干。",
  "不要泛泛而谈“临床推理”“综合判断”“需要结合临床”。",
  "不要断言现行指南推荐、剂量、首选或禁忌；这些只属于 Current Evidence 层，不在你的职责内。",
  "不要输出 Markdown、HTML、星号、井号、竖线或表格符号。",
];

const ACCURACY_RULES = [
  "宁少勿滥：只有当你确实能从题干、选项或原解析中说出具体依据时才写该条目。",
  "写不出具体依据时，就把该栏留空（返回空数组或 null），不要用“常见”“需要鉴别”“结合临床”这类空话凑数。",
  "空数组和 null 是允许并且被鼓励的答案；凑满栏目视为错误。",
];

function shapeFor(evidence: CoachEvidence) {
  const shape: Record<string, unknown> = {
    cues: [{ cue: "题干中判别力最强的关键词或关键词组合", think: "看到它应该立刻想到的诊断或判断" }],
    takeaway: "一句能在考场直接调用的话，不超过 40 字",
  };
  if (evidence.allowed.includes("diagnosis")) shape.diagnosis = "本题最可能的诊断或考点，不超过 20 字；无法确定时返回 null";
  if (evidence.allowed.includes("cueDecisions")) shape.cueDecisions = [{ cue: "有鉴别价值的词", decision: "由此决定的事：诊断方向 / 首选检查 / 处理决策" }];
  if (evidence.allowed.includes("differentiators")) shape.differentiators = [{ pair: "A vs B", discriminator: "真正拉开差距的那一点", supporting: "支持本诊断的特征", opposing: "反对相似诊断的特征" }];
  if (evidence.allowed.includes("trap")) shape.trap = { option: "A", why: "该题最诱人的错误选项为什么会骗到人，只写干扰点；没有可靠依据时返回 null" };
  return shape;
}

function budgetLine(evidence: CoachEvidence) {
  const parts: string[] = [];
  parts.push(evidence.level === "RICH"
    ? "本题原始解析较完整：cues 最多 5 条，cueDecisions 最多 4 条，differentiators 最多 3 条。"
    : evidence.level === "THIN"
      ? "本题原始解析很简短：cues 最多 3 条，cueDecisions 最多 2 条，不要输出 differentiators。"
      : "本题没有任何原始解析：cues 最多 2 条，只写题干本身能直接支撑的识别线索，不要输出 differentiators 和 trap。");
  if (evidence.withheld.length) parts.push("以下栏目本轮未开放，请直接省略这些键：" + evidence.withheld.join("、") + "。");
  parts.push("takeaway 必须输出且只有一句。" + (evidence.allowed.includes("diagnosis") ? "diagnosis 无法确定时返回 null。" : ""));
  return parts.join("");
}

export function buildCoachSystemPrompt(evidence: CoachEvidence) {
  return [
    "你是「AMC 踩分点教练」，面向中文母语医学考生。",
    "你的唯一任务：告诉考生在考场看到题干里的哪些词或关键词组合，应该立刻想到什么。",
    "",
    "硬性要求：",
    ...LANGUAGE_RULES.map((rule, index) => `${index + 1}. ${rule}`),
    "",
    "准确度要求（比格式重要）：",
    ...ACCURACY_RULES.map((rule, index) => `${index + 1}. ${rule}`),
    "",
    budgetLine(evidence),
    "",
    "输出必须是严格 JSON，不要任何解释文字：",
    JSON.stringify(shapeFor(evidence)),
    "",
    "differentiators 每条都要用 A vs B 的形式，并明确写出真正拉开差距的那一点、支持本诊断的特征、反对相似诊断的特征。只放有鉴别价值的词，不要列百科全书式鉴别诊断。",
  ].join("\n");
}

export function isRealMemoryRule(value: unknown) {
  return realExplanation(value).length > 0;
}

export function buildCoachUserPrompt(input: CoachInput, evidence: CoachEvidence) {
  return [
    `题目领域：${input.topic ?? "未标注"}`,
    `题干：${input.stem}`,
    `选项：\n${input.options.map((option) => `${option.key}. ${option.text}`).join("\n")}`,
    `原书答案：${input.answerKey || "（原记录没有答案）"}`,
    `原书解析（仅供你判断考点，禁止复述、禁止改写、禁止翻译；可用长度 ${evidence.sourceChars} 字符）：${realExplanation(input.sourceExplanation) || "（原记录没有解析）"}`,
    isRealMemoryRule(input.memoryRule) ? `原书记忆规则（同上，禁止复述）：${input.memoryRule}` : "",
    "",
    "只输出 JSON。",
  ].filter(Boolean).join("\n");
}

export function buildCoachRetryPrompt(echoes: string[]) {
  return [
    "你上一次的输出复述了原书解析，这是不允许的。以下片段与原解析重合，必须彻底重写：",
    ...echoes.slice(0, 3).map((echo) => `- ${echo}`),
    "重写要求：只保留「考场看到什么词 → 立刻想到什么」的踩分点，用自己的临床语言表达，不得再出现上述任何片段或它们的近似改写。宁可少写一条，也不要凑数。仍然只输出同样的 JSON 结构。",
  ].join("\n");
}

export function normalizeForEcho(value: string) {
  return value.replace(/\s+/g, " ").replace(/[，。；：、,.!?！？；：""''“”‘’（）()\[\]【】]/g, "").trim().toLowerCase();
}

/**
 * Deterministic guard: reports source-explanation fragments (>= 42 normalised
 * characters) that were echoed into the coach output.  Used to force one rewrite
 * so the coach never becomes a paraphrase of the source explanation.
 */
export function findSourceEchoes(coach: AmcCoach, sourceExplanation: string) {
  const source = normalizeForEcho(realExplanation(sourceExplanation));
  if (source.length < 42) return [];
  const fragments: string[] = [];
  for (let index = 0; index + 42 <= source.length; index += 21) {
    const fragment = source.slice(index, index + 42);
    if (/^[a-z]{0,3}$/.test(fragment)) continue;
    fragments.push(fragment);
  }
  const pool = [
    coach.diagnosis ?? "", coach.takeaway, coach.trap?.why ?? "",
    ...coach.cues.flatMap((cue) => [cue.cue, cue.think]),
    ...coach.cueDecisions.flatMap((item) => [item.cue, item.decision]),
    ...coach.differentiators.flatMap((item) => [item.pair, item.discriminator, item.supporting, item.opposing]),
  ].map(normalizeForEcho).join(" ");
  const hits = fragments.filter((fragment) => pool.includes(fragment));
  return [...new Set(hits)].slice(0, 3);
}

/**
 * Drops any section the evidence budget did not allow, so a chatty model cannot
 * smuggle padded sections back in.
 */
export function enforceEvidenceBudget(coach: AmcCoach, evidence: CoachEvidence): AmcCoach {
  return {
    diagnosis: evidence.allowed.includes("diagnosis") ? coach.diagnosis : null,
    cues: coach.cues.slice(0, evidence.level === "RICH" ? 5 : evidence.level === "THIN" ? 3 : 2),
    cueDecisions: evidence.allowed.includes("cueDecisions") ? coach.cueDecisions.slice(0, evidence.level === "RICH" ? 4 : 2) : [],
    differentiators: evidence.allowed.includes("differentiators") ? coach.differentiators.slice(0, 3) : [],
    trap: evidence.allowed.includes("trap") ? coach.trap : null,
    takeaway: coach.takeaway,
  };
}
