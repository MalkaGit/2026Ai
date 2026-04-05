/**
 * testing the property search tool
 * (file: C:\dev\repos\node\2026Ai\01-casino-property-agent\src\tools\property.search.ts)
 * 
 * ensure it returns the chunks when it finds in the knwolege content that is relevent to the question
 * ensure it returns no chunks when it does not find any relevent chunks in the knowledge content
 */

import { searchPropertyContent } from "../src/tools/property.search.js";
import { embedText, embedTexts } from "../src/tools/embedding.service.js";


import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The file under test is property.search.ts
 * it has import call to 
 * { embedText, embedTexts } from "./embedding.service.js";
 * that calculate the embedding vectors by calling the OpenAI API.
 * 
 * idea: to test the property.search.ts file,
 *       we want property.search.ts to use our fake embedding module
 *       instead of the real embedding module.
 *       meaning, during the test of property.search.ts,
 *       it will not call openAI API to calculate the embedding vectors.
 *       instead, it will use our fake embedding module to calculate the embedding vectors.
    
     Here we declare that during the test execution,
     the calls to import { embedText, embedTexts } from "./embedding.service.js";
    //will be replaced by our fake embedding module
*/

    vi.mock("../src/tools/embedding.service.js", () => ({
      embedText: vi.fn(),
      embedTexts: vi.fn()
    }));

    describe("property search", () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

    it("returns the restaurants section when it is most semantically similar", async () => {
        const propertyContent = `
    # Test Property
    ## Amenities
    - Spa
    - Pool
    ## Restaurants
    - Steakhouse
    - Italian restaurant
    `;

    //step1: mock the embedTexts function
    //       so when the test calls embedTexts, it will return the mock value
    vi.mocked(embedTexts).mockResolvedValue([
          [1, 0], // overview
          [0, 1], // amenities
          [1, 1]  // restaurants
        ]);
    //step2: mock the embedText function
    //       so when the test calls embedText, it will return the mock value
    vi.mocked(embedText).mockResolvedValue([1, 1]);

    //step3: call the searchPropertyContent function
    //       note: when the test calls embedTexts or embedText,
    //       it will return the mock value
    const result = await searchPropertyContent("Where can I eat?", propertyContent);
    
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks[0]).toContain("Restaurants");
    expect(result.citations[0]).toContain("## Restaurants");
  });


  it("returns no chunks when similarity is too low", async () => {
    const propertyContent = `
      # Test Property
      ## Amenities
      - Spa
      - Pool
      `;
    vi.mocked(embedTexts).mockResolvedValue([
          [1, 0],
          [0, 1]
        ]);
    vi.mocked(embedText).mockResolvedValue([-1, -1]);
    const result = await searchPropertyContent("Tell me about ski slopes", propertyContent);
    expect(result.chunks).toEqual([]);
    expect(result.citations).toEqual([]);
  });
});


