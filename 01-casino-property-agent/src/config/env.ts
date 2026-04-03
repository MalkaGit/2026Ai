import "dotenv/config";

export type LlmProvider = "openai" | "openrouter" | "ollama";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  propertyName: process.env.PROPERTY_NAME ?? "Mohegan Sun",
  llmProvider: requiredEnumProvider(),

  //for openai as LLM provider
  openAiApiKey: optional("OPENAI_API_KEY"),
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  //for openRouter as LLM provider
  openRouterApiKey: optional("OPENROUTER_API_KEY"),
  openRouterModel: process.env.OPENROUTER_MODEL ?? "openrouter/free",

  //for ollama as LLM provider
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.1"
};


function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requiredEnumProvider(): LlmProvider {
  const raw = (process.env.LLM_PROVIDER ?? "openai").trim().toLowerCase();
  if (raw === "openai" || raw === "openrouter" || raw === "ollama") {
    return raw;
  }
  throw new Error(`Invalid LLM_PROVIDER: ${raw}`);
}


/**
//when using only openai as LLM provider
import "dotenv/config";

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  openAiApiKey: getOptionalEnv("OPENAI_API_KEY"),
  propertyName: process.env.PROPERTY_NAME ?? "Mohegan Sun"
};
*/