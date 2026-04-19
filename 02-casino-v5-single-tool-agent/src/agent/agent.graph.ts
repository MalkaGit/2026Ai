/**
 * LangGraph definition for the single-property casino agent.
 *
 * What this small graph is meant to illustrate:
 * - The model proposes the next step (here: retrieve context vs answer without retrieval).
 * - That proposal is structured output, parsed and validated (Zod).
 * - Routing is explicit graph edges keyed off the validated decision.
 * - Nodes perform I/O (retrieval, LLM calls); the graph wires order and branching.
 *
 * The same shape scales to multiple tools, longer plans, retries, and session memory.
 *
 * End-to-end flow (nodes):
 *
 * 1. scopeCheck — Decide whether the user question is allowed (property Q&A only;
 *    reject bookings, payments, and off-topic asks). Routes to decideAction or reject.
 *
 * 2. decideAction — LLM returns `action` + `actionInput`:
 *    - search_property → retrieveContext, then answerQuestion.
 *    - answer_directly → answerQuestion only (skips retrieval).
 *    Malformed or failed parses default to search_property with the original question.
 *
 * 3. retrieveContext — Embedding similarity over the property markdown, with keyword
 *    fallback. Fills `retrievedChunks` / `citations` (e.g. locate a "Restaurants"
 *    section for dining questions). Uses `actionInput` so the model can lightly
 *    rewrite the query for search.
 *
 * 4. answerQuestion — Final LLM pass: grounded answer from chunks when retrieval ran;
 *    handles empty context, missing API keys, and parse errors with safe fallbacks.
 *
 * Edges: START → scopeCheck → (decideAction | reject) → … → END;
 * reject ends with a short, non-grounded refusal message.
 *
 * Limitations: single property file (no multi-property); no conversational memory
 * beyond this invocation (additional sources/memory can be added later).
 */
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";
import { loadPropertyMarkdown } from "../tools/property.loader.js";
import { searchProperty } from "../tools/property.search.orchestrator.js";
import { buildAnswerPrompt, SYSTEM_RULES } from "./agent.answer.prompts.js";
import type { AgentState } from "./agent.state.js";
import type { ChatResponse } from "../api/chat/chat.types.js";
import { evaluateQuestionScope } from "../tools/scope.service.js";
import { AIMessageChunk } from "@langchain/core/messages";
import { createChatModel } from "../tools/llm.factory.js";
import { traceAgentStart, traceAgentRetrieval, traceAgentNoContext, traceAgentFinish, traceAgentFailure, traceCacheHit, traceCacheMiss, traceCacheSet } from "../infra/logging/ai.logger.js";
import { getCachedChatResponse, setCachedChatResponse } from "../infra/caching/chache.chat.in-memory.js";
import { recordAiRequestFailed, recordAiRequestLatency, recordAiRequestSucceeded, recordEmptyRetrieval, recordLlmCall, recordLlmError } from "../infra/observability/metrics/ai.metrics.service.js";
import { logError, logInfo } from "../infra/logging/logger.js";
import { parseAndValidate } from "../infra/validation/schema.validation.zod.js";
import { AgentOutputSchema } from "./agent.output.schema.js";
import { AgentDecisionSchema } from "./agent.decision.schema.js";
import { buildDecisionPrompt } from "./agent.decision.prompts.js";

/** Compiled graph: linear where possible, branches on scope and LLM decision. */
const propertyGraph = buildGraph();

/**
 * Builds the StateGraph channels and wiring.
 *
 * Routing summary:
 * - scopeCheck → decideAction if in scope, else reject → END.
 * - decideAction → retrieveContext when action is search_property, else answerQuestion.
 * - retrieveContext always flows to answerQuestion; answerQuestion and reject → END.
 */
function buildGraph() {
  return new StateGraph<AgentState>({
    channels: {
      /** User question for this run. */
      question: null,
      /** Display name of the loaded property (from config). */
      propertyName: null,
      /** Full markdown body loaded once per `askPropertyAgent` invocation. */
      propertyContent: null,
      /** Set by scopeCheck: whether the question may proceed. */
      isInScope: null,
      /** Human-readable reason when out of scope (shown on reject path). */
      rejectionReason: null,
      /** decideAction: search_property | answer_directly. */
      action: null,
      /** Optional query rewrite for retrieval / answering (defaults to question). */
      actionInput: null,
      /** retrieveContext: text slices returned by search. */
      retrievedChunks: null,
      /** retrieveContext: source references for grounding. */
      citations: null,
      /** answerQuestion / reject: final natural-language reply. */
      answer: null,
      /** Whether the answer is claimed grounded in retrieved material. */
      grounded: null
    }
  })
    .addNode("scopeCheck", scopeCheckNode)
    .addNode("decideAction", decideActionNode)
    .addNode("retrieveContext", retrieveContextNode)
    .addNode("answerQuestion", answerQuestionNode)
    .addNode("reject", rejectNode)
    .addEdge(START, "scopeCheck")
    .addConditionalEdges("scopeCheck", routeAfterScope, {
      decideAction: "decideAction",
      reject: "reject"
    })
    .addConditionalEdges("decideAction", routeAfterDecision, {
      retrieveContext: "retrieveContext",
      answerQuestion: "answerQuestion"
    })
    .addEdge("retrieveContext", "answerQuestion")
    .addEdge("answerQuestion", END)
    .addEdge("reject", END)
    .compile();
}

