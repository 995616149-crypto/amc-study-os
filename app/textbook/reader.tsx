"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, BookOpen, ChevronRight, LoaderCircle, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { TextbookBlocks as Blocks, type TextbookBlock as Block } from "./blocks";

/* ------------------------------------------------------------------ */
/* types                                                              */
/* ------------------------------------------------------------------ */

type TocChapter = {
  chapter_id: string;
  chapter_order: number;
  chapter_number: number | null;
  chapter_title: string;
  start_page: number | null;
  end_page: number | null;
  printed_page_start: number | null;
  section_count: number;
  block_count: number;
  is_matter: boolean;
};
type TocPart = { part_id: string; part_order: number; part_title: string; chapters: TocChapter[] };
type Toc = {
  book: { book_id: string; title: string; edition: string | null; language: string | null };
  counts: { parts: number; chapters: number; sections: number; blocks: number; searchable_sections: number };
  parts: TocPart[];
  matter: TocChapter[];
};
type SectionSummary = {
  section_uid: string;
  section_id: string;
  section_order: number;
  section_title: string;
  heading_level: number | null;
  start_page: number | null;
  end_page: number | null;
  printed_page_start: number | null;
  block_count: number;
  visible_block_count: number;
};
type Neighbour = { section_uid: string; section_title: string; chapter_title: string } | null;
type SectionPayload = {
  book: { title: string; edition: string | null } | null;
  part: { part_id: string; part_title: string; part_order: number } | null;
  chapter: { chapter_id: string; chapter_title: string; chapter_number: number | null } | null;
  section: {
    section_uid: string;
    section_id: string;
    section_title: string;
    start_page: number | null;
    end_page: number | null;
    printed_page_start: number | null;
    block_count: number;
    visible_block_count: number;
  };
  blocks: Block[];
  navigation: { previous: Neighbour; next: Neighbour };
  counts: { source_blocks: number; returned_blocks: number };
};
type SearchHit = {
  section_uid: string;
  section_id: string;
  chapter_title: string | null;
  section_title: string | null;
  page_start: number | null;
  page_end: number | null;
  snippet: string;
  score: number;
};

const POSITION_KEY = "amc-study-os.textbook-position.v1";
const EXPANDED_KEY = "amc-study-os.textbook-expanded.v1";

