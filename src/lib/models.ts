export const models = [
  {
    id: "claude-sonnet-5-5",
    name: "Claude",
    detail: "Sonnet 5.5",
    provider: "Anthropic",
    swatch: "#c45c26",
  },
  {
    id: "gpt-4.1-mini",
    name: "OpenAI",
    detail: "GPT-4.1 mini",
    provider: "OpenAI",
    swatch: "#1f7a4d",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini",
    detail: "3.6 Flash",
    provider: "Google",
    swatch: "#2c6cb0",
  },
  {
    id: "llama3.2:1b",
    name: "Ollama",
    detail: "Llama 3.2 1B",
    provider: "Local",
    swatch: "#8a5a2b",
  },
] as const;

export type ModelId = (typeof models)[number]["id"];

export function getModel(id: ModelId) {
  return models.find((model) => model.id === id) ?? models[0];
}