function routeAfterScope(state: AgentState): string {
  // In scope → structured decision node; out of scope → refusal without LLM routing.
  return state.isInScope ? "decideAction" : "reject";
}


function routeAfterDecision(state: AgentState): string {
  return state.action === "search_property"
    ? "retrieveContext"
    : "answerQuestion";
}


//main function to ask the agent a question
export async function askPropertyAgent(question: string): Promise<ChatResponse> {
  const startedAt = Date.now();
  try {
    // STEP 1 — try to get the answer from the cache
    const propertyName = env.propertyName;
    const cached = getCachedChatResponse(question, propertyName);
    if (cached) {
        traceCacheHit(question);
        recordAiRequestSucceeded();
        recordAiRequestLatency(Date.now() - startedAt);    
        return cached;
    }

    // STEP 2 — if not found in the cache, generate the answer using the pipeline
    traceCacheMiss(question); //ovservability: cache miss
    const propertyContent = loadPropertyMarkdown();
    traceAgentStart({                                            //ovservability: start of the agent
       question,
       propertyName: propertyName
    });
    const initialState: AgentState = {
      question,
      propertyName: env.propertyName,
      propertyContent,
      isInScope: false,
      rejectionReason: undefined,
      retrievedChunks: [],
      citations: [],
      answer: "",
      grounded: false
    };
    const finalState : Partial<AgentState> = await propertyGraph.invoke(initialState);
    //console.log("result", finalState);
    const chatResponse: ChatResponse = {
      answer: finalState.answer ?? "",
      property: env.propertyName,
      grounded: finalState.grounded ?? false,
      citations: finalState.citations ?? []
    };

    //STEP 2 — store in cache (only if grounded)
    if (chatResponse.grounded && chatResponse.answer.length > 0) {
      setCachedChatResponse(question, propertyName, chatResponse);
      traceCacheSet(question);
    }


    traceAgentFinish({                                 //ovservability: finish of the agent
      question,
      grounded: chatResponse.grounded,
      citations: chatResponse.citations,
      answerLength: chatResponse.answer.length,
      durationMs: Date.now() - startedAt
    });
    recordAiRequestSucceeded();
    recordAiRequestLatency(Date.now() - startedAt);
  return chatResponse;
}
catch (error) {
  traceAgentFailure({
    question: question,
    durationMs: Date.now() - startedAt,
    error
  });
  recordAiRequestFailed();
  recordAiRequestLatency(Date.now() - startedAt);
  throw error;
}
}



async function scopeCheckNode(state: AgentState): Promise<Partial<AgentState>> {
  const scopeResult = evaluateQuestionScope(state.question);
return {
    isInScope: scopeResult.isInScope,
    rejectionReason: scopeResult.rejectionReason
  };
}




/**
 * call llm to decide the next action to take (search_property or answer_directly),
 * validates & parse the llm json response to get the action and actionInput.
*  On error, default to search_property action.
 * @param state 
 * @returns: the action      - the action that the agent should run 
 *           the actionInput - the question that the agent should pass to the tool  (lets the LLM slightly rewire the user's question if useful)
 */
async function decideActionNode(state: AgentState): Promise<Partial<AgentState>> {
  const model = createChatModel();
  if (!model) {
    return {
      action: "search_property",
      actionInput: state.question
    };
  }

  const prompt = buildDecisionPrompt({
    propertyName: state.propertyName,
    question: state.question
  });

  //calling llm (withthe model and the prompt)
  //to decide the next action to take (search_property or answer_directly)
  try {
      const rawDecisionText = await callLLM(model, SYSTEM_RULES, prompt);
      const validationResult = parseAndValidate(
        rawDecisionText,
        AgentDecisionSchema
      );
      if (!validationResult.success || !validationResult.data) {
        logError("Failed to parse structured llm response for decideAction node. Defaulting to search_property action.", { error: validationResult.error });
        return {
          action: "search_property",
          actionInput: state.question
        };
      }
      return {
        action: validationResult.data.action,
        actionInput: validationResult.data.actionInput ?? state.question
      };
  } catch (error) {
      logError("Failed to decide the next action to take. Defaulting to search_property action.", { error });
      return {
        action: "search_property",
       actionInput: state.question
      };
  }
}


async function rejectNode(state: AgentState): Promise<Partial<AgentState>> {
  return {
    answer:
      state.rejectionReason ??
      "I can only answer questions about the loaded casino property.",
    grounded: false,
    citations: []
  };
}
/**
 * call searchProperty tool to retrieve context from the property file
 * Note: instead of sending searchProperty the user's question, state.question, 
 * we send the actionInput that the llm returned on the decideAction node (llm may slightly rewire the user's question if useful)
 * @param state: the agent state
 * @returns 
 */
