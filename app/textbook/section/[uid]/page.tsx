import TextbookReader from "../../reader";

export const metadata = {
  title: "教材小节 · Murtagh 9e — AMC Study OS",
};

/**
 * /textbook/section/<section_uid>
 *
 * A real URL, so a refresh (and a link pasted into a new tab) returns to the same
 * section instead of depending on client state.
 */
export default async function TextbookSectionPage({ params }: { params: Promise<{ uid: string }> | { uid: string } }) {
  const resolved = await params;
  return <TextbookReader initialSectionUid={decodeURIComponent(String(resolved.uid))} />;
}
