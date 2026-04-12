import { PropertyChunk, PropertySearchResult, splitIntoChunks } from "./property.search.shared.js";

/**
 * property.search.keyword.ts
 * Responsibility: deterministic keyword retrieval only (exact match)
 *                 Useful as fallback when embedding retrieval fails or returns nothing.
* Short:
 * It should 
 * -split chunks
 * -tokenize
 * -score by overlap
 * -return chunks + citations + method=keyword
 *
 *
 * Details:
   * given the user's question, 
   * the method finds the the most relevant sections (chunks) in the knowledge (knowledge\property.md)
   * using  simple keyword-based retrieval (exact match) for now.
   * later on we can use semantic similarity to find the most relevant sections.
   * Steps:
   *   • splits the property markdown into sections by ##
   *   • tokenizes the question
   *   • scores sections by keyword overlap
   *   • returns top matching sections
   * 
   * @param question - the user's question
   * @param propertyContent - knowledge content (content of knowledge\property.md)
   * @param maxChunks - the maximum number of chunks to return (default is 3)
   * @returns best matching sections.
   *          for each sction we get the content and the header (section)
   */
  export function searchPropertyByKeyword(
    question: string,
    propertyContent: string,
    maxChunks = 3
  ): PropertySearchResult {


  const questionTokens = tokenize(question);
  const chunks : PropertyChunk[] = splitIntoChunks(propertyContent);
  const topChacks = chunks 
      .map((chunk) => ({
        chunk,
        score: scoreChunk(questionTokens, chunk.text)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks);


    if (topChacks.length === 0) {
      return {
        chunks: [],
        citations: [],
         retrievalMethod: "keyword"
      };
    }

    return {
      chunks: topChacks.map((item) => item.chunk.text),
      citations: topChacks.map((item) => item.chunk.citation),  //"## Dining", "## Parking", "## Spa", "## Entertainment", "## Promotions", "## Rooms", "## Amenities"
      retrievalMethod: "keyword"
    };
  }




  function tokenize(text: string): string[] {
    return normalizeText(text)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
  }

 
  /**
   * scores a chunk (section) based on how many question words it contains
   * @param questionTokens - the words in the question
   * @param chunk - the chunk (section) to score
   * @returns the number of workds from the question that show in the chunk
   */
  function scoreChunk(questionTokens: string[], chunk: string): number {
    const normalizedChunk = normalizeText(chunk);
  let score = 0; 
  for (const token of questionTokens) {
      if (normalizedChunk.includes(token)) {
        score += 1;
      }
    }
  return score;
  }
  
  function normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^\w\s]/g, " ");
  }


  