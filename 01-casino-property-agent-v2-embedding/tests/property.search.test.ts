/**
 * testing the property search tool
 * (file: C:\dev\repos\node\2026Ai\01-casino-property-agent\src\tools\property.search.ts)
 * 
 * ensure it returns the chunks when it finds in the knwolege content that is relevent to the question
 * ensure it returns no chunks when it does not find any relevent chunks in the knowledge content
 */
import { describe, it, expect } from "vitest";
import { searchPropertyContent } from "../src/tools/property.search.js";

describe("property search", () => {
  it("finds the amenities section for spa questions", () => {
    const propertyContent = `
# Test Property
## Amenities
- Spa
- Pool
## Restaurants
- Steakhouse
`;
const result = searchPropertyContent("Do you have a spa?", propertyContent);
expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks[0]).toContain("Amenities");
  });
it("returns no chunks when nothing matches", () => {
    const propertyContent = `
# Test Property
## Amenities
- Spa
- Pool
`;
const result = searchPropertyContent("Tell me about ski slopes", propertyContent);
expect(result.chunks).toEqual([]);
    expect(result.citations).toEqual([]);
  });
});
