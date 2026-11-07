/**
 * @fileoverview Renders untrusted Markdown (e.g. LLM output) with KaTeX math
 * Raw HTML is escaped, images are dropped and only http(s)/mailto links are kept.
 */
"use client";
import React, { useMemo } from "react";
import { Marked } from "marked";
import katex from "katex";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Separate instance so the docs page's global marked options are untouched
const md = new Marked({ gfm: true, breaks: true });
md.use({
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    image({ text }) {
      return escapeHtml(text);
    },
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens);
      if (!/^(https?:|mailto:)/i.test(href)) return label;
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">${label}</a>`;
    },
  },
});

const MATH = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

export function renderSafeMarkdown(source: string): string {
  // Pull math out first so Markdown does not mangle underscores and asterisks inside it
  const math: string[] = [];
  const withPlaceholders = source.replace(MATH, (_, block: string, inline: string) => {
    math.push(
      katex.renderToString((block ?? inline).trim(), {
        displayMode: block !== undefined,
        throwOnError: false,
      })
    );
    return `@@MATH${math.length - 1}@@`;
  });

  const html = md.parse(withPlaceholders, { async: false }) as string;
  return html.replace(/@@MATH(\d+)@@/g, (_, i: string) => math[Number(i)] ?? "");
}

export default function SafeMarkdown({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderSafeMarkdown(text), [text]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
