import { env } from "cloudflare:workers";
import { sessionUser, type RequestUser } from "@/lib/owner-auth";
import { wrapStateDb } from "@/lib/state-store";

export type { RequestUser };

/**
 * Identity injected by the hosting platform.  Still authoritative when present,
 * but a public URL reached from an ordinary browser never carries it — which is
 * why the routes now call `currentUser` instead.
 */
function headerIdentity(request: Request): RequestUser | null {
  const userId = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email");
  const encoded = request.headers.get("oai-authenticated-user-full-name");
  const encoding = request.headers.get("oai-authenticated-user-full-name-encoding");
  if (userId && email) {
    let displayName = email;
    if (encoded && encoding === "percent-encoded-utf-8") {
      try { displayName = decodeURIComponent(encoded); } catch { displayName = email; }
    }
    return { userId, email, displayName };
  }
  return null;
}

function previewIdentity(): RequestUser | null {
  if (process.env.NODE_ENV !== "production") return { userId: "preview-user", email: "preview@local", displayName: "Preview learner" };
  return null;
}

/** Header-only resolution.  Kept for internal callers that run outside a request. */
export function requestUser(request: Request): RequestUser | null {
  return headerIdentity(request) ?? previewIdentity();
}

/**
 * The identity used by every route: platform headers first, then a verified
 * owner session cookie.  Both paths are server-side; nothing here trusts a value
 * supplied by the page.
 */
export async function currentUser(request: Request): Promise<RequestUser | null> {
  const injected = headerIdentity(request);
  if (injected) return injected;
  try {
    const session = await sessionUser(db(), request);
    if (session) return session;
  } catch {
    // A database that predates the owner-session tables simply has no sessions.
  }
  return previewIdentity();
}

/**
 * The database every route uses.
 *
 * It is the bundled D1 with a thin adapter on top: content tables are read and
 * written exactly as before, while writes to a mutable state table additionally make
 * that table's rows durable in the WorkBuddy cloud database, so a republish can no
 * longer replace a learner's records with the developer's snapshot. The SQL is never
 * rewritten — see `lib/state-store.ts`.
 */
export function db() {
  if (!env.DB) throw new Error("D1 binding unavailable");
  return wrapStateDb(env.DB);
}

/** The unwrapped binding, for the few callers that must bypass the adapter. */
export function rawDb() {
  if (!env.DB) throw new Error("D1 binding unavailable");
  return env.DB;
}

export async function ensureUser(user: RequestUser) {
  const now = new Date().toISOString();
  await db().prepare(`INSERT INTO users (id, identity_key, email, display_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(identity_key) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, updated_at=excluded.updated_at`)
    .bind(`user:${user.userId}`, user.userId, user.email, user.displayName, now, now).run();
  return `user:${user.userId}`;
}

