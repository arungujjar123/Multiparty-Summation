import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/server/auth";
import { CHAT_MODEL_ID, EMBEDDING_MODEL_ID, isAiConfigured } from "@/lib/server/ai";
import { ensureVectorIndex, getIndexStats, syncSectionIndex } from "@/lib/server/rag";
import { getDocSections } from "@/lib/server/docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function requireAdmin() {
  const cookieStore = await cookies();
  const user = await getUserBySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

/** Index status for the admin panel. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [stats, sections] = await Promise.all([getIndexStats(), getDocSections()]);
  return NextResponse.json({
    aiConfigured: isAiConfigured(),
    chatModel: CHAT_MODEL_ID,
    embeddingModel: EMBEDDING_MODEL_ID,
    sectionIds: sections.map((s) => s.id),
    ...stats,
  });
}

/**
 * Re-index for the Copilot.
 * Body: { sectionId?: string }. Without sectionId only the vector index is
 * ensured; the admin UI then calls this once per section so each request
 * stays well inside the serverless time limit.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not set on the server." },
      { status: 503 }
    );
  }

  let body: { sectionId?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!body.sectionId) {
    const indexStatus = await ensureVectorIndex();
    return NextResponse.json({ indexStatus });
  }

  try {
    const reports = await syncSectionIndex(body.sectionId);
    return NextResponse.json({ reports });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
