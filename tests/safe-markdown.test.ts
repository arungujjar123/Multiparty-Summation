/**
 * @fileoverview Security tests for rendering untrusted LLM Markdown
 */

import { renderSafeMarkdown } from "@/components/SafeMarkdown";

describe("renderSafeMarkdown", () => {
  test("renders Markdown formatting", () => {
    const html = renderSafeMarkdown("**Verdict:** ok\n\n* one\n* two");
    expect(html).toContain("<strong>Verdict:</strong>");
    expect(html).toContain("<li>one</li>");
  });

  test("renders inline and display math with KaTeX", () => {
    const html = renderSafeMarkdown("Need $n \ge 2t - 1$ parties.\n\n$$p_{min} = 2503$$");
    expect(html).toContain("katex");
    expect(html).toContain("katex-display");
    expect(html).not.toContain("$");
  });

  test("escapes raw HTML", () => {
    const html = renderSafeMarkdown('<img src=x onerror="alert(1)"><script>alert(2)</script>');
    expect(html).not.toMatch(/<img|<script/);
    expect(html).toContain("&lt;script&gt;");
  });

  test("drops images and javascript: links", () => {
    const html = renderSafeMarkdown("![x](https://evil.test/a.png) [click](javascript:alert(1))");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("click");
  });

  test("keeps safe links with rel=noopener", () => {
    const html = renderSafeMarkdown("[docs](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });
});
