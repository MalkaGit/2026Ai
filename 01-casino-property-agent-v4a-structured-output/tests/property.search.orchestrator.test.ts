/**
 * property.search.orchestrator.ts 
 * tests the orchestrator logic (fallback to keyword if embedding fails)
 *
 * mocks property.search.embedding.ts
 * mocks property.search.keyword.ts
 * 
 * Why mocking is correct here ?
   Because this file is testing:
	• routing
	• fallback decision
	• orchestration
Not:
	• cosine similarity (used only for embedding)
	• embedding API 
	• keyword ranking (used only for keyword)
Those belong in separate tests.



 * Test cases:
 * Test 1
 * If embedding returns real chunks:
	• use embedding result
	• do not call keyword fallback
    Test 2
 * If embedding returns empty:
	• call keyword fallback
	• return keyword result
    Test 3
 * If embedding throws:
	• call keyword fallback
	• return keyword result 

  * Test 4
  If later you add logic like:
	• fallback when topScore < threshold
then you should add a 4th test:
	• embedding returns chunks
	• but score too low
	• manager still falls back to keyword
Right now, your current manager logic does not do that yet.

 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchProperty } from "../src/tools/property.search.orchestrator.js";
import type { PropertySearchResult } from "../src/tools/property.search.shared.js";
import { searchPropertyByEmbedding } from "../src/tools/property.search.embedding.js";
import { searchPropertyByKeyword } from "../src/tools/property.search.keyword.js";

// Mock the retrievers that the manager orchestrates.
vi.mock("../src/tools/property.search.embedding.js", () => ({
  searchPropertyContentByEmbedding: vi.fn()
}));
vi.mock("../src/tools/property.search.keyword.js", () => ({
  searchPropertyContentByKeyword: vi.fn()
}));



describe("property.search.manager", () => {
  const propertyContent = `
# Test Property
## Restaurants
- Steakhouse
## Amenities
- Spa
`;
beforeEach(() => {
    vi.clearAllMocks();
  });



  //step1: mock the searchPropertyByEmbedding function
  //       so when the test calls searchPropertyByEmbedding, it will return the mock value
it("returns embedding result when embedding retrieval succeeds with chunks", async () => {
    const embeddingResult: PropertySearchResult = {
      chunks: ["## Restaurants\n- Steakhouse"],
      citations: ["## Restaurants"],
      retrievalMethod: "embedding",
      topScore: 0.82
    };
vi.mocked(searchPropertyByEmbedding).mockResolvedValue(embeddingResult);

//step2: call the searchProperty function (the tested method)
//       note: when the test calls searchPropertyByEmbedding,
//       it will return the mock value
const result = await searchProperty(
      "Where can I eat?",
      propertyContent,
      3
    );
expect(searchPropertyByEmbedding).toHaveBeenCalledTimes(1);
    expect(searchPropertyByEmbedding).toHaveBeenCalledWith(
      "Where can I eat?",
      propertyContent,
      3
    );
expect(searchPropertyByKeyword).not.toHaveBeenCalled();
expect(result).toEqual(embeddingResult);
  });






it("falls back to keyword retrieval when embedding retrieval returns no chunks", async () => {
    //step1: mock the searchPropertyByEmbedding function
    //       so when the test calls searchPropertyByEmbedding, it will return the mock value
    const emptyEmbeddingResult: PropertySearchResult = {
      chunks: [],
      citations: [],
      retrievalMethod: "embedding",
      topScore: undefined
    };
    vi.mocked(searchPropertyByEmbedding).mockResolvedValue(emptyEmbeddingResult);
    //step2: mock the searchPropertyByKeyword function
    //       so when the test calls searchPropertyByKeyword, it will return the mock value
    const keywordResult: PropertySearchResult = {
        chunks: ["## Restaurants\n- Steakhouse"],
        citations: ["## Restaurants"],
        retrievalMethod: "keyword"
      };
    vi.mocked(searchPropertyByKeyword).mockReturnValue(keywordResult);

    //step3: call the searchProperty function (the tested method)
    //       note: when the test calls searchPropertyByEmbedding,
    //       it will return the mock value
    const result = await searchProperty(
      "Where can I eat?",
      propertyContent,
      3
    );
    expect(searchPropertyByEmbedding).toHaveBeenCalledTimes(1);
    expect(searchPropertyByKeyword).toHaveBeenCalledTimes(1);
    expect(searchPropertyByKeyword).toHaveBeenCalledWith(
      "Where can I eat?",
      propertyContent,
      3
    );
    expect(result).toEqual(keywordResult);
  });



  //step1: mock the searchPropertyByEmbedding function
it("falls back to keyword retrieval when embedding retrieval throws", async () => {
  
    //step1: mock the searchPropertyByEmbedding function
    //       so when the test calls searchPropertyByEmbedding, it will return the mock value
    vi.mocked(searchPropertyByEmbedding).mockRejectedValue(
      new Error("Embedding API failed")
    );

    //step2: mock the searchPropertyByKeyword function
    //       so when the test calls searchPropertyByKeyword, it will return the mock value
    const keywordResult: PropertySearchResult = {
      chunks: ["## Amenities\n- Spa"],
      citations: ["## Amenities"],
      retrievalMethod: "keyword"
    };
    vi.mocked(searchPropertyByKeyword).mockReturnValue(keywordResult);

    //step3: mock the console.warn function
    //       so when the test calls console.warn, it will return the mock value
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    //step3: call the searchProperty function (the tested method)
    //       note: when the test calls searchPropertyByEmbedding,
    //       it will return the mock value
    const result = await searchProperty(
      "Is there a spa?",
      propertyContent,
      2
    );
    expect(searchPropertyByEmbedding).toHaveBeenCalledTimes(1);
    expect(searchPropertyByKeyword).toHaveBeenCalledTimes(1);
    expect(searchPropertyByKeyword).toHaveBeenCalledWith(
      "Is there a spa?",
      propertyContent,
      2
    );
    expect(result).toEqual(keywordResult);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