function sectionHref(uid: string) {
  return `/textbook/section/${encodeURIComponent(uid)}`;
}
function chapterHref(id: string) {
  return `/textbook/chapter/${encodeURIComponent(id)}`;
}
function pageRange(start: number | null, end: number | null) {
  if (!start) return "页码范围未标注";
  if (end && end !== start) return `pp.${start}–${end}`;
  return `p.${start}`;
}
function readPosition(): string | null {
  try {
    return window.localStorage.getItem(POSITION_KEY);
  } catch {
    return null;
  }
}
function writePosition(uid: string) {
  try {
    window.localStorage.setItem(POSITION_KEY, uid);
  } catch {
    /* private mode: reading position is a convenience, never a requirement */
  }
}
function readExpanded(): string[] {
  try {
    const raw = window.localStorage.getItem(EXPANDED_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}
function writeExpanded(keys: string[]) {
  try {
    window.localStorage.setItem(EXPANDED_KEY, JSON.stringify(keys.slice(0, 400)));
  } catch {
    /* ignore */
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body?.error || `HTTP ${response.status}`);
  return body;
}

/* ------------------------------------------------------------------ */
/* the reader                                                         */
/* ------------------------------------------------------------------ */

export default function TextbookReader({
  initialSectionUid = null,
  initialChapterId = null,
}: {
  initialSectionUid?: string | null;
  initialChapterId?: string | null;
}) {
  const [toc, setToc] = useState<Toc | null>(null);
  const [tocError, setTocError] = useState("");
  const [sections, setSections] = useState<Record<string, SectionSummary[]>>({});
  const [expandedParts, setExpandedParts] = useState<string[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);

  const [uid, setUid] = useState<string | null>(initialSectionUid);
  const [chapterId, setChapterId] = useState<string | null>(initialChapterId);
  const [payload, setPayload] = useState<SectionPayload | null>(null);
  const [chapterPayload, setChapterPayload] = useState<any>(null);
  const [contentError, setContentError] = useState("");
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [lastRead, setLastRead] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const initialDone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getJson<Toc>("/api/textbook/toc")
      .then((body) => {
        if (!cancelled) setToc(body);
      })
      .catch((error: Error) => {
        if (!cancelled) setTocError(error.message || "教材目录暂时不可用。");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stored = readExpanded();
    setExpandedParts(stored.filter((key) => key.startsWith("part:")));
    setExpandedChapters(stored.filter((key) => key.startsWith("chapter:")));
    setLastRead(readPosition());
  }, []);

  const openSection = useCallback(async (nextUid: string, push = true) => {
    setLoading(true);
    setContentError("");
    setChapterId(null);
    setChapterPayload(null);
    try {
      const body = await getJson<SectionPayload>(`/api/textbook/section?id=${encodeURIComponent(nextUid)}`);
      setPayload(body);
      setUid(body.section.section_uid);
      writePosition(body.section.section_uid);
      setLastRead(body.section.section_uid);
      if (push) window.history.pushState({ section: body.section.section_uid }, "", sectionHref(body.section.section_uid));
    } catch (error) {
      setContentError((error as Error).message || "教材正文暂时不可用。");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => contentRef.current?.scrollTo({ top: 0, behavior: "auto" }));
    }
  }, []);

  const openChapter = useCallback(async (id: string, push = true) => {
    setLoading(true);
    setContentError("");
    setPayload(null);
    try {
      const body = await getJson<any>(`/api/textbook/chapter?id=${encodeURIComponent(id)}&from=0&limit=3`);
      setChapterPayload(body);
      setChapterId(id);
      setUid(null);
      if (push) window.history.pushState({ chapter: id }, "", chapterHref(id));
    } catch (error) {
      setContentError((error as Error).message || "教材章节暂时不可用。");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => contentRef.current?.scrollTo({ top: 0, behavior: "auto" }));
    }
  }, []);

  // Deep link on first paint: a refresh (or a shared URL) must land on the same unit.
  useEffect(() => {
    if (initialDone.current) return;
    initialDone.current = true;
    if (initialSectionUid) void openSection(initialSectionUid, false);
    else if (initialChapterId) void openChapter(initialChapterId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onPop() {
      const match = window.location.pathname.match(/^\/textbook\/(section|chapter)\/(.+)$/);
      if (!match) {
        setUid(null);
        setChapterId(null);
        setPayload(null);
        setChapterPayload(null);
        return;
      }
      const value = decodeURIComponent(match[2]);
      if (match[1] === "section") void openSection(value, false);
      else void openChapter(value, false);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openSection, openChapter]);

  const runSearch = useCallback(async (value: string) => {
    const term = value.trim();
    if (!term) {
      setHits(null);
      setSearchError("");
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const body = await getJson<{ hits: SearchHit[] }>(`/api/textbook/search?q=${encodeURIComponent(term)}&limit=25`);
      setHits(body.hits ?? []);
    } catch (error) {
      setSearchError((error as Error).message || "教材检索暂时不可用。");
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const togglePart = useCallback(
    (partId: string) => {
      setExpandedParts((current) => {
        const next = current.includes(partId) ? current.filter((key) => key !== partId) : [...current, partId];
        writeExpanded([...next, ...expandedChapters]);
        return next;
      });
    },
    [expandedChapters],
  );

  const toggleChapter = useCallback(
    async (id: string) => {
      const willExpand = !expandedChapters.includes(id);
      setExpandedChapters((current) => {
        const next = willExpand ? [...current, id] : current.filter((key) => key !== id);
        writeExpanded([...expandedParts, ...next]);
        return next;
      });
      if (!willExpand || sections[id]) return;
      try {
        const body = await getJson<{ sections: SectionSummary[] }>(`/api/textbook/sections?chapter=${encodeURIComponent(id)}`);
        setSections((current) => ({ ...current, [id]: body.sections ?? [] }));
      } catch {
        setSections((current) => ({ ...current, [id]: [] }));
      }
    },
    [expandedChapters, expandedParts, sections],
  );

  const chapterHandlers = {
    expandedChapters,
    sections,
    activeUid: uid,
    activeChapter: chapterId,
    onToggleChapter: toggleChapter,
    onOpenSection: (value: string) => {
      setDrawerOpen(false);
      void openSection(value);
    },
    onOpenChapter: (value: string) => {
      setDrawerOpen(false);
      void openChapter(value);
    },
  };

  const title = toc?.book.title ?? "Murtagh's General Practice";
  const edition = toc?.book.edition ?? "9th Edition";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Activity size={19} />
          </span>
          <div>
            <b>AMC Study OS</b>
            <small>Evidence-gated Learning Engine</small>
          </div>
        </div>
        <div className="top-status">
          <span className="tb-book-label">Murtagh 9e · {edition}</span>
        </div>
      </header>

      <div className="workspace">
        <nav className="nav tb-nav" aria-label="AMC Study OS navigation">
          <a href="/?tab=practice">
            <BookOpen size={16} />
            题库
          </a>
          <a href="/textbook" className="active" aria-current="page">
            <BookOpen size={16} />
            教科书
          </a>
          <a href="/?tab=question-map">题目总览</a>
          <a href="/?tab=review">复习</a>
          <a href="/?tab=notes">笔记</a>
          <a href="/?tab=library">资料库</a>
        </nav>

        <div className="tb-layout">
          <aside className={cn("tb-toc", drawerOpen && "open")} aria-label="教材目录">
            <div className="tb-toc-head">
              <div>
                <h2>{title}</h2>
                <p>
                  {edition}
                  {toc ? ` · ${toc.counts.parts} 部分 / ${toc.counts.chapters} 章 / ${toc.counts.sections} 节` : " · 正在载入目录…"}
                </p>
              </div>
              <button type="button" className="tb-toc-close" onClick={() => setDrawerOpen(false)} aria-label="关闭目录">
                ×
              </button>
            </div>

            {lastRead ? (
              <button type="button" className="tb-resume" onClick={() => void openSection(lastRead)}>
                继续阅读上次位置
                <ChevronRight size={14} />
              </button>
            ) : null}

            {tocError ? <p className="tb-error">{tocError}</p> : null}
            {!toc && !tocError ? (
              <p className="tb-loading">
                <LoaderCircle size={14} /> 正在载入目录…
              </p>
            ) : null}

            {toc ? (
              <ul className="tb-parts">
                {toc.parts.map((part) => (
                  <li key={part.part_id}>
                    <button type="button" className="tb-part" aria-expanded={expandedParts.includes(part.part_id)} onClick={() => togglePart(part.part_id)}>
                      <ChevronRight size={14} className={cn("tb-chevron", expandedParts.includes(part.part_id) && "open")} />
                      <span>
                        Part {part.part_order} · {part.part_title}
                      </span>
                    </button>
                    {expandedParts.includes(part.part_id) ? <ChapterList chapters={part.chapters} {...chapterHandlers} /> : null}
                  </li>
                ))}
                {toc.matter.length ? (
                  <li>
                    <button
                      type="button"
                      className="tb-part"
                      aria-expanded={expandedParts.includes("part:__matter__")}
                      onClick={() => togglePart("part:__matter__")}
                    >
                      <ChevronRight size={14} className={cn("tb-chevron", expandedParts.includes("part:__matter__") && "open")} />
                      <span>前置与后置材料</span>
                    </button>
                    {expandedParts.includes("part:__matter__") ? <ChapterList chapters={toc.matter} {...chapterHandlers} /> : null}
                  </li>
                ) : null}
              </ul>
            ) : null}
          </aside>

          <section className="tb-content" ref={contentRef}>
            <div className="tb-toolbar">
              <button type="button" className="tb-drawer-toggle" onClick={() => setDrawerOpen((value) => !value)}>
                目录
              </button>
              <form
                className="tb-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  void runSearch(query);
                }}
                role="search"
              >
                <Search size={15} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索教材：症状、疾病、治疗、短语…" aria-label="搜索教材" />
                <button type="submit" disabled={searching}>
                  {searching ? "检索中…" : "搜索"}
                </button>
              </form>
            </div>

            {hits !== null ? (
              <section className="tb-results" aria-label="教材检索结果">
                <div className="tb-results-head">
                  <b>检索结果 · {hits.length} 条</b>
                  <button
                    type="button"
                    onClick={() => {
                      setHits(null);
                      setQuery("");
                    }}
                  >
                    关闭结果
                  </button>
                </div>
                <p className="tb-note">搜索结果只是定位线索；点击任意一条会打开该小节的完整原文。</p>
                {searchError ? <p className="tb-error">{searchError}</p> : null}
                {hits.length ? (
                  <ul>
                    {hits.map((hit) => (
                      <li key={`${hit.section_uid}-${hit.section_id}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setHits(null);
                            setDrawerOpen(false);
                            void openSection(hit.section_uid);
                          }}
                        >
                          <span className="tb-hit-loc">{[hit.chapter_title, hit.section_title].filter(Boolean).join(" › ")}</span>
                          <span className="tb-hit-page">{pageRange(hit.page_start, hit.page_end)}</span>
                          {hit.snippet ? <span className="tb-hit-snippet">{hit.snippet}</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tb-note">没有匹配的小节。</p>
                )}
              </section>
            ) : null}

            {loading ? (
              <p className="tb-loading">
                <LoaderCircle size={14} /> 正在载入教材正文…
              </p>
            ) : null}
            {contentError ? <p className="tb-error">{contentError}</p> : null}

            {!loading && payload ? (
              <article className="tb-article">
                <nav className="tb-breadcrumb" aria-label="位置">
                  {payload.part ? (
                    <span>
                      Part {payload.part.part_order} · {payload.part.part_title}
                    </span>
                  ) : (
                    <span>前置 / 后置材料</span>
                  )}
                  <ChevronRight size={12} />
                  {payload.chapter ? (
                    <button type="button" onClick={() => payload.chapter && void openChapter(payload.chapter.chapter_id)}>
                      {payload.chapter.chapter_number ? `Chapter ${payload.chapter.chapter_number} · ` : ""}
                      {payload.chapter.chapter_title}
                    </button>
                  ) : null}
                </nav>
                <h1>{payload.section.section_title || "（无标题小节）"}</h1>
                <p className="tb-meta">
                  {pageRange(payload.section.start_page, payload.section.end_page)}
                  {payload.section.printed_page_start ? ` · 原书页码 p.${payload.section.printed_page_start}` : ""}
                  {` · ${payload.section.block_count} 个块`}
                </p>

                <Blocks blocks={payload.blocks} />

                {payload.counts.returned_blocks !== payload.counts.source_blocks ? (
                  <p className="tb-error">
                    正文不完整：本节共 {payload.counts.source_blocks} 个块，仅返回 {payload.counts.returned_blocks} 个。
                  </p>
                ) : null}

                <nav className="tb-pager" aria-label="连续阅读">
                  {payload.navigation.previous ? (
                    <button type="button" onClick={() => void openSection(payload.navigation.previous!.section_uid)}>
                      <ArrowLeft size={15} />
                      <span>
                        <small>上一节 · {payload.navigation.previous.chapter_title}</small>
                        <b>{payload.navigation.previous.section_title}</b>
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}
                  {payload.navigation.next ? (
                    <button type="button" className="next" onClick={() => void openSection(payload.navigation.next!.section_uid)}>
                      <span>
                        <small>下一节 · {payload.navigation.next.chapter_title}</small>
                        <b>{payload.navigation.next.section_title}</b>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  ) : null}
                </nav>
              </article>
            ) : null}

            {!loading && chapterPayload ? (
              <article className="tb-article">
                <nav className="tb-breadcrumb" aria-label="位置">
                  <span>连续阅读</span>
                  <ChevronRight size={12} />
                  <span>{chapterPayload.chapter.is_matter ? "前置 / 后置材料" : "章节"}</span>
                </nav>
                <h1>
                  {chapterPayload.chapter.chapter_number ? `Chapter ${chapterPayload.chapter.chapter_number} · ` : ""}
                  {chapterPayload.chapter.chapter_title}
                </h1>
                <p className="tb-meta">
                  {pageRange(chapterPayload.chapter.start_page, chapterPayload.chapter.end_page)}
                  {` · 共 ${chapterPayload.window.section_count} 节`}
                </p>
                <ChapterWindows chapterId={chapterPayload.chapter.chapter_id} initial={chapterPayload} onOpenSection={openSection} />
              </article>
            ) : null}

            {!loading && !payload && !chapterPayload && !contentError ? (
              <section className="tb-welcome">
                <h1>{title}</h1>
                <p className="tb-meta">{edition}</p>
                <p className="tb-note">
                  这是与题库并列的第二条学习路径：可以从左侧目录按 Part → Chapter → Section 连续阅读整本教材，也可以用上方搜索直接定位。
                </p>
                {toc ? (
                  <ul className="tb-welcome-stats">
                    <li>
                      <b>{toc.counts.parts}</b>
                      <span>Part</span>
                    </li>
                    <li>
                      <b>{toc.counts.chapters}</b>
                      <span>Chapter</span>
                    </li>
                    <li>
                      <b>{toc.counts.sections}</b>
                      <span>Section</span>
                    </li>
                    <li>
                      <b>{toc.counts.blocks}</b>
                      <span>结构化段落块</span>
                    </li>
                  </ul>
                ) : null}
                {lastRead ? (
                  <button type="button" className="tb-resume big" onClick={() => void openSection(lastRead)}>
                    继续阅读上次位置
                    <ChevronRight size={14} />
                  </button>
                ) : null}
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function ChapterList({
  chapters,
  expandedChapters,
  sections,
  activeUid,
  activeChapter,
  onToggleChapter,
  onOpenSection,
  onOpenChapter,
}: {
  chapters: TocChapter[];
  expandedChapters: string[];
  sections: Record<string, SectionSummary[]>;
  activeUid: string | null;
  activeChapter: string | null;
  onToggleChapter: (id: string) => Promise<void> | void;
  onOpenSection: (uid: string) => void;
  onOpenChapter: (id: string) => void;
}) {
  return (
    <ul className="tb-chapters">
      {chapters.map((chapter) => {
        const expanded = expandedChapters.includes(chapter.chapter_id);
        return (
          <li key={chapter.chapter_id}>
            <div className={cn("tb-chapter", activeChapter === chapter.chapter_id && "active")}>
              <button type="button" className="tb-chapter-expand" aria-expanded={expanded} onClick={() => void onToggleChapter(chapter.chapter_id)}>
                <ChevronRight size={13} className={cn("tb-chevron", expanded && "open")} />
              </button>
              <button type="button" className="tb-chapter-title" onClick={() => onOpenChapter(chapter.chapter_id)}>
                {chapter.chapter_number ? `${chapter.chapter_number}. ` : ""}
                {chapter.chapter_title}
                <small>{chapter.section_count} 节</small>
              </button>
            </div>
            {expanded ? (
              sections[chapter.chapter_id] ? (
                <ul className="tb-sections">
                  {sections[chapter.chapter_id].map((section) => (
                    <li key={section.section_uid}>
                      <button type="button" className={cn("tb-section", activeUid === section.section_uid && "active")} onClick={() => onOpenSection(section.section_uid)}>
                        {section.section_title || "（无标题小节）"}
                        {section.visible_block_count === 0 ? <small>无正文</small> : null}
                      </button>
                    </li>
                  ))}
                  {!sections[chapter.chapter_id].length ? <li className="tb-note">该章没有独立小节。</li> : null}
                </ul>
              ) : (
                <p className="tb-loading">
                  <LoaderCircle size={12} /> 正在载入小节…
                </p>
              )
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A chapter read as one continuous run: the first window arrives with the chapter
 * call, further windows are appended on request, so opening a 40-section chapter
 * never ships 40 sections at once.
 */
function ChapterWindows({ chapterId, initial, onOpenSection }: { chapterId: string; initial: any; onOpenSection: (uid: string) => void }) {
  const [sections, setSections] = useState<any[]>(initial.sections ?? []);
  const [chapterLevel, setChapterLevel] = useState<any[]>(initial.chapter_level_blocks ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const total = initial.window?.section_count ?? sections.length;

  async function loadMore() {
    setLoading(true);
    setError("");
    try {
      const body = await getJson<any>(`/api/textbook/chapter?id=${encodeURIComponent(chapterId)}&from=${sections.length}&limit=3`);
      setSections((current) => [...current, ...(body.sections ?? [])]);
      if (body.chapter_level_blocks?.length) setChapterLevel((current) => [...current, ...body.chapter_level_blocks]);
    } catch (loadError) {
      setError((loadError as Error).message || "后续小节载入失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {chapterLevel.length ? (
        <section className="tb-chapter-level">
          <h3>本章未归入独立小节的表格</h3>
          <Blocks blocks={chapterLevel} />
        </section>
      ) : null}
      {sections.map((section) => (
        <section className="tb-chapter-section" key={section.section_uid}>
          <h2>
            <button type="button" onClick={() => onOpenSection(section.section_uid)}>
              {section.section_title || "（无标题小节）"}
            </button>
          </h2>
          <p className="tb-meta">{pageRange(section.start_page, section.end_page)}</p>
          <Blocks blocks={section.blocks} />
        </section>
      ))}
      {error ? <p className="tb-error">{error}</p> : null}
      {sections.length < total ? (
        <button type="button" className="tb-load-more" onClick={() => void loadMore()} disabled={loading}>
          {loading ? "载入中…" : `继续载入下一批（已显示 ${sections.length} / ${total} 节）`}
        </button>
      ) : (
        <p className="tb-note">本章已全部读毕（{total} 节）。</p>
      )}
    </>
  );
}
