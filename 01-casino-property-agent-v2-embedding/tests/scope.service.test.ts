/**
 * testing the scope service 
 * (file: C:\dev\repos\node\2026Ai\01-casino-property-agent\src\tools\scope.service.ts)
 * 
 * should return false when question is action request
 * should return false when question is not related to the knowledge property
 * should return true when question is related to the property
 */
import { describe, it, expect } from "vitest";
import { evaluateQuestionScope } from "../src/tools/scope.service.js";

describe("scope service", () => {

    //in scope question
    it("allows property questions", () => {
        const result = evaluateQuestionScope("What restaurants are there?");
    expect(result.isInScope).toBe(true);
        expect(result.rejectionReason).toBeUndefined();
    });
      //polite refucal
    //"answer": "I can answer questions about the property, but I cannot make bookings, reservations, payments, or account changes.",
    it("rejects booking requests", () => {
        const result = evaluateQuestionScope("Book me a room for Friday night");
    expect(result.isInScope).toBe(false);
        expect(result.rejectionReason).toContain("cannot make bookings");
      });

  //out of scope question
    //"answer": "I can only answer questions about the loaded casino property and its amenities, rooms, dining, entertainment, and related guest information.",
    it("rejects unrelated questions", () => {
        const result = evaluateQuestionScope("What is the weather in Boston?");
    expect(result.isInScope).toBe(false);
        expect(result.rejectionReason).toContain("only answer questions about the loaded casino property");
    });
});
