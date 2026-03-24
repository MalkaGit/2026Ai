
  /**
   * property.search.ts
   * 
   *  Expose API that 
   * - gets a question and property content (knowledge) 
   * - searches the property content for the most relevant chunks based on the question
   * - returns the chunks and citations (the sections of the property content that were used to answer the question)
   *    -when question is related to the property (knowledge)
   *     it should return chunks and citations 
   *    -when question is not related to the property (knowledge)
   *     it should return no chunks and no citations
   *
   * example:
   *  - question: "What restaurants are there?"
   *  - propertyContent: `
   *    # Test Property
   *    ## Dining
   *    - Restaurant 1
   *    - Restaurant 2
   *    `
   *    result: { 
   *       chunks: ["## Dining", "Restaurant 1", "Restaurant 2"],  
     */
  export interface SearchResult {
    chunks: string[];
    citations: string[];
  }
  export function searchPropertyContent(
    question: string,
    propertyContent: string,
    maxChunks = 3
  ): SearchResult {
    // Step 1: Break the markdown into sections (chunks).
    // Example: "## Dining" and "## Parking" become separate chunks.
    const chunks = splitIntoChunks(propertyContent);

    // Step 2: Break the user's question into simple searchable words.
    // Example: "Is valet parking available?" -> ["valet", "parking", "available"]
    const questionTokens = tokenize(question);

    // Step 3: Give each chunk a score based on how many question words it contains.
    // Higher score = more likely this chunk is relevant.
    const scored = chunks
      .map((chunk) => ({
        chunk,
        score: scoreChunk(questionTokens, chunk)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks);

    // Step 4: If no chunk matches, return empty results.
    if (scored.length === 0) {
      return {
        chunks: [],
        citations: []
      };
    }

    // Step 5: Build citation labels from the first line of each chunk.
    // Usually this is the section heading like "## Dining".
    const citations = scored.map((item) => {
      const firstLine = item.chunk.split("\n")[0]?.trim() ?? "property.md";
      return firstLine;
    });

    // Final: return best matching chunks + their citation labels.
    return {
      chunks: scored.map((item) => item.chunk),
      citations
    };
  }
  

  function normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^\w\s]/g, " ");
  }

  function splitIntoChunks(markdown: string): string[] {
    return markdown
      .split(/\n##\s+/)
      .map((part, index) => (index === 0 ? part.trim() : `## ${part.trim()}`))
      .filter(Boolean);
  }


  function tokenize(text: string): string[] {
    return normalizeText(text)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
  }


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
  


  /*
export interface SearchResult {
    chunks: string[];
  }
  export function searchPropertyContent(_question: string, propertyContent: string): SearchResult {
    return {
      chunks: [propertyContent]
    };
  }
  */