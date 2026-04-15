import { z } from "zod";
/**
 * AgentOutputSchema
 * The agent.prompts.ts defines the format that the llm should return as answer
 * Here, we define its schema using zod
 */
export const AgentOutputSchema  = z.object({
  answer: z.string(),
  citations: z.array(z.string()),
  grounded: z.boolean()
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;