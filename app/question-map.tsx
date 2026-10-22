"use client";

import { useMemo, useState } from "react";
import { practiceabilityLabel } from "@/lib/practiceability";

// `practiceable` and the canonical chapter are independent facts.  A record with
// no canonical chapter is still practiceable; only a real record-level defect
// (missing answer, incomplete options, a required missing visual, a leaked answer
// panel) disables the button.
//
// `sourceScope` is a third, equally independent fact: which question bank the
// record came from.  Filtering by it must never change a record's own status.
type CanonicalRow = {
  record_id: string; stem: string; domain: string; sourceScope?: string;
  practiceable: boolean; practiceReason: string | null; visualIntegrityStatus?: string | null;
};
type AttemptRow = { question_id: string; correct: number | boolean; attempted_at: string; id: string };
type MappingRow = { record_id: string; primary_chapter_id: string | null; mapping_status: string };
type ChapterRow = { id: string; title: string };
type PracticeabilitySummary = { total: number; practiceable: number; unpracticeable: number; reasons: Record<string, number>; unmappedChapter: number; unmappedButPracticeable: number };
export type SourceOption = { key: string; label: string };
type ScopeStat = { total: number; practiceable: number; completed: number; correct: number; incorrect: number; unseen: number; accuracy: number };

const UNMAPPED_BUCKET = "尚未建立 canonical chapter（仍可刷题）";

