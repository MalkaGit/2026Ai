  /**
   * use text seatch to find the most relevant sections (chunks) in the knowledge content (knowledge\property.md)
   * @param question - the user's question
   * @param propertyContent - knowledge content (content of knowledge\property.md)
   * @param maxChunks - the maximum number of chunks to return (default is 3)
   * @returns best matching sections.
   *          for each sction we get the content and the header (section)
   */
  export function searchPropertyContent(
    question: string,
    propertyContent: string,
    maxChunks = 3
  ): SearchResult {
 
  const questionTokens = tokenize(question);
  const chunks = splitIntoChunks(propertyContent);
  const topChacks = chunks 
      .map((chunk) => ({
        chunk,
        score: scoreChunk(questionTokens, chunk)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks);


    if (topChacks.length === 0) {
      return {
        chunks: [],
        citations: []
      };
    }

    const citations = topChacks.map((item) => {
      const firstLine = item.chunk.split("\n")[0]?.trim() ?? "property.md";
      return firstLine;
    });


    return {
      chunks: topChacks.map((item) => item.chunk),
      citations  //"## Dining", "## Parking", "## Spa", "## Entertainment", "## Promotions", "## Rooms", "## Amenities"
    };
  }

  export interface SearchResult {
    chunks: string[];    
    citations: string[]; 
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


  function normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^\w\s]/g, " ");
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
  