const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const strings = (value) => Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;

export function normalizeChapterBlock(value) {
  if (!value || typeof value !== "object") return null;
  if (value.type === "paragraph" && nonEmptyString(value.text)) return { type: "paragraph", text: value.text };
  if (value.type === "callout" && nonEmptyString(value.title) && nonEmptyString(value.text)) return { type: "callout", title: value.title, text: value.text };
  if (value.type === "bullets" && strings(value.items)) return { type: "bullets", items: value.items };
  if (value.type === "algorithm" && strings(value.steps)) return { type: "algorithm", steps: value.steps };
  if (value.type === "table" && strings(value.headers) && value.headers.length > 0 && Array.isArray(value.rows) && value.rows.every((row) => strings(row) && row.length === value.headers.length)) {
    return { type: "table", headers: value.headers, rows: value.rows };
  }
  return null;
}

export function inspectChapterSections(sections) {
  const issues = [];
  if (!Array.isArray(sections)) return ["sections is not an array"];
  sections.forEach((section, sectionIndex) => {
    if (!section || typeof section !== "object" || !nonEmptyString(section.id) || !nonEmptyString(section.title) || !nonEmptyString(section.body)) {
      issues.push(`section ${sectionIndex + 1} has invalid required fields`);
      return;
    }
    if (section.blocks !== undefined && !Array.isArray(section.blocks)) issues.push(`section ${section.id} blocks is not an array`);
    (Array.isArray(section.blocks) ? section.blocks : []).forEach((block, blockIndex) => {
      if (!normalizeChapterBlock(block)) issues.push(`section ${section.id} block ${blockIndex + 1} is malformed`);
    });
  });
  return issues;
}
