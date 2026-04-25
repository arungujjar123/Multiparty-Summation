import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSession,
  createUser,
  ensureDefaultAdmin,
  getUserByEmail,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await ensureDefaultAdmin();

    const body = await req.json();
    const { email, password, name } = body || {};

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const user = await createUser({ email, password, name });
    const session = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Registration Error:", error);
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}
