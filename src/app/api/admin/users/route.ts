import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUserBySessionToken,
  listUsers,
  SESSION_COOKIE_NAME,
} from "@/lib/server/auth";

export const runtime = "nodejs";

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

  const users = await listUsers();
  return NextResponse.json({ users }, { status: 200 });
}
