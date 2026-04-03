import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUserBySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/server/auth";
import { deleteDocSection, updateDocSection } from "@/lib/server/docs";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
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
  const section = await updateDocSection(id, {
    title: body?.title,
    icon: body?.icon,
    content: body?.content,
  });

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json({ section }, { status: 200 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = await deleteDocSection(id);

  if (!deleted) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
