/**
 * @fileoverview Retrieval-Augmented Generation over the documentation.
 *
 * Sources that get indexed for every doc section:
 *   - the section's markdown content (or the built-in default content)
 *   - every attached PDF (Cloudinary URLs in `attachments` and `pdfs`)
 *
 * Each source is split into chunks, embedded with Gemini and stored in the
 * `doc_chunks` collection. Search uses MongoDB Atlas `$vectorSearch` and falls
 * back to in-memory cosine similarity when the index is missing (e.g. a local
 * MongoDB or an index that is still building).
 */
import crypto from "crypto";
import { cosineSimilarity, embed, embedMany } from "ai";
import { extractText, getDocumentProxy } from "unpdf";
import { getDb } from "@/lib/mongodb";
import { getDocSectionById, getDocSections } from "@/lib/server/docs";
import { resolveEditorDocContent } from "@/lib/docsBuiltIn";
import { chunkText, stripMarkup } from "@/lib/rag/chunk";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_ID,
  embeddingProviderOptions,
  getEmbeddingModel,
} from "@/lib/server/ai";

export const CHUNKS_COLLECTION = "doc_chunks";
export const VECTOR_INDEX_NAME = "doc_chunks_vector_index";

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_PDF_PAGES = 300;
const MAX_CHUNKS_PER_SOURCE = 400;
const FALLBACK_SCAN_LIMIT = 5000;

export interface ChunkDoc {
  sectionId: string;
  sectionTitle: string;
  sourceKey: string;
  sourceType: "section" | "pdf";
  sourceName: string;
  url?: string;
  page?: number;
  chunkIndex: number;
  text: string;
  embedding: number[];
  contentHash: string;
  embeddingModel: string;
  indexedAt: string;
}

export interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  sourceName: string;
  sourceType: "section" | "pdf";
  url?: string;
  page?: number;
  text: string;
  score: number;
}

export interface SourceReport {
  sectionId: string;
  sourceName: string;
  status: "indexed" | "unchanged" | "skipped" | "failed";
  chunks?: number;
  message?: string;
}

interface Source {
  sourceKey: string;
  sourceType: "section" | "pdf";
  sourceName: string;
  url?: string;
  contentHash: string;
  load: () => Promise<Array<{ text: string; page?: number }>>;
}

type SectionRecord = NonNullable<Awaited<ReturnType<typeof getDocSectionById>>>;

