import TextbookReader from "./reader";

export const metadata = {
  title: "教科书 · Murtagh 9e — AMC Study OS",
  description: "Murtagh's General Practice 9th edition，按 Part / Chapter / Section 连续阅读。",
};

/** /textbook — the contents and the reading entry point. */
export default function TextbookPage() {
  return <TextbookReader />;
}
