import { z } from "zod";

export interface ChatRequest {
    message: string;
  }


export interface ChatResponse {
    answer: string;
    property: string;
    grounded: boolean;
    citations: string[];
}


export const chatRequestSchema = z.object({
  message: z.string().min(1, "message is required")
});
  