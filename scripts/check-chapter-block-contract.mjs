import { inspectChapterSections, normalizeChapterBlock } from "../lib/chapter-block-contract.js";
import { readFileSync } from "node:fs";

const longGuideline = "Australian Therapeutic Guidelines: Cardiovascular — long monitored pharmacological termination protocol";
const fixtures = [
  { id: "medicine", title: "Medicine", body: "Long prose remains one normal reading column.", blocks: [{ type: "paragraph", text: `${longGuideline} is prose, not a visual grid.` }] },
  { id: "surgery", title: "Surgery", body: "Lists keep their marker and copy together.", blocks: [{ type: "bullets", items: ["A long antibiotic name remains in one list item without a fixed row height."] }] },
  { id: "paediatrics", title: "Paediatrics", body: "A two-column drug table may scroll on a narrow viewport.", blocks: [{ type: "table", headers: ["Drug", "Use"], rows: [["Very-long-drug-name", "Optional field may be empty: "]] }] },
  { id: "obgyn", title: "O&G", body: "Comparison tables retain consistent columns.", blocks: [{ type: "table", headers: ["Assessment", "Maternal", "Fetal", "Escalation"], rows: [["Stable", "Observe", "Monitor", "Review"]] }] },
  { id: "mental-health", title: "Mental Health", body: "Algorithms provide a number and a single copy column.", blocks: [{ type: "algorithm", steps: ["Assess safety, 中文翻译 and bilingual guidance together."] }] },
];

const issues = inspectChapterSections(fixtures);
if (issues.length) throw new Error(`fixture schema issues: ${issues.join("; ")}`);
if (normalizeChapterBlock({ type: "table", headers: ["A", "B"], rows: [["only one"]] }) !== null) throw new Error("inconsistent table row was accepted");
if (normalizeChapterBlock({ type: "algorithm", steps: ["one"] })?.type !== "algorithm") throw new Error("algorithm was not normalized");
const catalogSource = readFileSync(new URL("../lib/open-knowledge.ts", import.meta.url), "utf8");
const chapterStart = catalogSource.indexOf("export const PSVT_CHAPTER = ");
const chapterEnd = catalogSource.indexOf("export const PSVT_MAPPINGS = ");
if (chapterStart < 0 || chapterEnd < 0) throw new Error("PSVT chapter source was not found");
const chapterLiteral = catalogSource.slice(chapterStart, chapterEnd).replace(/^export const PSVT_CHAPTER =\s*/, "").trim().replace(/;$/, "");
const psvtChapter = Function("PSVT_CHAPTER_ID", `return (${chapterLiteral})`)("cardiology_psvt");
const canonicalIssues = inspectChapterSections(psvtChapter.sections);
if (canonicalIssues.length) throw new Error(`canonical chapter schema issues: ${canonicalIssues.join("; ")}`);
console.log(`chapter block contract: PASS (${psvtChapter.sections.length} canonical sections; prose, list, 2-column table, 4-column table, empty cell, bilingual copy, long names, algorithm)`);
