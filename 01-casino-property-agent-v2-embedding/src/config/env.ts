import "dotenv/config";

export type LlmProvider = "openai" | "openrouter" | "ollama";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  propertyName: process.env.PROPERTY_NAME ?? "Mohegan Sun",
  llmProvider: requiredEnumProvider(),

  //embeddings
  //for openai embeddings
  openAiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  retrievalTopK: Number(process.env.RETRIEVAL_TOP_K ?? 3), //the number of chunks to return
  retrievalMinScore: Number(process.env.RETRIEVAL_MIN_SCORE ?? 0.15), //chunks scored below this score will be excluded


  //LLM
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
