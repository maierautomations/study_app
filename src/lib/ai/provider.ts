import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export function getModel(provider: "anthropic" | "openai" = "openai") {
  switch (provider) {
    case "anthropic":
      return anthropic("claude-sonnet-4-5-20250929");
    case "openai":
      return openai("gpt-4o-mini");
  }
}

export function getEmbeddingModel() {
  return openai.embedding("text-embedding-3-small");
}
