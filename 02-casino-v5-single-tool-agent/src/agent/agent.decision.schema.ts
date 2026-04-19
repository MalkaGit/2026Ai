import { z } from "zod";
/**
 * agent.decision.schema.ts
 * The schema of the decision that the llm should return.
 * The schema is used to validate the llm result.
 * The schema is defined using zod.
 * The schema includes:
 * - the action to run next
 *   - search_property: search the property file for the information
 *   - answer_directly: answer the question directly
 * - the input to pass to the action
 */
export const AgentDecisionSchema = z.object({
  action: z.enum(["search_property", "answer_directly"]),
  actionInput: z.string().optional()
});

export type AgentDecision = z.infer<typeof AgentDecisionSchema>;