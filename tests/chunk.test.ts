import { chunkText, stripMarkup } from "@/lib/rag/chunk";

describe("stripMarkup", () => {
  test("removes html, keeps link text", () => {
    const md = `# Title\n\n<div class="x"><a href="u">📥 Download PDF</a></div>\n\nSee [docs](http://x).`;
    expect(stripMarkup(md)).toBe("# Title\n\n📥 Download PDF\n\nSee docs.");
  });
});

describe("chunkText", () => {
  test("returns a single chunk for short text and nothing for empty text", () => {
    expect(chunkText("hello")).toEqual(["hello"]);
    expect(chunkText("   ")).toEqual([]);
  });

  test("respects maxChars and keeps all content", () => {
    const paras = Array.from({ length: 30 }, (_, i) => `Paragraph ${i} ${"word ".repeat(30)}`);
    const chunks = chunkText(paras.join("\n\n"), { maxChars: 500, overlap: 100 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(500);
    for (let i = 0; i < 30; i++) {
      expect(chunks.some((c) => c.includes(`Paragraph ${i} `))).toBe(true);
    }
  });

  test("splits a single very long paragraph", () => {
    const long = "a".repeat(2500);
    const chunks = chunkText(long, { maxChars: 1000, overlap: 0 });
    expect(chunks.map((c) => c.length)).toEqual([1000, 1000, 500]);
  });
});
