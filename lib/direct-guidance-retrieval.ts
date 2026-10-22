import { extractText, getDocumentProxy, getMeta } from "unpdf";
import { AUSTRALIAN_SOURCE_REGISTRY, adapterForUrl, type AustralianSourceAdapter } from "./australian-source-registry";

export type RetrievalIntent = {
  population: string;
  condition: string;
  clinical_scenario: string;
  decision: string;
  intervention_or_investigation: string;
  special_circumstances: string[];
  search_keywords: string[];
};

export type RetrievalContext = {
  nodeId: string | null;
  subtopic: string | null;
  domain: string;
  nodeName: string | null;
};

export type EvidenceDocument = {
  sourceId: string;
  issuingBody: string;
  title: string;
  url: string;
  documentDate: string | null;
  retrievalDate: string;
  authorityTier: number;
  sourceType: "html" | "pdf";
  text: string;
  lastModified: string | null;
};

type Candidate = { url: string; title: string; adapter: AustralianSourceAdapter; sourceType: "cache" | "search" | "index" | "sitemap"; score: number };

const TRACKING_PARAMS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]);
const MAX_DISCOVERY_BYTES = 2_000_000;
const MAX_HTML_BYTES = 2_500_000;
const MAX_PDF_BYTES = 10_000_000;
const MAX_DISCOVERY_ENDPOINTS_PER_PHASE = 4;
const MAX_DIRECT_CANDIDATES = 8;
const MAX_EVIDENCE_DOCUMENTS = 2;
// A registry index is an editor-reviewed discovery entry point, not evidence.
// Prefer it over previously-seen metadata so a noisy cache cannot crowd the
// registered guideline out of the bounded fetch set. The document still has
// to be fetched, parsed and adjudicated before it can pass the Evidence Gate.
const REGISTERED_INDEX_BONUS = 24;

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function decodeEntities(value: string) {
  return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function compact(value: string) { return decodeEntities(value).replace(/\s+/g, " ").trim(); }

export function canonicalAustralianUrl(value: string, expected?: AustralianSourceAdapter | null) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const adapter = adapterForUrl(url.toString());
    if (!adapter || (expected && adapter.id !== expected.id)) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

function keywordSet(intent: RetrievalIntent, context: RetrievalContext) {
  const values = [...intent.search_keywords, intent.condition, intent.decision, intent.intervention_or_investigation, context.subtopic ?? "", context.nodeName ?? ""];
  return [...new Set(values.flatMap((value) => String(value).toLowerCase().split(/[^a-z0-9]+/)).filter((word) => word.length >= 3))].slice(0, 24);
}

function urlScore(url: string, title: string, keywords: string[], tier: number) {
  const haystack = `${url} ${title}`.toLowerCase();
  const matches = keywords.reduce((count, word) => count + (haystack.includes(word) ? 1 : 0), 0);
  const guidance = /guideline|guidance|recommend|standard|clinical|protocol|handbook|statement|management|treatment/.test(haystack) ? 5 : 0;
  return (5 - tier) * 2 + matches * 3 + guidance;
}

function specialtyTerms(context: RetrievalContext, intent: RetrievalIntent) {
  const text = `${context.domain} ${context.nodeName ?? ""} ${context.subtopic ?? ""} ${intent.population} ${intent.condition}`.toLowerCase();
  const terms = new Set<string>([context.domain.toLowerCase()]);
  if (/child|paediatric|pediatric|infant|neonat|adolescent/.test(text)) terms.add("paediatrics");
  if (/pregnan|obstetric|gynaec|gynec|women|cervi|uter|ovari/.test(text)) terms.add("obstetrics and gynaecology");
  if (/mental|psychi|suicid|depress|psychosis|anxiety/.test(text)) terms.add("mental health");
  if (/cancer|tumou?r|oncolog|chemotherap/.test(text)) terms.add("oncology");
  if (/emergen|acute|unstable|resusc|trauma/.test(text)) terms.add("emergency medicine");
  if (/surg|operative|postoperative|preoperative/.test(text)) terms.add("surgery");
  if (/screen|prevent|vaccin|population|public health/.test(text)) terms.add("population health");
  if (/drug|dose|medicat|adverse|contraindicat/.test(text)) terms.add("pharmacology");
  return terms;
}

export function selectSourceAdapters(context: RetrievalContext, intent: RetrievalIntent) {
  const terms = specialtyTerms(context, intent);
  return AUSTRALIAN_SOURCE_REGISTRY.map((adapter) => {
    const relevance = adapter.specialties.reduce((score, specialty) => score + ([...terms].some((term) => specialty.includes(term) || term.includes(specialty)) ? 5 : 0), 0);
    const national = adapter.authorityTier === 1 ? 4 : 0;
    return { adapter, score: relevance + national };
  }).sort((a, b) => b.score - a.score || a.adapter.authorityTier - b.adapter.authorityTier || a.adapter.id.localeCompare(b.adapter.id))
    .slice(0, 6).map((row) => row.adapter);
}

async function boundedFetch(url: string, maxBytes: number, timeoutMs = 5000) {
  let current: string = canonicalAustralianUrl(url) ?? "";
  if (!current) return null;
  const timeout = withTimeout(timeoutMs);
  try {
    let response: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      response = await fetch(current, { redirect: "manual", signal: timeout.signal, headers: { accept: "text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.2", "user-agent": "AMC-Study-OS-GuidanceVerifier/1.0" } });
      if (response.status < 300 || response.status >= 400) break;
      const location: string | null = response.headers.get("location");
      const next: string | null = location ? canonicalAustralianUrl(new URL(location, current).toString()) : null;
      if (!next) return null;
      current = next;
      response = null;
    }
    if (!response) return null;
    if (!response.ok) return null;
    const finalUrl = canonicalAustralianUrl(response.url || current);
    if (!finalUrl) return null;
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > maxBytes) return null;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > maxBytes) return null;
    return { response, finalUrl, bytes };
  } catch {
    return null;
  } finally {
    timeout.clear();
  }
}

