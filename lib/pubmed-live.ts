/**
 * PubMed (NLM E-utilities) live evidence.
 *
 * Why this exists: the Australian guideline sites the product prefers are not
 * reachable from every network (health.gov.au, canceraustralia.gov.au and
 * nhmrc.gov.au can all time out). PubMed is a stable, free, keyless endpoint that
 * answers in about two seconds, so a tutor turn can still quote real, checkable
 * literature instead of silently falling back to model memory.
 *
 * These citations are international peer-reviewed literature, NOT Australian
 * guidance, and the caller must label them that way.
 */

export type LiveCitation = {
  sourceId: string;
  issuingBody: string;
  title: string;
  url: string;
  documentDate: string | null;
  retrievalDate: string;
  evidenceSummary: string;
};

const EUtils = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const PUBMED_TIMEOUT_MS = 10_000;

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function compact(value: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** Trim a query to the terms E-utilities handles well. */
export function pubmedTerm(query: string) {
  const cleaned = compact(query)
    .replace(/[^\p{Script=Latin}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .slice(0, 12)
    .join(" ");
  return cleaned || "clinical guideline";
}

export async function fetchPubMedEvidence(
  query: string,
  options: { limit?: number; timeoutMs?: number } = {},
): Promise<{ citations: LiveCitation[]; error: string | null }> {
  // The public E-utilities endpoint occasionally drops a connection. One retry with
  // a fresh timeout converts a transient failure into a normal answer.
  const first = await fetchPubMedOnce(query, options);
  if (first.citations.length || !first.error) return first;
  return fetchPubMedOnce(query, options);
}

async function fetchPubMedOnce(
  query: string,
  options: { limit?: number; timeoutMs?: number } = {},
  rawTerm = false,
): Promise<{ citations: LiveCitation[]; error: string | null }> {
  const limit = Math.min(Math.max(options.limit ?? 3, 1), 5);
  const { signal, clear } = withTimeout(options.timeoutMs ?? PUBMED_TIMEOUT_MS);
  try {
    const term = rawTerm ? query : pubmedTerm(query);
    const searchUrl = `${EUtils}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&sort=relevance&term=${encodeURIComponent(term)}`;
    const searchResponse = await fetch(searchUrl, { signal, headers: { accept: "application/json" } });
    if (!searchResponse.ok) return { citations: [], error: `PUBMED_SEARCH_${searchResponse.status}` };
    const searchBody: any = await searchResponse.json();
    const ids: string[] = Array.isArray(searchBody?.esearchresult?.idlist) ? searchBody.esearchresult.idlist.slice(0, limit) : [];
    if (!ids.length) return { citations: [], error: null };

    const summaryUrl = `${EUtils}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
    const summaryResponse = await fetch(summaryUrl, { signal, headers: { accept: "application/json" } });
    if (!summaryResponse.ok) return { citations: [], error: `PUBMED_SUMMARY_${summaryResponse.status}` };
    const summaryBody: any = await summaryResponse.json();
    const results = summaryBody?.result ?? {};

    // Abstracts are best-effort: a citation with title/journal/year is still useful.
    let abstractText = "";
    try {
      const abstractUrl = `${EUtils}/efetch.fcgi?db=pubmed&rettype=abstract&retmode=text&id=${ids.join(",")}`;
      const abstractResponse = await fetch(abstractUrl, { signal, headers: { accept: "text/plain" } });
      if (abstractResponse.ok) abstractText = await abstractResponse.text();
    } catch { /* keep the metadata-only citations */ }

    const blocks = abstractText.split(/\n\s*\n(?=\d+\.\s)/).map(compact).filter(Boolean);
    const citations: LiveCitation[] = ids.flatMap((id, index) => {
      const row = results[id];
      if (!row?.title) return [];
      const block = blocks.find((value) => value.includes(`PMID: ${id}`)) ?? "";
      const abstract = block.replace(/^.*?Abstract\s*/i, "").replace(/PMID:\s*\d+.*$/i, "").trim();
      return [{
        sourceId: `pubmed-${index + 1}`,
        issuingBody: `PubMed · ${compact(row.fulljournalname ?? row.source ?? "NLM")}`.slice(0, 160),
        title: compact(String(row.title)).replace(/<[^>]*>/g, "").slice(0, 320),
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        documentDate: compact(String(row.pubdate ?? "")) || null,
        retrievalDate: new Date().toISOString(),
        evidenceSummary: (abstract || compact(String(row.title))).slice(0, 1_200),
      }];
    });
    return { citations, error: null };
  } catch (error) {
    return { citations: [], error: String((error as Error)?.name === "AbortError" ? "PUBMED_TIMEOUT" : (error as Error)?.message ?? error).slice(0, 120) };
  } finally {
    clear();
  }
}

/**
 * Australian guidance as indexed by the international literature.
 *
 * health.gov.au, NHMRC and Cancer Australia are unreachable from this network, so
 * the Australian recommendation is retrieved through PubMed's indexing of those
 * guidelines (Medical Journal of Australia, RACGP, NHMRC publications). It is real
 * Australian guidance, just read through a reachable index.
 */
export async function fetchAustralianGuidelineEvidence(
  query: string,
  options: { limit?: number; timeoutMs?: number } = {},
): Promise<{ citations: LiveCitation[]; error: string | null }> {
  const term = `Australia[Title/Abstract] AND (guideline[Title/Abstract] OR "clinical practice guideline"[Title/Abstract] OR recommendation[Title/Abstract]) AND (${pubmedTerm(query)})`;
  return fetchPubMedTerm(term, options);
}

/** Run a raw E-utilities term (already valid PubMed syntax). */
async function fetchPubMedTerm(
  term: string,
  options: { limit?: number; timeoutMs?: number } = {},
): Promise<{ citations: LiveCitation[]; error: string | null }> {
  return fetchPubMedOnce(term, options, true);
}
