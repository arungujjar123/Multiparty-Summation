import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { getModel } from "@/lib/ai/model";
import { AI_MAX_RETRIES, describeAiError } from "@/lib/ai/errors";
import { NL_TO_MPC_SYSTEM_PROMPT, protocolSpecSchema } from "@/lib/mpc/protocolSchema";
import { compileProtocol } from "@/lib/mpc/compiler";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/server/auth";
import { checkRateLimit, getAiRateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_REQUIREMENT_LENGTH = 2000;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const user = await getUserBySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    if (!user) {
      return NextResponse.json({ error: "Please sign in to use NL-to-MPC" }, { status: 401 });
    }

    const body = (await req.json()) as { requirement?: unknown };
    const requirement = typeof body.requirement === "string" ? body.requirement.trim() : "";
    if (!requirement) {
      return NextResponse.json(
        { error: "requirement must be a non-empty string" },
        { status: 400 }
      );
    }
    if (requirement.length > MAX_REQUIREMENT_LENGTH) {
      return NextResponse.json(
        { error: `requirement must be at most ${MAX_REQUIREMENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const rate = await checkRateLimit("nl-to-mpc", user.id, getAiRateLimit());
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached (${rate.limit}/hour). Try again after ${rate.resetAt.toISOString()}`,
        },
        { status: 429 }
      );
    }

    const started = Date.now();
    const {
      output: spec,
      usage,
      response,
    } = await generateText({
      model: getModel(),
      system: NL_TO_MPC_SYSTEM_PROMPT,
      prompt: requirement,
      output: Output.object({ schema: protocolSpecSchema }),
      temperature: 0,
      maxRetries: AI_MAX_RETRIES,
    });

    return NextResponse.json(
      {
        spec,
        compiled: compileProtocol(spec),
        meta: { model: response.modelId, latencyMs: Date.now() - started, usage },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("NL-to-MPC extraction failed:", err.text);
      return NextResponse.json(
        { error: "The model could not turn this requirement into a protocol spec. Rephrase it." },
        { status: 422 }
      );
    }
    console.error("NL-to-MPC Error:", err);
    const aiError = describeAiError(err);
    if (aiError) return NextResponse.json({ error: aiError.message }, { status: aiError.status });
    const error = err as Error;
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
