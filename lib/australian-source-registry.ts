export type AuthorityTier = 1 | 2 | 3 | 4;
export type SourceSearch =
  | { method: "html-query"; urlTemplate: string }
  | { method: "none" };

export type AustralianSourceAdapter = {
  id: string;
  issuingBody: string;
  canonicalDomain: string;
  domains: string[];
  authorityTier: AuthorityTier;
  specialties: string[];
  search: SourceSearch;
  indexUrls: string[];
  sitemapUrls: string[];
  allowedDocumentTypes: Array<"html" | "pdf">;
  dateExtraction: "jsonld-meta-visible";
  canonicalUrlRule: "https-strip-fragment-tracking";
};

// This registry contains discovery entry points only. A registered URL is not
// evidence until the Worker has fetched the final document successfully.
export const AUSTRALIAN_SOURCE_REGISTRY: AustralianSourceAdapter[] = [
  {
    id: "australian-health-government", issuingBody: "Australian Government Department of Health, Disability and Ageing",
    canonicalDomain: "health.gov.au", domains: ["health.gov.au", "www.health.gov.au", "immunisationhandbook.health.gov.au"], authorityTier: 1,
    specialties: ["medicine", "surgery", "obstetrics and gynaecology", "paediatrics", "mental health", "population health", "emergency medicine", "infectious diseases", "immunisation"],
    search: { method: "html-query", urlTemplate: "https://www.health.gov.au/search?search_api_fulltext={query}" },
    indexUrls: ["https://www.health.gov.au/topics", "https://immunisationhandbook.health.gov.au/contents"],
    sitemapUrls: ["https://www.health.gov.au/sitemap.xml", "https://immunisationhandbook.health.gov.au/sitemap.xml"],
    allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "nhmrc", issuingBody: "National Health and Medical Research Council", canonicalDomain: "nhmrc.gov.au", domains: ["nhmrc.gov.au", "www.nhmrc.gov.au"], authorityTier: 1,
    specialties: ["medicine", "surgery", "paediatrics", "obstetrics and gynaecology", "mental health", "population health"], search: { method: "html-query", urlTemplate: "https://www.nhmrc.gov.au/search?search={query}" },
    indexUrls: ["https://www.nhmrc.gov.au/health-advice/guidelines"], sitemapUrls: ["https://www.nhmrc.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "safety-quality", issuingBody: "Australian Commission on Safety and Quality in Health Care", canonicalDomain: "safetyandquality.gov.au", domains: ["safetyandquality.gov.au", "www.safetyandquality.gov.au"], authorityTier: 1,
    specialties: ["medicine", "surgery", "emergency medicine", "paediatrics", "mental health", "population health"], search: { method: "html-query", urlTemplate: "https://www.safetyandquality.gov.au/search?search={query}" },
    indexUrls: ["https://www.safetyandquality.gov.au/standards", "https://www.safetyandquality.gov.au/our-work/clinical-care-standards"], sitemapUrls: ["https://www.safetyandquality.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "cancer-australia", issuingBody: "Cancer Australia", canonicalDomain: "canceraustralia.gov.au", domains: ["canceraustralia.gov.au", "www.canceraustralia.gov.au"], authorityTier: 1,
    specialties: ["medicine", "surgery", "oncology", "obstetrics and gynaecology", "population health"], search: { method: "html-query", urlTemplate: "https://www.canceraustralia.gov.au/search?search={query}" },
    indexUrls: ["https://www.canceraustralia.gov.au/clinical-best-practice"], sitemapUrls: ["https://www.canceraustralia.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "tga", issuingBody: "Therapeutic Goods Administration", canonicalDomain: "tga.gov.au", domains: ["tga.gov.au", "www.tga.gov.au"], authorityTier: 1,
    specialties: ["medicine", "surgery", "paediatrics", "obstetrics and gynaecology", "mental health", "pharmacology"], search: { method: "html-query", urlTemplate: "https://www.tga.gov.au/search?keywords={query}" },
    indexUrls: ["https://www.tga.gov.au/safety"], sitemapUrls: ["https://www.tga.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "racgp", issuingBody: "Royal Australian College of General Practitioners", canonicalDomain: "racgp.org.au", domains: ["racgp.org.au", "www.racgp.org.au"], authorityTier: 2,
    specialties: ["general practice", "medicine", "paediatrics", "obstetrics and gynaecology", "mental health", "population health"], search: { method: "html-query", urlTemplate: "https://www.racgp.org.au/search?search={query}" },
    indexUrls: ["https://www.racgp.org.au/clinical-resources/clinical-guidelines"], sitemapUrls: ["https://www.racgp.org.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "racp", issuingBody: "Royal Australasian College of Physicians", canonicalDomain: "racp.edu.au", domains: ["racp.edu.au", "www.racp.edu.au"], authorityTier: 2,
    specialties: ["medicine", "paediatrics", "public health", "rehabilitation", "occupational medicine"], search: { method: "html-query", urlTemplate: "https://www.racp.edu.au/search-results?query={query}" },
    indexUrls: ["https://www.racp.edu.au/policy-and-advocacy/policy-and-advocacy-priorities"], sitemapUrls: ["https://www.racp.edu.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "racs", issuingBody: "Royal Australasian College of Surgeons", canonicalDomain: "surgeons.org", domains: ["surgeons.org", "www.surgeons.org"], authorityTier: 2,
    specialties: ["surgery", "emergency medicine"], search: { method: "html-query", urlTemplate: "https://www.surgeons.org/search?query={query}" },
    indexUrls: ["https://www.surgeons.org/Resources"], sitemapUrls: ["https://www.surgeons.org/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "acem", issuingBody: "Australasian College for Emergency Medicine", canonicalDomain: "acem.org.au", domains: ["acem.org.au", "www.acem.org.au"], authorityTier: 2,
    specialties: ["emergency medicine", "medicine", "surgery", "paediatrics", "mental health"], search: { method: "html-query", urlTemplate: "https://acem.org.au/Search-Results?search={query}" },
    indexUrls: ["https://acem.org.au/Content-Sources/Advancing-Emergency-Medicine/Clinical-Guidelines"], sitemapUrls: ["https://acem.org.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "ranzcog", issuingBody: "Royal Australian and New Zealand College of Obstetricians and Gynaecologists", canonicalDomain: "ranzcog.edu.au", domains: ["ranzcog.edu.au", "www.ranzcog.edu.au"], authorityTier: 2,
    specialties: ["obstetrics and gynaecology", "women's health", "pregnancy"], search: { method: "html-query", urlTemplate: "https://ranzcog.edu.au/search/?q={query}" },
    indexUrls: ["https://ranzcog.edu.au/resources/statements-and-guidelines/"], sitemapUrls: ["https://ranzcog.edu.au/sitemap_index.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "ranzcp", issuingBody: "Royal Australian and New Zealand College of Psychiatrists", canonicalDomain: "ranzcp.org", domains: ["ranzcp.org", "www.ranzcp.org"], authorityTier: 2,
    specialties: ["mental health", "psychiatry", "medicine", "paediatrics"], search: { method: "html-query", urlTemplate: "https://www.ranzcp.org/search?query={query}" },
    indexUrls: ["https://www.ranzcp.org/clinical-guidelines-publications"], sitemapUrls: ["https://www.ranzcp.org/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "heart-foundation", issuingBody: "National Heart Foundation of Australia", canonicalDomain: "heartfoundation.org.au", domains: ["heartfoundation.org.au", "www.heartfoundation.org.au"], authorityTier: 2,
    specialties: ["medicine", "cardiology", "emergency medicine", "population health"], search: { method: "html-query", urlTemplate: "https://www.heartfoundation.org.au/search?query={query}" },
    indexUrls: ["https://www.heartfoundation.org.au/for-professionals/clinical-information"], sitemapUrls: ["https://www.heartfoundation.org.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "anzcor", issuingBody: "Australian and New Zealand Committee on Resuscitation", canonicalDomain: "anzcor.org", domains: ["anzcor.org", "www.anzcor.org"], authorityTier: 2,
    specialties: ["medicine", "cardiology", "emergency medicine", "paediatrics", "resuscitation"], search: { method: "none" },
    indexUrls: [
      "https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-9-managing-acute-dysrhythmias",
      "https://www.anzcor.org/home/paediatric-advanced-life-support/guideline-12-2-paediatric-advanced-life-support-pals-2",
      "https://www.anzcor.org/home/adult-advanced-life-support",
      "https://www.anzcor.org/home/paediatric-advanced-life-support",
    ], sitemapUrls: ["https://www.anzcor.org/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "australian-prescriber", issuingBody: "Australian Prescriber", canonicalDomain: "australianprescriber.tg.org.au", domains: ["australianprescriber.tg.org.au"], authorityTier: 4,
    specialties: ["medicine", "surgery", "paediatrics", "obstetrics and gynaecology", "mental health", "pharmacology"], search: { method: "html-query", urlTemplate: "https://australianprescriber.tg.org.au/search.html?q={query}" },
    indexUrls: ["https://australianprescriber.tg.org.au/articles.html"], sitemapUrls: ["https://australianprescriber.tg.org.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "nsw-health", issuingBody: "NSW Health", canonicalDomain: "health.nsw.gov.au", domains: ["health.nsw.gov.au", "www.health.nsw.gov.au"], authorityTier: 3,
    specialties: ["medicine", "surgery", "emergency medicine", "paediatrics", "obstetrics and gynaecology", "mental health", "population health"], search: { method: "html-query", urlTemplate: "https://www.health.nsw.gov.au/search/Pages/results.aspx?k={query}" },
    indexUrls: ["https://www.health.nsw.gov.au/policies/pages/default.aspx"], sitemapUrls: ["https://www.health.nsw.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "queensland-health", issuingBody: "Queensland Health", canonicalDomain: "health.qld.gov.au", domains: ["health.qld.gov.au", "www.health.qld.gov.au", "clinicalexcellence.qld.gov.au"], authorityTier: 3,
    specialties: ["medicine", "surgery", "emergency medicine", "paediatrics", "obstetrics and gynaecology", "mental health", "population health"], search: { method: "html-query", urlTemplate: "https://www.health.qld.gov.au/search?search={query}" },
    indexUrls: ["https://www.health.qld.gov.au/clinical-practice/guidelines-procedures"], sitemapUrls: ["https://www.health.qld.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "sa-health", issuingBody: "SA Health", canonicalDomain: "sahealth.sa.gov.au", domains: ["sahealth.sa.gov.au", "www.sahealth.sa.gov.au"], authorityTier: 3,
    specialties: ["medicine", "surgery", "emergency medicine", "paediatrics", "obstetrics and gynaecology", "mental health", "population health"], search: { method: "html-query", urlTemplate: "https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/search?query={query}" },
    indexUrls: ["https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/clinical+resources"], sitemapUrls: ["https://www.sahealth.sa.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "wa-health", issuingBody: "Government of Western Australia Department of Health", canonicalDomain: "health.wa.gov.au", domains: ["health.wa.gov.au", "www.health.wa.gov.au", "pch.health.wa.gov.au"], authorityTier: 3,
    specialties: ["medicine", "surgery", "emergency medicine", "paediatrics", "obstetrics and gynaecology", "mental health", "population health"], search: { method: "html-query", urlTemplate: "https://www.health.wa.gov.au/Search?query={query}" },
    indexUrls: ["https://www.health.wa.gov.au/Articles/A_E/Clinical-guidelines"], sitemapUrls: ["https://www.health.wa.gov.au/sitemap.xml", "https://pch.health.wa.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "victoria-health", issuingBody: "Victorian Department of Health", canonicalDomain: "health.vic.gov.au", domains: ["health.vic.gov.au", "www.health.vic.gov.au"], authorityTier: 3,
    specialties: ["medicine", "surgery", "emergency medicine", "paediatrics", "obstetrics and gynaecology", "mental health", "population health"], search: { method: "html-query", urlTemplate: "https://www.health.vic.gov.au/search?query={query}" },
    indexUrls: ["https://www.health.vic.gov.au/clinical-guidance-and-resources"], sitemapUrls: ["https://www.health.vic.gov.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "rch", issuingBody: "Royal Children's Hospital Melbourne", canonicalDomain: "rch.org.au", domains: ["rch.org.au", "www.rch.org.au"], authorityTier: 3,
    specialties: ["paediatrics", "emergency medicine", "medicine", "surgery"], search: { method: "html-query", urlTemplate: "https://www.rch.org.au/search/?q={query}" },
    indexUrls: ["https://www.rch.org.au/clinicalguide/guideline_index/"], sitemapUrls: ["https://www.rch.org.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
  {
    id: "eviq", issuingBody: "eviQ Cancer Treatments Online (Cancer Institute NSW)", canonicalDomain: "eviq.org.au", domains: ["eviq.org.au", "www.eviq.org.au"], authorityTier: 3,
    specialties: ["oncology", "medicine", "surgery", "paediatrics"], search: { method: "html-query", urlTemplate: "https://www.eviq.org.au/search?searchtext={query}" },
    indexUrls: ["https://www.eviq.org.au/"], sitemapUrls: ["https://www.eviq.org.au/sitemap.xml"], allowedDocumentTypes: ["html", "pdf"], dateExtraction: "jsonld-meta-visible", canonicalUrlRule: "https-strip-fragment-tracking",
  },
];

export function adapterForUrl(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return AUSTRALIAN_SOURCE_REGISTRY.find((adapter) => adapter.domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) ?? null;
  } catch {
    return null;
  }
}
