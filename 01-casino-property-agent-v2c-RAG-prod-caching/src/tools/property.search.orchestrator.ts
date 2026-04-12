/**
 * property.search.hybrid.ts
 * Responsibility: orchestration only (implemnting fallback)
 * Short: orchestrates the retrival flow
 *        including fallback logic (property search)
 *        using embedding (default) and keyword search (fallback)
 * It should:
 * call embedding search first
 * inspect result
 * if weak/empty/error → call keyword search
 * return final chosen result
 * This is exactly where fallback belongs.
 *
 */
import { env } from "../config/env.js";
import { type PropertySearchResult } from "./property.search.shared.js";
import { searchPropertyByEmbedding } from "./property.search.embedding.js";
import { searchPropertyByKeyword } from "./property.search.keyword.js";
/**
 * property.search.orchestrator.ts
 * Responsibility: orchestration only (implemnting fallback)
 * Short: orchestrates the retrival flow
 * Usage: called by the agent
 * Strategy:
 * 1. Try embedding retrieval first.
 * 2. If embedding retrieval fails, fallback to keyword retrieval.
 * 3. If embedding retrieval returns no chunks, fallback to keyword retrieval.
 *
 * Later you can extend this to hybrid ranking instead of simple fallback.
 * 
 * Standard:
 * this is a standard pattern in production systems.
   The principle is standard:
	• primary AI retrieval path      (embedding using non-deterministic model)
	• deterministic fallback path    (keyword using deterministic model)
	• graceful degradation instead of hard failure
That pattern appears everywhere in production systems.
 */
export async function searchProperty(
  question: string,
  propertyContent: string,
  maxChunks = env.retrievalTopK
): Promise<PropertySearchResult> {
  let result: PropertySearchResult;
  try {
    //step1: try embedding retrieval
    result = await searchPropertyByEmbedding(
      question,
      propertyContent,
      maxChunks
    );

    if (result.chunks.length > 0) {
      return result;
    }
    
    //step2: if embedding retrieval returns no chunks, fallback to keyword retrieval
    result = await searchPropertyByKeyword(question, propertyContent, maxChunks);
    return result;

  } catch (error) {
    console.warn("Embedding retrieval failed. Falling back to keyword retrieval.", error);
    result = await searchPropertyByKeyword(question, propertyContent, maxChunks);
    return result;
  }
}
