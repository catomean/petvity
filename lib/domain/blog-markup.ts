/**
 * The blog's authoring markup: a deliberately tiny subset of Markdown.
 *
 * Why not a Markdown library: posts render into a fixed set of blocks
 * (paragraph, subheading, list) that the post page already styles. A full
 * parser would buy inline HTML we would then have to sanitise — an XSS surface
 * in exchange for syntax nobody asked for. Parsing to a closed set of blocks
 * means untrusted text can never become markup.
 *
 * The rules, in full:
 *   ## Heading      → subheading
 *   - item          → list item (consecutive lines form one list)
 *   anything else   → paragraph (blank lines separate)
 *
 * Text is stored as written and parsed at render, so the author's source stays
 * the single truth and this parser can improve without a data migration.
 */

export type BlogBlock =
  { type: "p"; text: string } | { type: "h2"; text: string } | { type: "ul"; items: string[] };

export function parseBlogBody(source: string): BlogBlock[] {
  const blocks: BlogBlock[] = [];
  // Paragraphs may wrap across lines in the editor, so lines are joined until a
  // blank line or a different block type ends them.
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "p", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: list });
      list = [];
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      continue;
    }

    if (line.startsWith("## ")) {
      flushAll();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }

    // `line` is already trimmed, so a bullet the author left empty arrives as a
    // bare "-" and must still be recognised — otherwise it renders as a
    // paragraph containing a stray dash.
    if (line === "-" || line.startsWith("- ")) {
      // A list interrupts a paragraph, but consecutive items build one list.
      flushParagraph();
      const item = line.slice(1).trim();
      if (item) list.push(item);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushAll();
  return blocks.filter((b) => (b.type === "ul" ? b.items.length > 0 : b.text.length > 0));
}

/** Rough reading time, for the post header. */
export function readingMinutes(source: string): number {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
