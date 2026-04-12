/**
 * property.search.shared.ts
 * Hodls types and functions reused by searchPropertyByKeyword and searchPropertyByEmbedding
 */

/**
 * Result of a property search
 * usage: searchPropertyByKeyword and searchPropertyByEmbedding
 */
export interface PropertySearchResult {
  chunks: string[];
  citations: string[];
  retrievalMethod: "embedding" | "keyword";
  topScore?: number;
}


/**
 * Split markdown (property file) into chunks sections based on "##".
 * for each chunk we keep both the text and the citation style, e.g. "## Restaurants".
 * usage: searchPropertyByKeyword and searchPropertyByEmbedding
 */
export function splitIntoChunks(markdown: string): PropertyChunk[] {
  return markdown
    .split(/\n\s*##\s+/)
    .map((part, index) => (index === 0 ? part.trim() : `## ${part.trim()}`))
    .filter(Boolean)
    .map((text) => ({
      text,
      citation: extractCitation(text)
    }));
}
/**
 * holds chunk information (text and citation, eg Resturants)
 */
export interface PropertyChunk {
  text: string;
  citation: string;
}
/**
 * Use first line as citation.
 * eg: ## Dining
 */
function extractCitation(chunkText: string): string {
  return chunkText.split("\n")[0]?.trim() ?? "property.md";
}


/*
 function splitIntoChunks(markdown: string): string[] {
    return markdown
      .split(/\n##\s+/)
      .map((part, index) => (index === 0 ? part.trim() : `## ${part.trim()}`))
      .filter(Boolean);
  }

*/




/**
 * Small content hash for cache invalidation.
 * Good enough for the assignment scope.
 
export function buildContentHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash);
}
*/

/**
 * Normalize free text for keyword matching.
 
export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, " ");
}
*/

/**
 * Tokenize free text for keyword matching.
export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}
*/

/**
 * Cosine similarity between two vectors.
 * Higher score means more semantic similarity.
 
export function cosineSimilarity(a: number[], b: number[]): number {
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
*/