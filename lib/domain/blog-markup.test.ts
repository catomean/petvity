import { describe, it, expect } from "vitest";
import { parseBlogBody, readingMinutes } from "./blog-markup";

describe("parseBlogBody", () => {
  it("reads a paragraph", () => {
    expect(parseBlogBody("Hello there.")).toEqual([{ type: "p", text: "Hello there." }]);
  });

  it("joins wrapped lines into one paragraph", () => {
    // The editor is a textarea; authors wrap lines without meaning a new block.
    expect(parseBlogBody("One line\nand its continuation.")).toEqual([
      { type: "p", text: "One line and its continuation." },
    ]);
  });

  it("splits paragraphs on a blank line", () => {
    expect(parseBlogBody("First.\n\nSecond.")).toEqual([
      { type: "p", text: "First." },
      { type: "p", text: "Second." },
    ]);
  });

  it("reads a subheading", () => {
    expect(parseBlogBody("## Why it matters")).toEqual([
      { type: "h2", text: "Why it matters" },
    ]);
  });

  it("groups consecutive dashes into one list", () => {
    expect(parseBlogBody("- one\n- two\n- three")).toEqual([
      { type: "ul", items: ["one", "two", "three"] },
    ]);
  });

  it("separates two lists split by a blank line", () => {
    expect(parseBlogBody("- a\n\n- b")).toEqual([
      { type: "ul", items: ["a"] },
      { type: "ul", items: ["b"] },
    ]);
  });

  it("closes a paragraph when a list starts, and vice versa", () => {
    expect(parseBlogBody("Intro:\n- a\nOutro.")).toEqual([
      { type: "p", text: "Intro:" },
      { type: "ul", items: ["a"] },
      { type: "p", text: "Outro." },
    ]);
  });

  it("handles a full post in order", () => {
    const out = parseBlogBody("Opening.\n\n## Section\n\nBody text.\n\n- point\n- point two");
    expect(out.map((b) => b.type)).toEqual(["p", "h2", "p", "ul"]);
  });

  // Untrusted text must never become markup — this is the whole reason the
  // parser emits a closed set of blocks instead of HTML.
  it("keeps HTML as literal paragraph text", () => {
    expect(parseBlogBody('<script>alert(1)</script>')).toEqual([
      { type: "p", text: '<script>alert(1)</script>' },
    ]);
  });

  it.each(["", "   ", "\n\n\n"])("returns nothing for empty source %p", (src) => {
    expect(parseBlogBody(src)).toEqual([]);
  });

  it("drops an empty list marker rather than rendering a blank bullet", () => {
    expect(parseBlogBody("- ")).toEqual([]);
  });

  it("normalises CRLF from a Windows paste", () => {
    expect(parseBlogBody("A.\r\n\r\nB.")).toEqual([
      { type: "p", text: "A." },
      { type: "p", text: "B." },
    ]);
  });
});

describe("readingMinutes", () => {
  it("never reports zero minutes for a short post", () => {
    expect(readingMinutes("Three words here")).toBe(1);
  });

  it("scales with length", () => {
    expect(readingMinutes(Array(400).fill("word").join(" "))).toBe(2);
  });
});
