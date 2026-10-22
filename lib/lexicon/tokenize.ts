/**
 * Token handling shared by the cache and the lexicon.
 *
 * Kept in its own module (no dictionary data) so the first-paint bundle never
 * carries the word list.
 */

/** Version of the lexicon/schema pair that a cache key is bound to. */
export const LEXICON_VERSION = "clinical-core-2026-10-18-v1";

const IRREGULAR: Record<string, string> = {
  been: "be", was: "be", were: "be", is: "be", are: "be", am: "be",
  men: "man", women: "woman", children: "child", feet: "foot", teeth: "tooth",
  diagnoses: "diagnosis", prognoses: "prognosis", analyses: "analysis",
  crises: "crisis", bacteria: "bacterium",
};

/** Strip surrounding punctuation and normalise the token. */
export function normalizeSurface(raw: string): string {
  return String(raw ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/^[^a-z]+|[^a-z'-]+$/g, "")
    .replace(/-+$/g, "");
}

/**
 * Best-effort lemma. Only suffix rules and a small irregular table, so it is cheap
 * and deterministic. The lexicon still tries the exact surface form first.
 */
export function lemmaFor(normalized: string): string {
  if (!normalized) return "";
  if (IRREGULAR[normalized]) return IRREGULAR[normalized];
  if (normalized.endsWith("ies") && normalized.length > 4) return `${normalized.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(normalized) && normalized.length > 4) return normalized.slice(0, -2);
  if (normalized.endsWith("s") && !normalized.endsWith("ss") && normalized.length > 3) return normalized.slice(0, -1);
  if (normalized.endsWith("ing") && normalized.length > 5) {
    const base = normalized.slice(0, -3);
    return base.replace(/(.)\1$/, "$1");
  }
  if (normalized.endsWith("ed") && normalized.length > 4) return normalized.slice(0, -2);
  return normalized;
}

/** Extract candidate tokens from a stem, for zero-cost local warm-up only. */
export function extractTokens(text: string, limit = 40): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of String(text ?? "").matchAll(/[A-Za-z][A-Za-z'-]{2,}/g)) {
    const token = normalizeSurface(match[0]);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
    if (out.length >= limit) break;
  }
  return out;
}