async function chunks() {
  const db = await getDb();
  return db.collection<ChunkDoc>(CHUNKS_COLLECTION);
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function pdfNameFromUrl(url: string) {
  try {
    const last = new URL(url).pathname.split("/").pop() || "document.pdf";
    return decodeURIComponent(last);
  } catch {
    return "document.pdf";
  }
}

async function loadPdfPages(url: string): Promise<Array<{ text: string; page: number }>> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Download failed (HTTP ${response.status})`);
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_PDF_BYTES) throw new Error("PDF is larger than 25 MB");
  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength > MAX_PDF_BYTES) throw new Error("PDF is larger than 25 MB");

  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: false });
  return text.slice(0, MAX_PDF_PAGES).map((pageText, i) => ({ text: pageText, page: i + 1 }));
}

function sourcesForSection(section: SectionRecord): Source[] {
  const sources: Source[] = [];

  const markdown = resolveEditorDocContent(section.id, section.content || "");
  const sectionText = stripMarkup(markdown);
  if (sectionText) {
    sources.push({
      sourceKey: `section:${section.id}`,
      sourceType: "section",
      sourceName: `${section.title} (docs page)`,
      contentHash: sha256(`${section.title}\n${sectionText}`),
      load: async () => [{ text: sectionText }],
    });
  }

  const pdfNames = new Map(section.pdfs.map((p) => [p.url, p.name]));
  const urls = [...new Set([...(section.attachments || []), ...section.pdfs.map((p) => p.url)])];
  for (const url of urls) {
    if (!/^https?:\/\//i.test(url)) continue;
    sources.push({
      sourceKey: `pdf:${url}`,
      sourceType: "pdf",
      sourceName: pdfNames.get(url) || pdfNameFromUrl(url),
      url,
      // Cloudinary URLs are unique per upload, so the URL identifies the content.
      contentHash: sha256(url),
      load: () => loadPdfPages(url),
    });
  }

  return sources;
}

async function indexSource(section: SectionRecord, source: Source): Promise<SourceReport> {
  const col = await chunks();
  const base = { sectionId: section.id, sourceName: source.sourceName };

  const existing = await col.findOne(
    { sectionId: section.id, sourceKey: source.sourceKey },
    { projection: { contentHash: 1, embeddingModel: 1 } }
  );
  if (
    existing &&
    existing.contentHash === source.contentHash &&
    existing.embeddingModel === EMBEDDING_MODEL_ID
  ) {
    return { ...base, status: "unchanged" };
  }

  let pieces: Array<{ text: string; page?: number }>;
  try {
    const parts = await source.load();
    pieces = parts
      .flatMap((part) =>
        chunkText(stripMarkup(part.text)).map((text) => ({ text, page: part.page }))
      )
      .filter((p) => p.text.length >= 20)
      .slice(0, MAX_CHUNKS_PER_SOURCE);
  } catch (error) {
    return { ...base, status: "failed", message: (error as Error).message };
  }

  if (pieces.length === 0) {
    await col.deleteMany({ sectionId: section.id, sourceKey: source.sourceKey });
    return {
      ...base,
      status: "skipped",
      message:
        source.sourceType === "pdf"
          ? "No extractable text (scanned/image-only PDF?)"
          : "Section has no text",
    };
  }

  // Prefix the section title so a chunk keeps its context when retrieved alone.
  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    values: pieces.map((p) => `${section.title} — ${source.sourceName}\n\n${p.text}`),
    providerOptions: embeddingProviderOptions("RETRIEVAL_DOCUMENT"),
    maxParallelCalls: 2,
  });

  const now = new Date().toISOString();
  const docs: ChunkDoc[] = pieces.map((p, i) => ({
    sectionId: section.id,
    sectionTitle: section.title,
    sourceKey: source.sourceKey,
    sourceType: source.sourceType,
    sourceName: source.sourceName,
    ...(source.url ? { url: source.url } : {}),
    ...(p.page ? { page: p.page } : {}),
    chunkIndex: i,
    text: p.text,
    embedding: embeddings[i],
    contentHash: source.contentHash,
    embeddingModel: EMBEDDING_MODEL_ID,
    indexedAt: now,
  }));

  await col.deleteMany({ sectionId: section.id, sourceKey: source.sourceKey });
  await col.insertMany(docs);
  return { ...base, status: "indexed", chunks: docs.length };
}

/** Bring the index for one section in line with its current content and PDFs. */
export async function syncSectionIndex(sectionId: string): Promise<SourceReport[]> {
  const section = await getDocSectionById(sectionId);
  if (!section) {
    await deleteSectionIndex(sectionId);
    return [];
  }

  const sources = sourcesForSection(section);
  const col = await chunks();
  await col.deleteMany({
    sectionId,
    sourceKey: { $nin: sources.map((s) => s.sourceKey) },
  });

  const reports: SourceReport[] = [];
  for (const source of sources) {
    try {
      reports.push(await indexSource(section, source));
    } catch (error) {
      reports.push({
        sectionId,
        sourceName: source.sourceName,
        status: "failed",
        message: (error as Error).message,
      });
    }
  }
  return reports;
}

/** Fire-and-forget wrapper used after admin edits; never throws. */
export async function syncSectionIndexSafe(sectionId: string) {
  try {
    const reports = await syncSectionIndex(sectionId);
    const failed = reports.filter((r) => r.status === "failed");
    if (failed.length) console.warn("[RAG] Some sources failed to index", failed);
  } catch (error) {
    console.error("[RAG] Failed to sync section", sectionId, error);
  }
}

export async function deleteSectionIndex(sectionId: string) {
  const col = await chunks();
  await col.deleteMany({ sectionId });
}

export async function syncAllSections(): Promise<SourceReport[]> {
  const sections = await getDocSections();
  const col = await chunks();
  await col.deleteMany({ sectionId: { $nin: sections.map((s) => s.id) } });

  const reports: SourceReport[] = [];
  for (const section of sections) {
    reports.push(...(await syncSectionIndex(section.id)));
  }
  return reports;
}

/**
 * Create the Atlas Vector Search index if it does not exist yet.
 * Returns a human-readable status; never throws.
 */
export async function ensureVectorIndex(): Promise<string> {
  try {
    const db = await getDb();
    const exists = await db.listCollections({ name: CHUNKS_COLLECTION }).hasNext();
    if (!exists) await db.createCollection(CHUNKS_COLLECTION);

    const col = db.collection(CHUNKS_COLLECTION);
    const indexes = await col.listSearchIndexes(VECTOR_INDEX_NAME).toArray();
    if (indexes.length > 0) {
      const status = (indexes[0] as { status?: string }).status ?? "unknown";
      return `Vector index "${VECTOR_INDEX_NAME}" exists (status: ${status}).`;
    }

    await col.createSearchIndex({
      name: VECTOR_INDEX_NAME,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: EMBEDDING_DIMENSIONS,
            similarity: "cosine",
          },
          { type: "filter", path: "sectionId" },
        ],
      },
    });
    return `Vector index "${VECTOR_INDEX_NAME}" created. Atlas needs about a minute to build it; until then search uses the in-memory fallback.`;
  } catch (error) {
    return `Could not create vector index (${(error as Error).message}). Search will use the in-memory fallback.`;
  }
}

export async function getIndexStats() {
  const col = await chunks();
  const [totalChunks, bySource] = await Promise.all([
    col.countDocuments(),
    col
      .aggregate<{ _id: { sectionId: string; sourceName: string }; chunks: number }>([
        {
          $group: {
            _id: { sectionId: "$sectionId", sourceName: "$sourceName" },
            chunks: { $sum: 1 },
          },
        },
        { $sort: { "_id.sectionId": 1 } },
      ])
      .toArray(),
  ]);
  return {
    totalChunks,
    sources: bySource.map((s) => ({ ...s._id, chunks: s.chunks })),
  };
}

export async function searchDocs(query: string, limit = 5): Promise<SearchResult[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: query,
    providerOptions: embeddingProviderOptions("RETRIEVAL_QUERY"),
  });

  const col = await chunks();
  const projection = {
    _id: 0,
    sectionId: 1,
    sectionTitle: 1,
    sourceName: 1,
    sourceType: 1,
    url: 1,
    page: 1,
    text: 1,
  };

  try {
    const results = await col
      .aggregate<SearchResult>([
        {
          $vectorSearch: {
            index: VECTOR_INDEX_NAME,
            path: "embedding",
            queryVector: embedding,
            numCandidates: Math.max(limit * 20, 100),
            limit,
          },
        },
        { $project: { ...projection, score: { $meta: "vectorSearchScore" } } },
      ])
      .toArray();
    if (results.length > 0) return results;
  } catch (error) {
    console.warn(
      "[RAG] $vectorSearch unavailable, using in-memory search:",
      (error as Error).message
    );
  }

  // Fallback: brute-force cosine similarity (fine for a few thousand chunks).
  const all = await col
    .find({}, { projection: { ...projection, embedding: 1 } })
    .limit(FALLBACK_SCAN_LIMIT)
    .toArray();

  return all
    .map(({ embedding: vector, ...rest }) => ({
      ...(rest as Omit<SearchResult, "score">),
      score: cosineSimilarity(embedding, vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
