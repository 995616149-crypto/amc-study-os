/**
 * Non-Australian live evidence.
 *
 * The Australian guideline sites are unreachable from some networks, so a tutor
 * turn must still be able to check the wider internet instead of answering from
 * model memory. Two keyless, reachable channels are used here:
 *
 *  - NHS (UK) site search: real pages, parsed from the public search results;
 *  - Europe PMC: a broader literature index than PubMed (guidelines, reviews).
 *
 * Both are international sources. Callers must label them as such and must never
 * present them as Australian guidance.
 */

export type WebCitation = {
  sourceId: string;
  issuingBody: string;
  title: string;
  url: string;
  documentDate: string | null;
  retrievalDate: string;
  evidenceSummary: string;
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const MAX_PAGE_BYTES = 900_000;

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function compact(value: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function stripHtml(html: string) {
  return compact(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"'),
  );
}

/** Stop words that describe the exam mechanic rather than the condition. */
const SEARCH_STOP = new Set([
  "which", "following", "most", "likely", "best", "next", "appropriate", "should", "would", "could",
  "patient", "presents", "presenting", "years", "year", "history", "examination", "findings", "reveals",
  "investigations", "investigation", "management", "question", "answer", "single", "choose", "about",
  "after", "before", "there", "their", "these", "those", "with", "from", "this", "that", "have", "been",
]);

/**
 * Build a search query from the question itself.
 *
 * A chat message is often Chinese, and filtering non-Latin characters left an
 * empty query that fell back to "clinical guideline". Both the tutor and the
 * guidance panel now derive their query from the same English question text, so
 * they no longer disagree about whether the network returned anything.
 */
export function questionSearchTerms(question: any, limit = 8) {
  const text = `${question?.topic ?? ""} ${question?.stem_en ?? ""}`.slice(0, 600);
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []) {
    if (SEARCH_STOP.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const topicWords = String(question?.topic ?? "").toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
  const ranked = [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || (b[0].length - a[0].length))
    .map(([word]) => word);
  const ordered = [...new Set([...topicWords, ...ranked])].slice(0, limit);
  return ordered.join(" ");
}

function searchTerm(query: string) {
  const cleaned = compact(query)
    .replace(/[^\p{Script=Latin}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .slice(0, 10)
    .join(" ");
  return cleaned || "clinical guideline";
}

/** Read one page and return a keyword-relevant excerpt. */
async function pageExcerpt(url: string, keywords: string[], signal: AbortSignal, limit = 1_200) {
  const response = await fetch(url, { signal, headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow" });
  if (!response.ok) return null;
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_PAGE_BYTES) return null;
  const text = stripHtml(new TextDecoder().decode(buffer));
  if (text.length < 200) return null;
  const sentences = text.split(/(?<=[.!?])\s+/).filter((line) => line.length >= 60 && line.length <= 1_200);
  const ranked = sentences
    .map((line, index) => ({ line, index, score: keywords.reduce((n, word) => n + (line.toLowerCase().includes(word) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const picked: string[] = [];
  let size = 0;
  for (const row of ranked) {
    if (size + row.line.length > limit) continue;
    picked.push(row.line);
    size += row.line.length;
    if (size >= limit - 200) break;
  }
  return picked.join(" ") || text.slice(0, limit);
}

/**
 * NHS site search. The result list is server-rendered and its links carry the
 * destination in a `url=` parameter, so no JavaScript execution is required.
 */
export async function fetchNhsEvidence(
  query: string,
  options: { limit?: number; timeoutMs?: number } = {},
): Promise<{ citations: WebCitation[]; error: string | null }> {
  const limit = Math.min(Math.max(options.limit ?? 2, 1), 3);
  const { signal, clear } = withTimeout(options.timeoutMs ?? 9_000);
  const keywords = searchTerm(query).toLowerCase().split(/\s+/);
  try {
    const searchUrl = `https://www.nhs.uk/search/results?q=${encodeURIComponent(searchTerm(query))}`;
    const response = await fetch(searchUrl, { signal, headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow" });
    if (!response.ok) return { citations: [], error: `NHS_SEARCH_${response.status}` };
    const html = await response.text();

    const seen = new Set<string>();
    const targets: Array<{ url: string; title: string }> = [];
    // NHS search is broad: without a relevance filter a bowel-cancer query also
    // returns breast-screening pages. Require at least one query stem in the
    // title or destination path.
    const relevant = (url: string, title: string) => {
      const haystack = `${url} ${title}`.toLowerCase();
      // Two concept matches: "screening" alone also appears on breast/cervical pages,
      // so a single generic stem is not enough evidence of relevance.
      const hits = keywords.filter((word) => word.length >= 4 && haystack.includes(word.slice(0, Math.max(4, Math.min(7, word.length)))));
      return hits.length >= 2;
    };
    for (const match of html.matchAll(/<a[^>]+href="(\/search\/click\?url=([^"&]+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
      let path = "";
      try { path = decodeURIComponent(match[2]); } catch { continue; }
      if (!/^\/(conditions|tests-and-treatments|medicines|live-well)\//.test(path)) continue;
      const url = `https://www.nhs.uk${path}`;
      if (seen.has(url)) continue;
      const title = compact(stripHtml(match[3])).slice(0, 200);
      if (!relevant(path, title)) continue;
      seen.add(url);
      targets.push({ url, title });
      if (targets.length >= limit) break;
    }
    if (!targets.length) return { citations: [], error: null };

    const citations = (await Promise.all(targets.map(async (target, index) => {
      try {
        const excerpt = await pageExcerpt(target.url, keywords, signal);
        if (!excerpt) return null;
        return {
          sourceId: `nhs-${index + 1}`,
          issuingBody: "NHS (UK)",
          title: target.title || "NHS health information",
          url: target.url,
          documentDate: null,
          retrievalDate: new Date().toISOString(),
          evidenceSummary: excerpt,
        } satisfies WebCitation;
      } catch { return null; }
    }))).filter(Boolean) as WebCitation[];
    return { citations, error: null };
  } catch (error) {
    return { citations: [], error: String((error as Error)?.name === "AbortError" ? "NHS_TIMEOUT" : (error as Error)?.message ?? error).slice(0, 120) };
  } finally {
    clear();
  }
}

/** Europe PMC: broader than PubMed, includes guidelines and reviews. */
export async function fetchEuropePmc(
  query: string,
  options: { limit?: number; timeoutMs?: number } = {},
): Promise<{ citations: WebCitation[]; error: string | null }> {
  const limit = Math.min(Math.max(options.limit ?? 2, 1), 3);
  const { signal, clear } = withTimeout(options.timeoutMs ?? 9_000);
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(searchTerm(query))}&format=json&pageSize=${limit}&resultType=core`;
    const response = await fetch(url, { signal, headers: { accept: "application/json" } });
    if (!response.ok) return { citations: [], error: `EUROPEPMC_${response.status}` };
    const body: any = await response.json();
    const rows: any[] = Array.isArray(body?.resultList?.result) ? body.resultList.result : [];
    const citations = rows.flatMap((row, index) => {
      const title = compact(String(row?.title ?? ""));
      if (!title) return [];
      const pmid = String(row?.pmid ?? "").trim();
      const doi = String(row?.doi ?? "").trim();
      const target = pmid ? `https://europepmc.org/article/MED/${pmid}` : doi ? `https://doi.org/${doi}` : "";
      if (!target) return [];
      return [{
        sourceId: `epmc-${index + 1}`,
        issuingBody: `Europe PMC · ${compact(String(row?.journalTitle ?? row?.bookOrReportDetails?.publisher ?? "indexed literature"))}`.slice(0, 160),
        title: title.replace(/<[^>]*>/g, "").slice(0, 320),
        url: target,
        documentDate: compact(String(row?.pubYear ?? "")) || null,
        retrievalDate: new Date().toISOString(),
        evidenceSummary: compact(String(row?.abstractText ?? title)).slice(0, 1_200),
      } satisfies WebCitation];
    });
    return { citations, error: null };
  } catch (error) {
    return { citations: [], error: String((error as Error)?.name === "AbortError" ? "EUROPEPMC_TIMEOUT" : (error as Error)?.message ?? error).slice(0, 120) };
  } finally {
    clear();
  }
}
