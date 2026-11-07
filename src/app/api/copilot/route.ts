import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getModel } from "@/lib/ai/model";
import { AI_MAX_RETRIES, describeAiError } from "@/lib/ai/errors";
import { COPILOT_SYSTEM_PROMPT, copilotTools } from "@/lib/ai/copilotTools";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/server/auth";
import { checkRateLimit, getAiRateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MESSAGES = 30;
const MAX_STEPS = 6;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const user = await getUserBySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    if (!user) {
      return NextResponse.json({ error: "Please sign in to use the Copilot" }, { status: 401 });
    }

    const rate = await checkRateLimit("copilot", user.id, getAiRateLimit());
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached (${rate.limit}/hour). Try again after ${rate.resetAt.toISOString()}`,
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "messages must be a non-empty array" }, { status: 400 });
    }
    const messages = body.messages.slice(-MAX_MESSAGES);

    const result = streamText({
      model: getModel(),
      system: COPILOT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: copilotTools,
      stopWhen: isStepCount(MAX_STEPS),
      maxOutputTokens: 1500,
      maxRetries: AI_MAX_RETRIES,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) => {
          console.error("Copilot stream error:", error);
          return (
            describeAiError(error)?.message ??
            "The model request failed. Please try again in a moment."
          );
        },
      }),
    });
  } catch (err: unknown) {
    console.error("Copilot Error:", err);
    const aiError = describeAiError(err);
    if (aiError) return NextResponse.json({ error: aiError.message }, { status: aiError.status });
    const error = err as Error;
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
