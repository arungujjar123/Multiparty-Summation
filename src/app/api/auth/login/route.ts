import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSession,
  ensureDefaultAdmin,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifyUserCredentials,
} from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await ensureDefaultAdmin();

    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await verifyUserCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const session = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