function htmlTitle(html: string, fallback: string) {
  const og = html.match(/<meta[^>]+(?:property|name)=["'](?:og:title|twitter:title)["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const title = og ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? fallback;
  return compact(title).slice(0, 320);
}

function htmlDate(html: string) {
  const candidates = [
    html.match(/<meta[^>]+(?:property|name)=["'](?:article:modified_time|article:published_time|dateModified|datePublished|dcterms\.modified|dcterms\.issued)["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/["'](?:dateModified|datePublished)["']\s*:\s*["']([^"']+)["']/i)?.[1],
    html.match(/(?:Updated|Last updated|Published)\s*(?:on)?\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]+\s+20\d{2}|20\d{2}-\d{2}-\d{2})/i)?.[1],
  ].filter(Boolean) as string[];
  return candidates[0]?.slice(0, 80) ?? null;
}

function htmlToText(html: string) {
  return decodeEntities(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ").replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(?:p|div|li|h[1-6]|section|article|tr|br)>/gi, "\n").replace(/<[^>]+>/g, " "))
    .split(/\n+/).map(compact).filter((line) => line.length > 25).join("\n");
}

function relevantExcerpt(text: string, keywords: string[], limit = 5200) {
  const chunks = text.split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map(compact).filter((line) => line.length >= 45 && line.length <= 1800);
  const ranked = chunks.map((line, index) => ({ line, index, score: keywords.reduce((n, word) => n + (line.toLowerCase().includes(word) ? 1 : 0), 0) + (/recommend|should|must|first.line|contraindicat|indicat|management|treatment|diagnos|screen/.test(line.toLowerCase()) ? 2 : 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const selected: string[] = [];
  let size = 0;
  for (const row of ranked) {
    if (row.score === 0 && selected.length >= 4) continue;
    if (selected.includes(row.line)) continue;
    if (size + row.line.length > limit) continue;
    selected.push(row.line); size += row.line.length;
    if (selected.length >= 14 || size >= limit - 300) break;
  }
  return selected.join("\n");
}

function linksFromHtml(html: string, base: string, adapter: AustralianSourceAdapter) {
  const rows: Array<{ url: string; title: string }> = [];
  const pattern = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      const url = canonicalAustralianUrl(new URL(match[1], base).toString(), adapter);
      if (!url || /\/search(?:[/?]|$)/i.test(new URL(url).pathname)) continue;
      rows.push({ url, title: compact(match[2].replace(/<[^>]+>/g, " ")).slice(0, 320) });
    } catch { /* malformed link */ }
  }
  return rows;
}

function locationsFromXml(xml: string) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => compact(match[1])).filter(Boolean);
}

async function readDiscoveryPage(url: string, adapter: AustralianSourceAdapter) {
  const fetched = await boundedFetch(url, MAX_DISCOVERY_BYTES, 6000);
  if (!fetched) return [];
  const type = fetched.response.headers.get("content-type")?.toLowerCase() ?? "";
  if (type.includes("pdf")) return [];
  return linksFromHtml(new TextDecoder().decode(fetched.bytes), fetched.finalUrl, adapter);
}

async function readSitemap(url: string, adapter: AustralianSourceAdapter, keywords: string[]) {
  const fetched = await boundedFetch(url, MAX_DISCOVERY_BYTES, 7000);
  if (!fetched) return [];
  const xml = new TextDecoder().decode(fetched.bytes);
  const locations = locationsFromXml(xml);
  const childMaps = locations.filter((location) => /\.xml(?:$|\?)/i.test(location)).sort((a, b) => urlScore(b, "", keywords, adapter.authorityTier) - urlScore(a, "", keywords, adapter.authorityTier)).slice(0, 2);
  const documents = locations.filter((location) => !/\.xml(?:$|\?)/i.test(location));
  for (const child of childMaps) {
    const nested = await boundedFetch(child, MAX_DISCOVERY_BYTES, 6000);
    if (nested) documents.push(...locationsFromXml(new TextDecoder().decode(nested.bytes)));
  }
  return documents.map((location) => canonicalAustralianUrl(location, adapter)).filter(Boolean).map((location) => ({ url: location!, title: "" }));
}

async function cachedCandidates(database: D1Database, context: RetrievalContext, adapters: AustralianSourceAdapter[], keywords: string[]) {
  const rows = await database.prepare(`SELECT canonical_url,title,issuing_body,authority_tier,source_type FROM guidance_source_metadata WHERE node_id=? AND subtopic=? ORDER BY last_seen_at DESC LIMIT 24`)
    .bind(context.nodeId, context.subtopic).all<any>();
  const allowed = new Set(adapters.map((adapter) => adapter.id));
  return rows.results.flatMap((row: any) => {
    const adapter = adapterForUrl(row.canonical_url);
    if (!adapter || !allowed.has(adapter.id)) return [];
    const url = canonicalAustralianUrl(row.canonical_url, adapter);
    return url ? [{ url, title: String(row.title ?? ""), adapter, sourceType: "cache" as const, score: urlScore(url, String(row.title ?? ""), keywords, adapter.authorityTier) + 2 }] : [];
  });
}

function mergeCandidates(rows: Candidate[]) {
  const byUrl = new Map<string, Candidate>();
  for (const row of rows) {
    const previous = byUrl.get(row.url);
    if (!previous || row.score > previous.score) byUrl.set(row.url, row);
  }
  return [...byUrl.values()].sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));
}

/**
 * Probe the registered sources before discovery.
 *
 * A single unreachable authority (a government site behind an unreachable route)
 * would otherwise consume the whole discovery budget and the round would return
 * "no evidence" even though another authority was reachable. The probes run in
 * parallel, so the cost is one timeout, not one per source.
 */
async function reachableAdapters(adapters: AustralianSourceAdapter[], timeoutMs = 5_000) {
  const probe = async (adapter: AustralianSourceAdapter) => {
    const search = adapter.search;
    const url = search.method !== "none"
      ? search.urlTemplate.replace("{query}", encodeURIComponent("guideline"))
      : adapter.indexUrls[0];
    if (!url) return null;
    const timeout = withTimeout(timeoutMs);
    try {
      const response = await fetch(url, { signal: timeout.signal, headers: { accept: "text/html", "user-agent": "AMC-Study-OS-GuidanceVerifier/1.0" } });
      return response.ok ? adapter : null;
    } catch {
      return null;
    } finally {
      timeout.clear();
    }
  };
  const settled = await Promise.all(adapters.map(probe));
  return settled.filter(Boolean) as AustralianSourceAdapter[];
}

async function discoverCandidates(database: D1Database, intent: RetrievalIntent, context: RetrievalContext, deadline = Number.POSITIVE_INFINITY, exclude: string[] = []) {
  const expired = () => Date.now() > deadline;
  const keywords = keywordSet(intent, context);
  const blocked = new Set(exclude);
  const selected = selectSourceAdapters(context, intent).filter((adapter) => !blocked.has(adapter.id));
  // Keep a small fallback so a failed probe list cannot disable retrieval entirely.
  const reachable = await reachableAdapters(selected);
  const adapters = reachable.length ? reachable : selected.slice(0, 2);
  const query = encodeURIComponent(intent.search_keywords.slice(0, 6).join(" ") || `${intent.condition} ${intent.decision}`);
  let rows: Candidate[] = await cachedCandidates(database, context, adapters, keywords);
  let endpointCount = 0;

  // Some authoritative bodies expose a stable guideline index but no site-search
  // endpoint. Always consult those registered indexes before generic site search,
  // otherwise noisy search results from another adapter can suppress them.
  for (const adapter of adapters.filter((row) => row.search.method === "none").slice(0, 2)) {
    if (expired()) break;
    for (const indexUrl of adapter.indexUrls.slice(0, MAX_DISCOVERY_ENDPOINTS_PER_PHASE)) {
      if (expired()) break;
      const registeredUrl = canonicalAustralianUrl(indexUrl, adapter);
      if (registeredUrl) rows.push({
        url: registeredUrl,
        title: "",
        adapter,
        sourceType: "index",
        score: urlScore(registeredUrl, "", keywords, adapter.authorityTier) + REGISTERED_INDEX_BONUS,
      });
    }

    // One bounded index crawl is enough for secondary links. Registered direct
    // documents above remain eligible even when this listing page is noisy.
    const listingUrl = adapter.indexUrls.find((url) => !/\/guideline-/i.test(new URL(url).pathname)) ?? adapter.indexUrls[0];
    if (listingUrl) {
      const links = await readDiscoveryPage(listingUrl, adapter);
      rows.push(...links.map((link) => ({ ...link, adapter, sourceType: "index" as const, score: urlScore(link.url, link.title, keywords, adapter.authorityTier) + 2 })));
    }
  }

  // Site searches run in parallel. Sequentially, four authoritative search
  // endpoints at a 6 s bound each could consume the whole discovery budget before a
  // single candidate existed; in parallel the phase costs one request's latency.
  const searchAdapters = adapters.filter((adapter) => adapter.search.method !== "none").slice(0, MAX_DISCOVERY_ENDPOINTS_PER_PHASE);
  if (searchAdapters.length) {
    const searchRows = await Promise.all(searchAdapters.map(async (adapter) => {
      if (expired()) return [] as Candidate[];
      const search = adapter.search;
      if (search.method === "none") return [] as Candidate[];
      const links = await readDiscoveryPage(search.urlTemplate.replace("{query}", query), adapter);
      return links.map((link) => ({ ...link, adapter, sourceType: "search" as const, score: urlScore(link.url, link.title, keywords, adapter.authorityTier) + 4 }));
    }));
    rows.push(...searchRows.flat());
    endpointCount += searchAdapters.length;
  }
  if (!expired() && mergeCandidates(rows).filter((row) => row.score >= 10).length < MAX_DIRECT_CANDIDATES) {
    endpointCount = 0;
    for (const adapter of adapters) {
      if (expired()) break;
      if (endpointCount >= MAX_DISCOVERY_ENDPOINTS_PER_PHASE) break;
      for (const indexUrl of adapter.indexUrls.slice(0, 1)) {
        if (endpointCount++ >= MAX_DISCOVERY_ENDPOINTS_PER_PHASE) break;
        const links = await readDiscoveryPage(indexUrl, adapter);
        rows.push(...links.map((link) => ({ ...link, adapter, sourceType: "index" as const, score: urlScore(link.url, link.title, keywords, adapter.authorityTier) + 2 })));
      }
    }
  }
  if (!expired() && mergeCandidates(rows).filter((row) => row.score >= 10).length < 4) {
    endpointCount = 0;
    for (const adapter of adapters.slice(0, 4)) {
      if (expired()) break;
      if (endpointCount >= MAX_DISCOVERY_ENDPOINTS_PER_PHASE) break;
      for (const sitemap of adapter.sitemapUrls.slice(0, 1)) {
        endpointCount++;
        const links = await readSitemap(sitemap, adapter, keywords);
        rows.push(...links.map((link) => ({ ...link, adapter, sourceType: "sitemap" as const, score: urlScore(link.url, link.title, keywords, adapter.authorityTier) })));
      }
    }
  }
  return { candidates: mergeCandidates(rows).filter((row) => row.score >= 10).slice(0, MAX_DIRECT_CANDIDATES), keywords };
}

async function fetchEvidenceDocument(candidate: Candidate, keywords: string[], index: number): Promise<EvidenceDocument | null> {
  const expectedPdf = /\.pdf(?:$|\?)/i.test(candidate.url);
  const fetched = await boundedFetch(candidate.url, expectedPdf ? MAX_PDF_BYTES : MAX_HTML_BYTES, 9000);
  if (!fetched) return null;
  const adapter = adapterForUrl(fetched.finalUrl);
  if (!adapter || adapter.id !== candidate.adapter.id) return null;
  const contentType = fetched.response.headers.get("content-type")?.toLowerCase() ?? "";
  const isPdf = contentType.includes("application/pdf") || expectedPdf;
  let title = candidate.title || fetched.finalUrl;
  let documentDate: string | null = null;
  let text = "";
  if (isPdf) {
    if (!adapter.allowedDocumentTypes.includes("pdf")) return null;
    try {
      const pdf = await getDocumentProxy(new Uint8Array(fetched.bytes));
      if (pdf.numPages > 120) return null;
      const [content, metadata] = await Promise.all([extractText(pdf, { mergePages: true }), getMeta(pdf, { parseDates: false })]);
      text = String(content.text ?? "");
      title = compact(String(metadata.info?.Title ?? title));
      documentDate = String(metadata.info?.ModDate ?? metadata.info?.CreationDate ?? "").slice(0, 80) || null;
    } catch { return null; }
  } else {
    if (!adapter.allowedDocumentTypes.includes("html")) return null;
    const html = new TextDecoder().decode(fetched.bytes);
    title = htmlTitle(html, title);
    documentDate = htmlDate(html);
    text = htmlToText(html);
  }
  const excerpt = relevantExcerpt(text, keywords);
  if (excerpt.length < 350) return null;
  return {
    sourceId: `source-${index + 1}`, issuingBody: adapter.issuingBody, title, url: fetched.finalUrl,
    documentDate, retrievalDate: new Date().toISOString(), authorityTier: adapter.authorityTier,
    sourceType: isPdf ? "pdf" : "html", text: excerpt, lastModified: fetched.response.headers.get("last-modified"),
  };
}

export async function retrieveAustralianEvidence(
  database: D1Database,
  intent: RetrievalIntent,
  context: RetrievalContext,
  options: { budgetMs?: number; excludeAdapters?: string[] } = {},
) {
  // Bounded by wall clock, not just by counts: a slow or unresponsive source must
  // not be able to consume the whole request. The online read path always passes a
  // budget so the round stays inside the gateway timeout.
  const deadline = options.budgetMs ? Date.now() + options.budgetMs : Number.POSITIVE_INFINITY;
  const { candidates, keywords } = await discoverCandidates(database, intent, context, deadline, options.excludeAdapters ?? []);
  const documents: EvidenceDocument[] = [];
  for (const candidate of candidates) {
    if (Date.now() > deadline) break;
    const document = await fetchEvidenceDocument(candidate, keywords, documents.length);
    if (document) documents.push(document);
    if (documents.length >= MAX_EVIDENCE_DOCUMENTS) break;
  }
  return { documents, candidatesExamined: candidates.length, selectedAdapters: selectSourceAdapters(context, intent).map((adapter) => adapter.id) };
}
