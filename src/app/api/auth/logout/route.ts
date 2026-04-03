import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSessionToken, SESSION_COOKIE_NAME } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  await deleteSessionToken(token);
  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ success: true }, { status: 200 });
}
