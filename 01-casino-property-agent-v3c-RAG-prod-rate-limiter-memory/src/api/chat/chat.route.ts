/**
 * chat.route.ts
 * Handles chat API request.
 * Notes:
 * - the route acts as the controller, by calling the agent
 * - orchestration happens in the LangGraph agent, 
 *   so adding controller would not add value.”
 */
import { askPropertyAgent } from "../../agent/agent.graph.js";
import { Router } from "express";
import { ChatRequest, chatRequestSchema, ChatResponse } from "./chat.types.js";
import { z } from "zod";
import { rateLimitMiddleware } from "../../middleware/rateLimit.middleware.js";


const router = Router();
router.use(rateLimitMiddleware);

router.post("/", async (req, res) => {
  try {
    
    const parsed : ChatRequest = chatRequestSchema.parse(req.body);       //if validation fails, the request is rejected
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