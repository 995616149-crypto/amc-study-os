import TextbookReader from "../../reader";

export const metadata = {
  title: "教材章节 · Murtagh 9e — AMC Study OS",
};

/** /textbook/chapter/<chapter_id> — the chapter read as a continuous run. */
export default async function TextbookChapterPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolved = await params;
  return <TextbookReader initialChapterId={decodeURIComponent(String(resolved.id))} />;
}
