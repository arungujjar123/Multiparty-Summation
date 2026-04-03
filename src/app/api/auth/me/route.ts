import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ensureDefaultAdmin,
  getUserBySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
  await ensureDefaultAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserBySessionToken(token);

  return NextResponse.json({ user }, { status: 200 });
}
