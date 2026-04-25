import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUserBySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/server/auth";
import {
  createDocSection,
  ensureDefaultDocs,
  getDocSections,
} from "@/lib/server/docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureDefaultDocs();
  const sections = await getDocSections();
  return NextResponse.json({ sections }, { status: 200 });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, icon } = body || {};

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const result = await createDocSection({ title, icon: icon || "📄" });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ section: result.section }, { status: 201 });
}
