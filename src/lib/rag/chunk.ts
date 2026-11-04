/**
 * @fileoverview Text cleanup and chunking for RAG ingestion (pure, unit-tested).
 */

/** Remove HTML tags, markdown link/image syntax and excess whitespace. */
export function stripMarkup(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface ChunkOptions {
  /** Target maximum characters per chunk. */
  maxChars?: number;
  /** Characters carried over from the end of the previous chunk. */
  overlap?: number;
}

/**
 * Split text into overlapping chunks, preferring paragraph, then sentence,
 * then word boundaries.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChars = options.maxChars ?? 1200;
  const overlap = Math.min(options.overlap ?? 200, Math.floor(maxChars / 2));
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  // Break into units no longer than maxChars.
  const units: string[] = [];
  for (const para of clean.split(/\n{2,}/)) {
    if (para.length <= maxChars) {
      units.push(para);
      continue;
    }
    for (const sentence of para.split(/(?<=[.!?])\s+/)) {
      if (sentence.length <= maxChars) {
        units.push(sentence);
        continue;
      }
      for (let i = 0; i < sentence.length; i += maxChars) {
        units.push(sentence.slice(i, i + maxChars));
      }
    }
  }

  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    const candidate = current ? `${current}\n\n${unit}` : unit;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    const tail = overlap > 0 && current ? tailOnWordBoundary(current, overlap) : "";
    current = tail && tail.length + unit.length + 2 <= maxChars ? `${tail}\n\n${unit}` : unit;
  }
  if (current) chunks.push(current);
  return chunks;
}

function tailOnWordBoundary(text: string, size: number): string {
  if (text.length <= size) return text;
  const slice = text.slice(text.length - size);
  const firstSpace = slice.search(/\s/);
  return (firstSpace >= 0 ? slice.slice(firstSpace) : slice).trim();
}
