# Cryptography Copilot (RAG + Tool Calling)

A chat assistant at `/copilot` for logged-in users. It can:

1. **Answer questions from the documentation and uploaded PDFs** (RAG with citations).
2. **Verify (t, n) threshold parameters**: primality of p, t ≤ n, p > n, privacy, fault tolerance, multiplication feasibility (n ≥ 2t − 1) and whether the secrets or sums fit below p.
3. **Debug failed share reconstructions**: too few shares, x = 0, duplicate or conflicting x, wrong p, and corrupted shares (found by checking which degree-(t−1) polynomial most shares agree on).

**Design rule:** the LLM explains, deterministic code decides. Gemini never does modular arithmetic itself. It calls the tested functions in `src/lib/math/diagnostics.ts` and explains their output.

## Architecture

```
Admin saves a section / uploads a PDF
        │  (after() hook, runs after the response)
        ▼
src/lib/server/rag.ts
  load section markdown + download PDFs (unpdf) → chunk (src/lib/rag/chunk.ts)
  → Gemini embeddings (gemini-embedding-001, 768 dims) → MongoDB `doc_chunks`

User asks in /copilot  ──►  POST /api/chat  (src/app/api/chat/route.ts)
  streamText(Gemini) + tools (src/lib/server/copilot.ts):
    searchDocs             → Atlas $vectorSearch (falls back to in-memory cosine)
    verifyThreshold        → verifyThresholdParams()
    diagnoseReconstruction → diagnoseReconstruction()
  → streamed back; the UI renders tool results as cards with sources
```

| File                                   | Role                                                 |
| -------------------------------------- | ---------------------------------------------------- |
| `src/lib/server/ai.ts`                 | Model config (chat and embedding models, dimensions) |
| `src/lib/server/rag.ts`                | Ingestion, sync, vector index creation, search       |
| `src/lib/rag/chunk.ts`                 | Markup stripping and chunking (unit-tested)          |
| `src/lib/math/diagnostics.ts`          | Deterministic verification tools (unit-tested)       |
| `src/lib/server/copilot.ts`            | System prompt and tool definitions                   |
| `src/app/api/chat/route.ts`            | Chat endpoint (requires login)                       |
| `src/app/api/admin/rag/route.ts`       | Admin: index status and re-index                     |
| `src/app/copilot/page.tsx`             | Chat UI                                              |
| `src/components/CopilotIndexPanel.tsx` | "Index for Copilot" panel on `/admin/docs`           |

## Setup

### 1. Gemini API key

Create a free key at <https://aistudio.google.com/apikey> and add it to `.env` (never commit it):

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
# Optional overrides:
# GEMINI_CHAT_MODEL=gemini-2.5-flash
# GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

On Vercel, add the same variables under **Project → Settings → Environment Variables** and redeploy.

### 2. MongoDB Atlas vector index

Vector search needs a MongoDB **Atlas** cluster (the free M0 tier works).

- **Automatic:** log in as admin, open `/admin/docs` and click **Index for Copilot**. The app creates the index `doc_chunks_vector_index` and indexes every section and PDF.
- **Manual** (if the database user lacks permission): Atlas → your cluster → **Atlas Search → Create Search Index → JSON Editor → Vector Search**. Choose database `shamir_secret`, collection `doc_chunks`, name `doc_chunks_vector_index`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "sectionId" }
  ]
}
```

Until the index is ready (about a minute), search falls back to in-memory cosine similarity, so the Copilot still works.

### 3. Try it

```bash
npm run dev
```

Log in, open <http://localhost:3000/copilot> and try:

- "What is the threshold property of Shamir's Secret Sharing?" → `searchDocs` + cited answer
- "Is p = 97, n = 5, t = 3 safe? Can I also do multiplication?" → `verifyThreshold`
- "p = 11, t = 2, shares (1,5), (2,7), (3,10), (4,0). Reconstruction looks wrong — why?" → `diagnoseReconstruction` flags x = 3 as corrupted and recovers secret 3

## Keeping the index in sync

- Saving a section (`PATCH /api/admin/docs/[id]`) or uploading or removing a PDF re-indexes **that section** in the background.
- Deleting a section removes its chunks.
- Unchanged sources are skipped (content hash), so re-indexing is cheap.
- Changing the embedding model re-embeds everything on the next run.

## Limitations

- Scanned (image-only) PDFs have no extractable text. They are reported as `skipped`.
- PDFs over 25 MB or 300 pages are truncated or skipped.
- The Gemini free tier is rate-limited. On HTTP 429 the UI asks the user to wait.
- Answers about documents can still be wrong. The UI always shows the retrieved sources.

## Next steps

- `compileProtocol` tool: natural-language confidentiality constraints → `{p, n, t}` → open the visualizer.
- An evaluation set (questions with expected tools and sources) to measure tool-selection and retrieval accuracy.
