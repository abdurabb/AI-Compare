import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { models, type ModelId } from "@/lib/models";

const instructions =
  "You are a senior software engineer who explains concepts clearly.";

export { instructions };

export function isModelId(value: unknown): value is ModelId {
  return typeof value === "string" && models.some((model) => model.id === value);
}

function requiredKey(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env and restart the dev server.`);
  }
  return value;
}

export function getLanguageModel(modelId: ModelId): LanguageModel {
  switch (modelId) {
    case "claude-sonnet-5-5":
      return createAnthropic({
        apiKey: requiredKey("ANTHROPIC_API_KEY"),
      })(modelId);
    case "gpt-4.1-mini":
      return createOpenAI({
        apiKey: requiredKey("OPENAI_API_KEY"),
      }).chat(modelId);
    case "gemini-3.6-flash":
      return createGoogle({
        apiKey: requiredKey("GEMINI_API_KEY"),
      })(modelId);
    case "llama3.2:1b":
      return createOpenAI({
        name: "ollama",
        baseURL: process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434/v1",
        apiKey: "ollama",
      }).chat(modelId);
  }
}
