import { z } from "zod";

export interface ChatRequest {
    message: string;
  }

/**
 * ChatResponse
 * - answer: the answer to the question
 * - property: the property name
 * - grounded: whether the answer is grounded in the knowledge file
 * - citations: the citations used to answer the question
 */
export interface ChatResponse {
    answer: string;
    property: string;
    grounded: boolean;
    citations: string[];
}


export const chatRequestSchema = z.object({
  message: z.string().min(1, "message is required")
});
  