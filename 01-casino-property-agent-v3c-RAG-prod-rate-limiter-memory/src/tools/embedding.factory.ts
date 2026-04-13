import { OpenAIEmbeddings } from "@langchain/openai";
import { env } from "../config/env.js";


export function createEmbeddingModel(): OpenAIEmbeddings {
    if (!env.openAiApiKey) {
      throw new Error(
        "OPENAI_API_KEY is required for embedding-based retrieval."
      );
    }
    const embeddingsClient = new OpenAIEmbeddings({
        apiKey: env.openAiApiKey,
        model: env.openAiEmbeddingModel
      });
    
    return embeddingsClient;
  }
  