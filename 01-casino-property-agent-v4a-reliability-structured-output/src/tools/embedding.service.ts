import { OpenAIEmbeddings } from "@langchain/openai";
import { createEmbeddingModel } from "./embedding.factory.js";
import { env } from "../config/env.js";
import { recordEmbeddingCall } from "../infra/observability/metrics/ai.metrics.service.js";

/**
 * Embedding service:
 * • isolates embedding concerns
 * • keeps property.search.ts clean
 * • easy later to replace with other providers
 */
/**
 * Turns text into vectors (lists of numbers) 
 * so we can compare meaning (semantic similarity) not just keywords (exact match).
 *
 * **Plain idea:**
 *  The model maps each piece of text to a point in a high‑dimensional space.
 * Phrases that mean similar things end up close together;
 *  unrelated text ends up farther apart.
 *
 * **Why v2 uses this:** v1 matched the knowledge base with exact or keyword search. That misses
 * rephrasings and synonyms. Embeddings let us ask “which chunks are *about* the same topic as
 * this question?” even when the words differ.
 *
 * **How retrieval uses it (elsewhere):**
 *  We embed small chunks of `src/knowledge/property.md`
 *  and embed the user’s question.
 *  We then rank chunks with **cosine similarity** (how aligned two vectors are):
 *  higher score ≈ more semantically similar.
 *  Callers return the best chunks and their scores to the agent.
 *
 * This file only creates the model and exposes `embedText` / `embedTexts`; 
 * similarity and chunking are in other modules.
 */
let embeddingsClient: OpenAIEmbeddings | null = null;

/**
 * Lazily creates one shared `OpenAIEmbeddings` client for the process 
 * (avoids constructing a new HTTP client on every call).
 */
function getEmbeddingModel(): OpenAIEmbeddings {
  if (!env.openAiApiKey) {
    throw new Error(
      "OPENAI_API_KEY is required for embedding-based retrieval."
    );
  }
  if (!embeddingsClient) {
    embeddingsClient = createEmbeddingModel();
  }
  return embeddingsClient;
}


/**
 * Converts **one piece of text** into **one embedding vector** (an ordered list of numbers).
 *
 * **Do I pass a question or a property chunk?**  
 * Either. This function does not know “question” vs “chunk”—it only sees a string. You pass:
 * - the **user’s question** when you want a vector for what they are asking, or
 * - **one chunk** from `src/knowledge/property.md` when you want a vector for that passage.  
 * Retrieval code embeds **many chunks** (via `embedTexts`) **and** the question (via `embedText`),
 * then compares vectors to find chunks whose meaning is closest to the question.
 *
 * **Example (illustrative):**
 * ```ts
 * const q = await embedText("What time is checkout?");
 * const chunk = await embedText("Guest checkout is at 11am; late checkout may be available.");
 * // `q` and `chunk` are same-length vectors; cosine similarity tells you how alike they are in meaning.
 * ```
 *
 * **How many numbers?**  
 * The length is fixed for a given embedding **model** (set by `OPENAI_EMBEDDING_MODEL`, default
 * `text-embedding-3-small` in `env.ts`). For that default, OpenAI returns **1536** numbers per call.
 * If you switch models, expect a different length—always treat the length as “whatever the API returned”
 * and keep the **same** model for questions and chunks you intend to compare.
 *
 * **What does each number mean?**  
 * Not something you can read like a score for “parking” or “hours.” Each value is one **coordinate**
 * in a high‑dimensional space the model learned during training. **On its own**, a single entry is not
 * human‑meaningful; **together**, the full vector acts like a fingerprint of the text’s meaning so that
 * similar phrasing ends up with similar vectors (measured by cosine similarity or distance).
 */
export async function embedText(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const result =  model.embedQuery(text);
  recordEmbeddingCall();
  return result;
}

/**
 * calculate the embedding vector for each chunk in the given array
 * Order is preserved: result[i] corresponds to `texts[i]`.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();
  const result = model.embedDocuments(texts);
  recordEmbeddingCall(texts.length);
  return result;
}


///
/*





*/