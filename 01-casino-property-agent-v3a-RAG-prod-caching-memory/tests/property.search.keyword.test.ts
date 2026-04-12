/**
 * Tests for property.search.keyword.ts — deterministic keyword overlap on ## sections.
 */

import { searchPropertyByKeyword } from "../src/tools/property.search.keyword.js";
import { describe, it, expect } from "vitest";

describe("property search by keyword", () => {
  it("returns the section whose text overlaps the question tokens most", () => {
    const propertyContent = `
    # Test Property
    ## Amenities
    - Spa
    - Pool
    ## Restaurants
    - Steakhouse
    - Italian restaurant
    `;

    const result = searchPropertyByKeyword(
      "What restaurants are on site?",
      propertyContent
    );

    expect(result.retrievalMethod).toBe("keyword");
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks[0]).toContain("Restaurants");
    expect(result.citations[0]).toContain("## Restaurants");
  });


  
  it("returns no chunks when no question tokens appear in any section", () => {
    const propertyContent = `
      # Test Property
      ## Amenities
      - Spa
      - Pool
      `;

    const result = searchPropertyByKeyword(
      "Tell me about ski slopes",
      propertyContent
    );

    expect(result.retrievalMethod).toBe("keyword");
    expect(result.chunks).toEqual([]);
    expect(result.citations).toEqual([]);
  });
});
