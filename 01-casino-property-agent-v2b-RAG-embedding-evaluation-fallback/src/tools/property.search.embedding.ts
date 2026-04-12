/**
 * property.search.embedding.ts
 * Responsibility: semantic retrieval
 * 
 * Short:
 * It should
 * -split chunks      (split the property file into chunks)
 * -embed chunks      (calculate the embedding vector for each chunk)
 * -embed query       (calculate the embedding vector for the question)
 * -cosine similarity (calculate the cosine similarity between the question vector and the chunks vectors)
 * -return chunks + citations + method= embedding + maybe top score
 *
 * Details:
 * given the user's question,
 * we find the most relevant sections for the question using the following steps:
 * 1. Split the markdown (property file) into chunks by `##`
 * 2. "chunks embedding" 
 *    (cacluate the embedding vector for each chunk)
 *    foreach chunck in the property file, 
 *    call api to calculate embedding vector 
 *    and cache it in memory
 *    Note: each embedding involves API call
 *    Note: caching saves us the need to embed the property file for each user question.
 *    whole property file on every user question.
 * 3. "question embedding"
 *    call the embedding api with the user's question
 *    to get he embedding vector for the question
 *   
 * 4. score the chunks
 *    each time we get a question
 *    we need to cacluate the embedding vector of the question,
 *    retrieve the embedding vectors of the property file chunks
 *    and calculate semilatiry between the question and the chunks
 *    by cacluating the cosine similarity between the question vector and the chunks vectors
 *    higher score ≈ more semantically similar.
 * 
 * 5. Drop weak matches (below `RETRIEVAL_MIN_SCORE`), 
 *    sort best-first,
 *    take the top `maxChunks`.
 * 
 * 6. Return the same shape as before: **chunks** (full section text) and **citations** (usually
 *    the section heading line, e.g. `## Dining`, `## Parking`, `## Spa`, `## Entertainment`, `## Promotions`, `## Rooms`, `## Amenities`).
 *
 * **Notes:
 *  1. in-memory only — no vector database, nothing saved to disk.
 *     What stays in memory between requests is only the **property chunks + their embeddings**
 *     (and a hash so we rebuild if the markdown changes).
 *     Each time user asks a question,
 *     we need to embeds the **question** (build embedding vector for the question)
 *     we need to recomputes similarity and ranking;
 * 
 * 2.  If you are new to embeddings**
 * - The embedding model turns a string into a long list of numbers (a **vector**).
 * - Those numbers do not spell out topics in plain English;
 *   together they encode *meaning*.
 * - If two texts are about the same thing (even with different words),
 *   their vectors tend to point in similar directions.
 *   We measure that with **cosine similarity** (see below).
 */

import { env } from "../config/env.js";
import { embedText, embedTexts } from "./embedding.service.js";
import { PropertyChunk, PropertySearchResult, splitIntoChunks } from "./property.search.shared.js";



/** 
 * state:given the property file, 
 * we split it into chunks,
 * calculate the embedding vector for each chunk,
 * we store in cache information about each chunk
 * -cache is rebuilt when the content of the property file has changed. */
let cachedChunks: CachedChunk[] = [];
type CachedChunk = {
  text: string;         // chunk from the property file
  citation: string;     // section header
  embedding: number[];  // vector for that chunk; same kind of vector as `embedText(question)`
};
/**  
 * state: 
 * value of hash over the property file content
 * it allows us to detect if the content has changed.
 */
let cachedPropertyHash: string | null = null;




/**
 * Search / retrieve: 
 * given the user’s question and the full property markdown, 
 * return the most relevant sections
 * using **semantic** similarity (embeddings = embedding vectors),
 *
 * **Parameters**
 * - `question` — what the user asked (any natural phrasing).
 * - `propertyContent` — full contents of `src/knowledge/property.md` (or equivalent string).
 * - `maxChunks` — how many sections to return (default from env, e.g. 3).
 *
 * **Returns**  
 * For each selected section: the **chunk** text and a **citation** string (section header).
 * Empty question ⇒ empty result. If nothing scores above the minimum similarity threshold, empty.
 */
