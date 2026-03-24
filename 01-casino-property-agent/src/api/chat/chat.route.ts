/**
 * chat.route.ts
 * Handles the chat API request.
 * Instead having controller, the route acts as the controller, 
 * by calling the agent to answer the question and returning the result.
 * The main orchestration happens in the LangGraph agent,
 * so adding another layer would not add value.”
 */
import { askPropertyAgent } from "../../agent/agent.graph.js";
import { Router } from "express";
import { z } from "zod";
import { ChatRequest, ChatResponse } from "./chat.types.js";

const router = Router();

const chatRequestSchema = z.object({
  message: z.string().min(1, "message is required")
});

router.post("/", async (req, res) => {
  try {
    // Validate request shape before any agent work starts.
    const parsed : ChatRequest = chatRequestSchema.parse(req.body);
    const result : ChatResponse = await askPropertyAgent(parsed.message);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        details: error.issues
      });
    }
    console.error("POST /chat failed", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});
export default router;