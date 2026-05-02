import { NextResponse } from "next/server";
import { ensureDefaultDocs, getDocSections } from "@/lib/server/docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDefaultDocs();
  const sections = await getDocSections();
  return NextResponse.json({ sections }, { status: 200 });
}