export async function  searchPropertyByEmbedding(
  question: string,
  propertyContent: string,
  maxChunks = env.retrievalTopK
): Promise<PropertySearchResult> {
  const normalizedQuestion = question.trim();
  if (!normalizedQuestion) {
    return {
      chunks: [],
      citations: [],
      retrievalMethod: "embedding",
      topScore: undefined
    };
  }
  //step1: embed the property file chunks if needed
  await EmbedPropertyChunksIfNeeded(propertyContent);
  if (cachedChunks.length === 0) {
    return {
      chunks: [],
      citations: [],
      retrievalMethod: "embedding",
      topScore: undefined
    };
  }

  //step2: embed the question
  const questionEmbedding: number[] = await embedText(normalizedQuestion);
  
  //step3: given the question embeding vector and the cached chunks embeddings,
  //       calculate the cosine similarity between the question vector and the chunks vectors
  //       and take only top matches
  const bestMatches = cachedChunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(questionEmbedding, chunk.embedding)
    }))
    .filter((item) => item.score >= env.retrievalMinScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);

  if (bestMatches.length === 0) {
    return {
      chunks: [],
      citations: [],
      retrievalMethod: "embedding",
      topScore: undefined
    };
  }

  return {
    chunks: bestMatches.map((item) => item.chunk.text),
    citations: bestMatches.map((item) => item.chunk.citation),
    retrievalMethod: "embedding",
    topScore: bestMatches[0]?.score
  };
}



/**
 * Caclulate the (cached embedding vectors) if neeed
 * -flow:
 *    3.3refresh cache: we update the cached chunks
 */
async function EmbedPropertyChunksIfNeeded(propertyContent: string): Promise<void> {
  //step1: calculate the hash over the content of the property file
  const contentHash = calcContentHash(propertyContent);
  //step2: if the hash did not change, return \
  //       (property file did not change, no need to calculate the embedding vectors of the file)
  if (cachedPropertyHash === contentHash && cachedChunks.length > 0) {
    return;
  }
  //step3.1: split the file content to chunks
  const rawChunks: PropertyChunk[] = splitIntoChunks(propertyContent);
  if (rawChunks.length === 0) { 
    cachedPropertyHash = contentHash;
    cachedChunks = [];
    return;
  }

  //step3.2: calculate the embedding vector for each chunk
  const embeddings: number[][]= await embedTexts(rawChunks.map((chunk) => chunk.text));

  //step3.3: update the cache
  cachedChunks = rawChunks.map((chunk, index) => ({
    text: chunk.text,
    citation:  chunk.citation,
    embedding: embeddings[index]
  }));
  cachedPropertyHash = contentHash;
}

/**
 *  calculate hash of the markdown string (content of the property file)
 *  used to decide “did the property file change?” for cache invalidation.
 */
function calcContentHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash);
}

/**
 * Split markdown into sections using `##` headings.
 * First segment may be preamble before the first `##`; others get `## ` prepended so headings stay in the chunk.
 * Allows indentation before `##` (e.g. template strings with leading spaces on heading lines).

function splitIntoChunks(markdown: string): string[] {
  return markdown
    .split(/\n\s*##\s+/)
    .map((part, index) => (index === 0 ? part.trim() : `## ${part.trim()}`))
    .filter(Boolean);
}
*/




/**
 * **Cosine similarity** — 
 * given two embedding vectors (represnting two texts),
 * calculate the cosine similarity between the two vectors.
 * the cosine similarity measures how much two vectors 
 * “point the same way.”
 * - Range **-1 to 1** for general vectors;
 *  embedding vectors from this stack are often **0 to 1**
 *   in practice for related text.
 * - **1** = same direction (very alike in the model’s sense);
 *  **0** = unrelated; **negative** = opposite.
 * - Formula: dot product of the two vectors divided by the product of their lengths (norms).
 *   If lengths are zero, we return **-1** (invalid / ignore).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return -1;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

