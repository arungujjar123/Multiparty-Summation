import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APICallError,
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/server/auth";
import { getChatModel, isAiConfigured } from "@/lib/server/ai";
import { COPILOT_SYSTEM_PROMPT, copilotTools } from "@/lib/server/copilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_HISTORY_MESSAGES = 20;

function friendlyError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) {
      return "Gemini rate limit reached (free tier). Please wait a minute and try again.";
    }
    if (error.statusCode === 400 || error.statusCode === 403) {
      return "Gemini rejected the request. Check GOOGLE_GENERATIVE_AI_API_KEY and the model name.";
    }
  }
  console.error("[Copilot] error", error);
  return "Something went wrong while answering. Please try again.";
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const user = await getUserBySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json({ error: "Please log in to use the Copilot." }, { status: 401 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error: "Copilot is not configured: GOOGLE_GENERATIVE_AI_API_KEY is missing on the server.",
      },
      { status: 503 }
    );
  }

  let messages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages) || body.messages.length === 0) throw new Error();
    messages = body.messages.slice(-MAX_HISTORY_MESSAGES);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = streamText({
    model: getChatModel(),
    system: COPILOT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: copilotTools,
    stopWhen: isStepCount(5),
    temperature: 0.2,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      tools: copilotTools,
      onError: friendlyError,
    }),
  });
}
