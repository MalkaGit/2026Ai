/**
 * agent.decision.prompts.ts
 * given user question,
 * the agent calls the llm to decide the next action to take.
 * 
 * this prompt file contains the instructions that
 * the agent send to the llm. 
 * 
 * Instructions includes:
 * - the logic that the llm should apply
 *   eg, the llm should decide what 
 *       is the next action that the agent should take:
 *       -search_property: agent shouldcall search_property tool 
 *       - or answer_directly: agent should call anser_directly tool)
 * - the schema of the answer that llm should return
 *   (structured output format)
 * 
 * 	Important note:
 *     For this casino project, 
 *     this agent will still choose search_property most of the time.
 *     That is okay. 
 *     This step is about learning the pattern.
 */



export function buildDecisionPrompt(input: {
    propertyName: string;                                //the property name (kasino name )
    question: string;                                    //the question from the user
  }): string {
    return `
  Property: ${input.propertyName}
  Guest question:
  ${input.question}
  You must decide the next step.
  Choose:
  - "search_property" if the question requires looking up property details from the property knowledge
  - "answer_directly" only if no retrieval is needed and you can safely answer directly within the system rules
  IMPORTANT:
  - Return ONLY valid JSON
  - Do NOT return text outside JSON
  - Do NOT wrap JSON in markdown or code blocks
  Format:
  {
    "action": "search_property" | "answer_directly",
    "actionInput": string
  }
  Rules:
  - For most property questions, prefer "search_property"
  - Use the original question as actionInput unless a shorter search-focused wording is clearly better
  - Never choose an action that performs bookings, reservations, payments, or account operations
  Return only the JSON object.
  `.trim();
  }
  