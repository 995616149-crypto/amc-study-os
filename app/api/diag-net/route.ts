/**
 * Outbound reachability probe for the deployed runtime.
 *
 * The Australian sites are unreachable from some networks and the international
 * channels returned zero items in production while working locally, so this endpoint
 * reports what the deployed sandbox can actually reach. It probes a fixed list only -
 * it cannot be used to fetch arbitrary URLs.
 */
import { fetchPubMedEvidence } from "@/lib/pubmed-live";
import { fetchNhsEvidence, fetchEuropePmc, questionSearchTerms } from "@/lib/web-live";

const TARGETS = [
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?retmode=json",
  "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=cancer&format=json&pageSize=1",
  "https://www.nhs.uk/search/results?q=cancer",
  "https://api.openalex.org/works?search=cancer&per-page=1",
  "https://api.crossref.org/works?query=cancer&rows=1",
  "https://www.health.gov.au/",
  "https://www.racgp.org.au/",
];

let cached: { at: number; body: unknown } | null = null;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q");
  if (query) {
    // Run the real retrieval functions the tutor uses, so a zero result can be
    // explained without signing in to the app.
    const [pubmed, nhs, epmc] = await Promise.all([
      fetchPubMedEvidence(query, { limit: 2, timeoutMs: 8_000 }),
      fetchNhsEvidence(query, { limit: 1, timeoutMs: 9_000 }),
      fetchEuropePmc(query, { limit: 2, timeoutMs: 9_000 }),
    ]);
    return Response.json({
      query,
      pubmed: { count: pubmed.citations.length, error: pubmed.error, first: pubmed.citations[0]?.url ?? null },
      nhs: { count: nhs.citations.length, error: nhs.error, first: nhs.citations[0]?.url ?? null },
      europepmc: { count: epmc.citations.length, error: epmc.error, first: epmc.citations[0]?.url ?? null },
    });
  }
  if (cached && Date.now() - cached.at < 60_000) return Response.json(cached.body);
  const results = await Promise.all(TARGETS.map(async (url) => {
    const started = Date.now();
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(8_000),
        headers: { accept: "text/html,application/json;q=0.9,*/*;q=0.8", "user-agent": "AMC-Study-OS-Reachability/1.0" },
      });
      return { url, ok: response.ok, status: response.status, ms: Date.now() - started };
    } catch (error) {
      return { url, ok: false, status: 0, ms: Date.now() - started, error: String((error as Error)?.message ?? error).slice(0, 80) };
    }
  }));
  const body = { at: new Date().toISOString(), results };
  cached = { at: Date.now(), body };
  return Response.json(body);
}
