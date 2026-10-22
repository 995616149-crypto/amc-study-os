"use client";

/**
 * Source-faithful rendering of assembled textbook blocks.
 *
 * Shared by the textbook reader (/textbook) and the practice page's full-section
 * area, so a section looks the same wherever it is opened.  The rule both callers
 * depend on: the block's OWN `block_type` decides its appearance, and nothing is
 * ever concatenated into one blob or rewritten — headings stay headings, tables
 * stay tables, captions stay captions.
 */
export type TextbookBlock = {
  block_id: string;
  block_order: number;
  block_type: string;
  text: string;
  heading_level: number | null;
  page: number | null;
  printed_page: number | null;
  figure_id?: string | null;
  figure_caption?: string | null;
  table_id?: string | null;
  table_html?: string | null;
  table_text?: string | null;
  table_caption?: string | null;
  manual_review_status?: string | null;
};

/** `pp.66–67` / `p.736` — the page range the retrieval layer reports. */
export function pageRangeLabel(start: number | null | undefined, end: number | null | undefined): string {
  if (!start) return "页码范围未标注";
  if (end && end !== start) return `pp.${start}–${end}`;
  return `p.${start}`;
}

function BlockView({ block }: { block: TextbookBlock }) {
  // `discarded` is the assembler's own class for page furniture (running heads,
  // footers, rules).  The reader hides exactly those and nothing else, and they are
  // still stored and still counted, so the deployed block count is unchanged.
  if (block.block_type === "discarded") return null;

  if (block.block_type === "heading") {
    const level = block.heading_level ?? 2;
    const Tag = (level <= 1 ? "h2" : level === 2 ? "h3" : "h4") as "h2" | "h3" | "h4";
    return <Tag className="tb-heading">{block.text}</Tag>;
  }

  if (block.block_type === "table") {
    return (
      <figure className="tb-table" data-block-id={block.block_id}>
        <figcaption>{block.table_caption || block.table_id || "表格"}</figcaption>
        {block.manual_review_status ? (
          <>
            <p className="tb-note">
              该表的结构化识别已标记为需人工复核（{block.manual_review_status}），因此不按表格网格显示，只给出原书文字。
            </p>
            {block.text ? <p className="tb-para">{block.text}</p> : null}
          </>
        ) : block.table_html ? (
          <div className="rich-table-wrap">
            <div className="rich-table tb-table-html" dangerouslySetInnerHTML={{ __html: block.table_html }} />
          </div>
        ) : (
          <p className="tb-para">{block.text || "（该表没有可直接显示的文本）"}</p>
        )}
      </figure>
    );
  }

  if (block.block_type === "figure") {
    return (
      <figure className="tb-figure" data-block-id={block.block_id}>
        <figcaption>{block.figure_caption || block.figure_id || "插图"}</figcaption>
        <p className="tb-note">
          原书插图的图像未随网页阅读器发布（图注与原书页码保留，便于对照纸质书核查）。
          {block.page ? ` 原书 PDF 第 ${block.page} 页。` : ""}
        </p>
      </figure>
    );
  }

  if (block.block_type === "equation") {
    return (
      <figure className="tb-figure" data-block-id={block.block_id}>
        <figcaption>公式</figcaption>
        <p className="tb-note">该公式在原书中以图像形式存在，结构化产物未保留可复现的文本。{block.page ? ` 原书 PDF 第 ${block.page} 页。` : ""}</p>
      </figure>
    );
  }

  if (!block.text.trim()) return null;
  return (
    <p className="tb-para" data-block-id={block.block_id}>
      {block.text}
    </p>
  );
}

export function TextbookBlocks({ blocks }: { blocks: TextbookBlock[] }) {
  return (
    <>
      {blocks.map((block) => (
        <BlockView key={block.block_id} block={block} />
      ))}
    </>
  );
}
