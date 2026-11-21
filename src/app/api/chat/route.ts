import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getLanguageModel, instructions, isModelId } from "@/lib/language-model";

export const maxDuration = 30;

function isUIMessage(value: unknown): value is UIMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as { role?: unknown; parts?: unknown };
  return (
    (message.role === "user" ||
      message.role === "assistant" ||
      message.role === "system") &&
    Array.isArray(message.parts)
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("The request body must be JSON.", { status: 400 });
  }

  const payload = body as { messages?: unknown; model?: unknown };
  if (!Array.isArray(payload.messages) || !payload.messages.every(isUIMessage)) {
    return new Response("Missing chat messages.", { status: 400 });
  }
  if (!isModelId(payload.model)) {
    return new Response("Choose a model before sending.", { status: 400 });
  }

  try {
    const result = streamText({
      model: getLanguageModel(payload.model),
      instructions,
      messages: await convertToModelMessages(payload.messages),
      maxOutputTokens: 1024,
      abortSignal: req.signal,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) =>
          error instanceof Error ? error.message : "The model request failed.",
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The model request failed.";
    return new Response(message, { status: 500 });
  }
}