export function QuestionMap({ records, attempts, mappings, chapters, currentQuestionId, onJump, onChapterPractice, practiceability, loading, sourceScope = "all", sourceOptions, onSourceScopeChange }: {
  records: CanonicalRow[]; attempts: AttemptRow[]; mappings: MappingRow[]; chapters: ChapterRow[];
  currentQuestionId?: string; onJump: (id: string) => void; onChapterPractice: (chapterId: string) => void;
  practiceability?: PracticeabilitySummary | null; loading?: boolean;
  sourceScope?: string; sourceOptions?: SourceOption[]; onSourceScopeChange?: (scope: string) => void;
}) {
  const [selected, setSelected] = useState<CanonicalRow | null>(null);

  // Which bank a record belongs to is a property of the record, so the filter is
  // applied before any grouping, numbering or progress maths.
  const scoped = useMemo(
    () => (sourceScope === "all" ? records : records.filter((row) => (row.sourceScope ?? "legacy") === sourceScope)),
    [records, sourceScope],
  );

  const latestByQuestion = useMemo(() => {
    const latest = new Map<string, AttemptRow>();
    for (const attempt of [...attempts].sort((a, b) => b.attempted_at.localeCompare(a.attempted_at) || b.id.localeCompare(a.id))) {
      if (!latest.has(attempt.question_id)) latest.set(attempt.question_id, attempt);
    }
    return latest;
  }, [attempts]);

  // Independent per-source statistics.  Un-mapped questions still count: the
  // canonical chapter is irrelevant to whether a question can be practised.
  const scopeStats = useMemo(() => {
    const stats: Record<string, ScopeStat> = {};
    for (const key of ["all", ...(sourceOptions ?? []).map((option) => option.key).filter((k) => k !== "all")]) {
      const rows = key === "all" ? records : records.filter((row) => (row.sourceScope ?? "legacy") === key);
      const seen = rows.filter((row) => latestByQuestion.has(row.record_id));
      const correct = seen.filter((row) => Boolean(latestByQuestion.get(row.record_id)!.correct)).length;
      stats[key] = {
        total: rows.length, practiceable: rows.filter((row) => row.practiceable).length,
        completed: seen.length, correct, incorrect: seen.length - correct, unseen: rows.length - seen.length,
        accuracy: seen.length ? Math.round((correct / seen.length) * 100) : 0,
      };
    }
    return stats;
  }, [records, latestByQuestion, sourceOptions]);

  const catalog = useMemo(() => {
    // Numbering is tied to immutable canonical IDs, not the user's progress or
    // the still-evolving chapter mapping. It is stable across sessions.
    const numbers = new Map([...scoped].sort((a, b) => a.record_id.localeCompare(b.record_id)).map((row, index) => [row.record_id, index + 1]));
    const mappingByQuestion = new Map(mappings.map((row) => [row.record_id, row.primary_chapter_id]));
    const chapterTitles = new Map(chapters.map((row) => [row.id, row.title]));
    const domains = new Map<string, Map<string, CanonicalRow[]>>();
    for (const record of scoped) {
      const domain = record.domain || "未分类", chapterId = mappingByQuestion.get(record.record_id);
      const chapter = chapterId ? (chapterTitles.get(chapterId) ?? `无效章节引用：${chapterId}`) : UNMAPPED_BUCKET;
      if (!domains.has(domain)) domains.set(domain, new Map());
      const group = domains.get(domain)!;
      if (!group.has(chapter)) group.set(chapter, []);
      group.get(chapter)!.push(record);
    }
    return { numbers, domains, mappingByQuestion };
  }, [scoped, mappings, chapters]);

  const progress = (rows: CanonicalRow[]) => {
    const seen = rows.map((row) => latestByQuestion.get(row.record_id)).filter((row): row is AttemptRow => !!row);
    const correct = seen.filter((row) => Boolean(row.correct)).length;
    return { completed: seen.length, correct, wrong: seen.length - correct, unattempted: rows.length - seen.length, accuracy: seen.length ? Math.round(correct / seen.length * 100) : 0 };
  };

  const sourceBar = sourceOptions && sourceOptions.length > 1 && (
    <div className="source-scope-bar" role="group" aria-label="题源 / Question Source">
      <span className="source-scope-label">题源 / Question Source</span>
      {sourceOptions.map((option) => (
        <button type="button" key={option.key} className={`source-scope-option${option.key === sourceScope ? " active" : ""}`}
          aria-pressed={option.key === sourceScope} onClick={() => onSourceScopeChange?.(option.key)}>
          {option.label}<b>{scopeStats[option.key]?.total ?? 0}</b>
        </button>
      ))}
    </div>
  );

  if (!records.length) return <section className="question-map content-page"><h1>题目总览 / Question Map</h1>{sourceBar}<p className="empty">{loading ? "正在后台载入题目总览（不影响刷题）…" : "题目总览暂时不可用。"}</p></section>;

  if (!scoped.length) return <section className="question-map content-page"><h1>题目总览 / Question Map</h1>{sourceBar}<p className="empty">该题源暂无题目。</p></section>;

  const active = scopeStats[sourceScope] ?? scopeStats.all;

  return <section className="question-map content-page"><h1>题目总览 / Question Map</h1>
    {sourceBar}
    {active && <div className="source-scope-stats" role="status" aria-label="题源统计">
      <span>题源范围<b>{sourceOptions?.find((option) => option.key === sourceScope)?.label ?? sourceScope}</b></span>
      <span>总题数<b>{active.total}</b></span>
      <span>可练<b>{active.practiceable}</b></span>
      <span>已完成<b>{active.completed}</b></span>
      <span>正确<b>{active.correct}</b></span>
      <span className="warn">错误<b>{active.incorrect}</b></span>
      <span>未做<b>{active.unseen}</b></span>
      <span>Accuracy<b>{active.accuracy}%</b></span>
    </div>}
    <p>题号按固定 canonical ID 编排；灰＝未做，绿＝最近一次正确，红＝最近一次错误，蓝框＝当前题。是否可练只看题目本身（题干、选项、是否有可判分答案、是否缺原题必需图片），不看是否已归章，也不看题源。</p>
    <div className="question-map-legend"><span className="unattempted">未做</span><span className="correct">正确</span><span className="wrong">错误</span><span className="current">当前</span><span className="excluded">不可练（可查看原因）</span></div>
    {practiceability && <div className="practiceability-summary"><span>canonical 总数<b>{practiceability.total}</b></span><span>可练<b>{practiceability.practiceable}</b></span><span className="warn">不可练<b>{practiceability.unpracticeable}</b></span><span>未归章但可练<b>{practiceability.unmappedButPracticeable}</b></span>{Object.entries(practiceability.reasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => <span key={reason} className="warn">{practiceabilityLabel(reason)}<b>{count}</b></span>)}</div>}
    {[...catalog.domains].sort(([a], [b]) => a.localeCompare(b)).map(([domain, groups]) => {
      const rows = [...groups.values()].flat(), summary = progress(rows);
      return <details className="question-map-domain" key={domain}><summary><b>{domain}</b><span>{summary.completed}/{rows.length} 已做 · 可练 {rows.filter((row) => row.practiceable).length}</span></summary><div>
        {[...groups].sort(([a], [b]) => a.localeCompare(b)).map(([chapter, items]) => {
          const part = progress(items);
          const chapterRow = chapter === UNMAPPED_BUCKET ? null : chapters.find((row) => row.title === chapter);
          return <details className="question-map-chapter" key={chapter}><summary><b>{chapter}</b><span>完成 {part.completed}/{items.length} · 对 {part.correct} · 错 {part.wrong} · 未做 {part.unattempted} · Accuracy {part.accuracy}%</span></summary>
            {chapterRow && items.some((row) => row.practiceable) && <button type="button" className="question-map-practice" onClick={() => onChapterPractice(chapterRow.id)}>按本章刷题</button>}
            <div className="question-map-grid">{items.sort((a, b) => catalog.numbers.get(a.record_id)! - catalog.numbers.get(b.record_id)!).map((record) => {
              const attempt = latestByQuestion.get(record.record_id), status = attempt ? (attempt.correct ? "correct" : "wrong") : "unattempted", current = record.record_id === currentQuestionId;
              const unmapped = !catalog.mappingByQuestion.get(record.record_id);
              return <button type="button" key={record.record_id} className={`question-map-number ${status}${current ? " current" : ""}${!record.practiceable ? " excluded" : ""}`}
                aria-label={`题号 ${catalog.numbers.get(record.record_id)}，${attempt ? (attempt.correct ? "最近答对" : "最近答错") : "未做"}${record.practiceable ? (unmapped ? "，可练，尚未归章" : "，可练") : `，不可练：${practiceabilityLabel(record.practiceReason)}`}`}
                title={`Q${catalog.numbers.get(record.record_id)} · ${record.practiceable ? (unmapped ? "可练（未归章）" : "可练") : `不可练：${practiceabilityLabel(record.practiceReason)}`}\n${record.stem.slice(0, 150)}`}
                onClick={() => record.practiceable ? onJump(record.record_id) : setSelected(record)}>{catalog.numbers.get(record.record_id)}{unmapped && record.practiceable && <i className="um">未归章</i>}</button>;
            })}</div></details>;
        })}</div></details>;
    })}
    {selected && <aside className="question-map-unavailable" role="status"><button type="button" onClick={() => setSelected(null)} aria-label="关闭记录预览">×</button><b>Q{catalog.numbers.get(selected.record_id)} · 不可练</b><p>{selected.stem}</p><small>原因：{practiceabilityLabel(selected.practiceReason)}</small>{selected.visualIntegrityStatus === "INCOMPLETE_MISSING_REQUIRED_VISUAL" && <small>Original required visual unavailable — excluded from active practice</small>}{selected.visualIntegrityStatus === "INCOMPLETE_LEAKED_ANSWER_IN_OPTIONS" && <small>原始选项混入答案区文字，待核对来源后恢复；未删除题目。</small>}<ul><li>该记录完整保留在题库中，没有被删除，也没有被静默丢弃。</li><li>修复原始记录（补齐答案 / 选项 / 题图）后即可进入练习。</li></ul></aside>}
  </section>;
}