async function retrieveContextNode(state: AgentState): Promise<Partial<AgentState>> {
  //const result = await searchProperty(state.question, state.propertyContent);

  const searchQuestion = state.actionInput ?? state.question; 
  const result = await searchProperty(searchQuestion, state.propertyContent);
  console.log("retrieval method:", result.retrievalMethod, "topScore:", result.topScore);
  traceAgentRetrieval({
    question: state.question,
    retrievalMethod: result.retrievalMethod,
    topScore: result.topScore,
    citations: result.citations,
    retrievedChunkCount: result.chunks.length
  });

return {
    retrievedChunks: result.chunks,
    citations: result.citations
  };
}

/**
 * called if decion is answer_directly
 * if decision is search_property, 
 * the search property tool is called in the retrieveContext node
 * and then this method is called
 * if decision is answer_directly, 
 * this method is called directly
 * without calling the search property tool
 * @param state 
 * @returns 
 */
async function answerQuestionNode(state: AgentState): Promise<Partial<AgentState>> {
  const fallbackAnswer = "I do not know based on the provided property information.";

  //case1: couldnt find relevant information in the knowledge file
  if (state.retrievedChunks.length === 0) {
    traceAgentNoContext(state.question);
    recordEmptyRetrieval();
    return {
      answer: fallbackAnswer,
      grounded: false,
      citations: []
    };
  }


  //case2: couldnt create llm model by configuration (eg, invalid .evv file)
  const model = createChatModel();
  if (!model) {
    return {
      answer: buildFallbackAnswerWithoutLLM(state),
      grounded: state.retrievedChunks.length > 0,
      citations: []
    };
  }

  //case3: call llm api to generate answer based on context retrieved from the knowledge file
  const systemRules: string = SYSTEM_RULES;
  const prompt: string = buildAnswerPrompt({
    propertyName: state.propertyName,
    question: state.question,
    contextChunks: state.retrievedChunks
  });

  try {
  const structuredLlmResponseAsText: string = await callLLM(model, systemRules, prompt);
  logInfo("Structured llm response:", { structuredLlmResponseAsText });
  const validationResult = parseAndValidate(structuredLlmResponseAsText, AgentOutputSchema);
  if (!validationResult.success) {
    logError("Failed to parse structured llm response", { error: validationResult.error });
  }
  return {
    answer: validationResult.data?.answer ?? fallbackAnswer,
    grounded: validationResult.data?.grounded ?? false,
    citations: validationResult.data?.citations ?? []
  };
}
catch (error) {
  return {
    answer:  fallbackAnswer,
    grounded: false,
    citations: []
  };
}  //return parseStructuredLlmResponse(structuredLlmResponseAsText, fallbackAnswer);
}


/**
 * call llm api 
 * - to decide the next action to take (search_property or answer_directly)
 * - to generate answer based on context retrieved from the knowledge file
 * @param model:       the model to call llm api
 * @param systemRules: the system rules to send to llm
 * @param prompt:      the prompt to send to llm
 * @returns:           the answer generated by llm
 */
async function callLLM(
  model:  ReturnType<typeof createChatModel>,
  systemRules: string,
  prompt: string
): Promise<string> {
  recordLlmCall(); // count attempt BEFORE call

  try 
  {
    const response: AIMessageChunk = await model!.invoke([
      {
        role: "system",
        content: systemRules
      },
      {
        role: "user",
        content: prompt
      }
    ]);

    if (typeof response.content === "string") {
      return response.content.trim();
    }

    if (Array.isArray(response.content)) {
      return response.content
        .map((part) => ("text" in part ? part.text : ""))
        .join("")
        .trim();
    }

    return "";
  } catch (error) {
    recordLlmError(); // only on failure
    throw error;
}
}





function buildFallbackAnswerWithoutLLM(state: AgentState): string {
  //when LLM api key is not set in the environment variables
  //we return a fallback answer (the first chunck that we found in the property file using token search)
  //returns no answer when the api key is not set in the environment variables
  if (state.retrievedChunks.length === 0) {
    return "I do not know based on the provided property information.";
  }

  const firstChunk = state.retrievedChunks[0];

  return `API key is missing. Based on the property information:\n\n${firstChunk.slice(0, 300)}...`;
}









/*
import { env } from "../config/env.js";
import { loadPropertyMarkdown } from "../services/property.loader.js";
import { searchPropertyContent } from "../services/property.search.js";
import type { ChatResponse } from "../types/api.types.js";
export async function askPropertyAgent(question: string): Promise<ChatResponse> {
  // Load the canonical property knowledge source (markdown file).
  const propertyContent = loadPropertyMarkdown();
  // Retrieve relevant chunks so response can indicate grounding.
  const searchResult = searchPropertyContent(question, propertyContent);
  return {
    answer: `Temporary response. The agent received your question: "${question}".`,
    property: env.propertyName,
    grounded: searchResult.chunks.length > 0,
    citations: ["property.md"]
  };
}
*/