export async function seedPilot() {
  const database = db();
  const coach = {
    evidenceStatus: "web-verified",
    searchedAt: "2026-09-19",
    bigIdea: "Australia now uses primary HPV testing—not a Pap-smear interval—as the routine cervical screening framework.",
    bigIdeaZh: "澳大利亚现行常规宫颈筛查以 HPV 初筛为核心，而不是沿用旧的宫颈涂片间隔。",
    currentPractice: "Women and people with a cervix aged 25–74 are invited for a Cervical Screening Test every 5 years. The test looks for HPV; vaccination does not remove the need for screening.",
    currentPracticeZh: "25–74 岁女性及有宫颈者每 5 年接受一次宫颈筛查；筛查检测 HPV，接种 HPV 疫苗后仍需参加筛查。",
    sourceVsCurrent: "The historical source-era Pap pathway is preserved for exam archaeology. For current Australian practice, replace a 2-year Pap-smear rule with 5-year primary HPV screening for eligible average-risk people.",
    sourceVsCurrentZh: "原书年代的宫颈涂片路径保留用于理解旧题；现行澳洲实践中，平均风险人群应将旧的每 2 年 Pap 规则替换为每 5 年 HPV 初筛。",
    decision: ["Confirm this is routine screening, not symptom investigation.", "Check eligibility: cervix, age 25–74, ever sexually active.", "Use a 5-year Cervical Screening Test pathway; self-collection is an available option."],
    decisionZh: ["先确认属于常规筛查，而不是有症状者的诊断性检查。", "核对资格：有宫颈、25–74 岁、曾有性接触。", "进入每 5 年宫颈筛查路径；可选择自行采样。"],
    trap: "Do not apply a screening interval to a person with symptoms; investigate symptoms clinically.",
    trapZh: "有症状者不能机械套用筛查间隔，应按临床问题进行诊断性评估。",
  };
  const sourceList = [{ title: "Australian Government — About the National Cervical Screening Program", url: "https://www.health.gov.au/our-work/national-cervical-screening-program/about-the-national-cervical-screening-program", accessed: "2026-09-19" }];
  const statements = [
    database.prepare(`INSERT OR IGNORE INTO users (id,identity_key,email,display_name,created_at,updated_at) VALUES ('system','system','system@local','System',?,?)`).bind("2026-09-19T00:00:00Z", "2026-09-19T00:00:00Z"),
    database.prepare(`INSERT OR IGNORE INTO sources (id,name,source_type,source_year,drive_locator,copyright_scope,import_status,current_guideline_status,metadata_json) VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind("src-pilot", "Migration validation set", "pilot", 2026, "Drive import pending", "private-study", "pilot-ready", "separate-current-layer", JSON.stringify({ note: "Synthetic validation items; not verbatim Vernon content" })),
    database.prepare(`INSERT OR IGNORE INTO questions (id,source_id,source_question_no,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,source_year,import_version,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`)
      .bind("q-screen-01","src-pilot","PILOT-01","Population Health","Women’s health","Cervical screening","Prevention / Screening","A healthy 24-year-old woman who has been sexually active asks when she should enter routine cervical screening in Australia. What is the best answer?","一名健康的 24 岁女性有性生活史，询问她应在何时进入澳大利亚常规宫颈筛查。最佳答案是什么？","C","Routine screening begins at age 25 for eligible people under the current Australian program.","现行澳大利亚项目中，符合条件者从 25 岁开始常规筛查。","Routine cervical screening: think 25–74, HPV test, every 5 years.","常规宫颈筛查记忆：25–74 岁、HPV 检测、每 5 年一次。",2026,"pilot-v1"),
    database.prepare(`INSERT OR IGNORE INTO questions (id,source_id,source_question_no,domain,system,topic,clinical_task,stem_en,stem_zh,answer_key,source_explanation_en,source_explanation_zh,memory_rule_en,memory_rule_zh,source_year,import_version,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`)
      .bind("q-screen-02","src-pilot","PILOT-02","Population Health","Women’s health","Cervical screening","Prevention / Screening","A 31-year-old asymptomatic woman had a normal Pap smear in a historical question bank. Under the source-era program, when was repeat screening recommended?","一名 31 岁无症状女性在旧题库中宫颈涂片正常。按原书年代的筛查项目，建议何时复查？","B","The source-era program used repeat Pap smears at 2-year intervals. This is retained as the historical answer, not current practice.","原书年代项目采用每 2 年重复宫颈涂片。本答案仅保留为历史答案，并非现行实践。","Old source: Pap every 2 years. Current Australia: primary HPV screening every 5 years for eligible people.","旧资料：Pap 每 2 年。现行澳洲：符合条件者每 5 年 HPV 初筛。",2014,"pilot-v1"),
    database.prepare(`INSERT OR IGNORE INTO knowledge_nodes (id,canonical_name,domain,system,condition,clinical_task,current_summary,current_guideline_verified_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind("node-cervical-screening","Cervical screening — eligibility & interval","Population Health","Women’s health","Cervical cancer prevention","Prevention / Screening","Eligible people aged 25–74 are invited for HPV-based cervical screening every 5 years.","2026-09-19"),
    database.prepare(`INSERT OR IGNORE INTO question_node_links (question_id,node_id,weight,relation_type) VALUES (?,?,?,?)`).bind("q-screen-01","node-cervical-screening",1,"primary"),
    database.prepare(`INSERT OR IGNORE INTO question_node_links (question_id,node_id,weight,relation_type) VALUES (?,?,?,?)`).bind("q-screen-02","node-cervical-screening",1,"primary"),
    database.prepare(`INSERT OR IGNORE INTO coach_runs (id,user_id,question_id,created_at,evidence_status,source_comparison_status,result_json,source_list_json,searched_at,cache_key) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind("coach-public-screen-01","system","q-screen-01","2026-09-19T00:00:00Z","web-verified","complete",JSON.stringify(coach),JSON.stringify(sourceList),"2026-09-19","cervical-screening-2026-09-19"),
    database.prepare(`INSERT OR IGNORE INTO coach_runs (id,user_id,question_id,created_at,evidence_status,source_comparison_status,result_json,source_list_json,searched_at,cache_key) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind("coach-public-screen-02","system","q-screen-02","2026-09-19T00:00:00Z","web-verified","complete",JSON.stringify(coach),JSON.stringify(sourceList),"2026-09-19","cervical-screening-2026-09-19"),
  ];
  const optionRows = [
    ["o1a","q-screen-01","A","Immediately", "立即",1],["o1b","q-screen-01","B","At age 21", "21 岁",2],["o1c","q-screen-01","C","At age 25", "25 岁",3],["o1d","q-screen-01","D","At age 30", "30 岁",4],["o1e","q-screen-01","E","Only after pregnancy", "仅在妊娠后",5],
    ["o2a","q-screen-02","A","In 1 year", "1 年后",1],["o2b","q-screen-02","B","In 2 years", "2 年后",2],["o2c","q-screen-02","C","In 3 years", "3 年后",3],["o2d","q-screen-02","D","In 5 years", "5 年后",4],["o2e","q-screen-02","E","No further screening", "无需再筛查",5],
  ];
  for (const row of optionRows) statements.push(database.prepare(`INSERT OR IGNORE INTO question_options (id,question_id,option_key,text_en,text_zh,sort_order) VALUES (?,?,?,?,?,?)`).bind(...row));
  await database.batch(statements);
}
