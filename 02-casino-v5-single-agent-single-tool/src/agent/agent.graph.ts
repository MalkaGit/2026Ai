/**
 * agent.graph.ts
 * business flow only
 * Generates answer to a given question based on the property knowledge.
 * agent steps (steps are implemented as graph nodes using langraph):
 *      1. scopeCheck:       determines if the question is allowed
 * *                        - request for actions is rejected (no booking, reservations, payments)
 *                          - request for unrelated questions is rejected
 *      2. reject            (optional)
 *      3. retrieve Context:  search sections within the property knowledge that are relevent to the question
 *                           for now, using exact match.
 *                                    eg, it can answer "what restaurants are there?" by finding the "Restaurants" section in the property file.
 *                                    but it cannot answer "where can i eat around the  casino ?" because the "there is no eat keyworkd in the property file"
 *                                    chunk rank is the number of tokens from the question that are found in the chunk)
 *                           later on, we can use similarity search to find the most relevant chunks
 *                                     eg, eat and restaurant are similar, but eat and weather are not
 *                           later on, we can use embedding search (2 words are semialr if their vector distance is small)   
 *      4. LLM               pass the LLM the chunks that we found, to generate answers based on it 
 * - Limitations:
 * - knowledge is limited to a single property knowledge file (property.md)
 *   no multi-property support
 *   later on we can ingest knowledge from other files and sources.
 * - no conversation memory 
 */
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";
import { loadPropertyMarkdown } from "../tools/property.loader.js";
import { searchProperty } from "../tools/property.search.orchestrator.js";
import { buildAnswerPrompt, SYSTEM_RULES } from "./agent.prompts.js";
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

//defining the agent flow chart as a pipe using langraph
const propertyGraph = buildGraph();
function buildGraph() {
  return new StateGraph<AgentState>({
    channels: {
      //the agent state is passed between nodes as a dictionary of values
      question: null,
      propertyName: null,
      propertyContent: null,
      isInScope: null,
      rejectionReason: null,
      retrievedChunks: null,
      citations: null,
      answer: null,
      grounded: null
    }
  })
    .addNode("scopeCheck", scopeCheckNode)
    .addNode("retrieveContext", retrieveContextNode)
    .addNode("answerQuestion", answerQuestionNode)
    .addNode("reject", rejectNode)
    .addEdge(START, "scopeCheck")
    .addConditionalEdges("scopeCheck", routeAfterScope, {
      retrieveContext: "retrieveContext",
      reject: "reject"
    })
    .addEdge("retrieveContext", "answerQuestion")
    .addEdge("answerQuestion", END)
    .addEdge("reject", END)
    .compile();
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

function routeAfterScope(state: AgentState): string {
  return state.isInScope ? "retrieveContext" : "reject";
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

async function retrieveContextNode(state: AgentState): Promise<Partial<AgentState>> {
  const result = await searchProperty(state.question, state.propertyContent);
  //console.log("retrieval method:", result.retrievalMethod, "topScore:", result.topScore);
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

async function answerQuestionNode(state: AgentState): Promise<Partial<AgentState>> {
  const fallbackAnswer = "I do not know based on the provided property information.";

  //case1: couldnt find relevant information in the knowledge file
  if (state.retrievedChunks.length === 0) {
    traceAgentNoContext(state.question);
    recordEmptyRetrieval();
    return {
      answer: fallbackAnswer,
      grounded: false
    };
  }


  //case2: couldnt create llm model by configuration (eg, invalid .evv file)
  const model = createChatModel();
  if (!model) {
    return {
      answer: buildFallbackAnswerWithoutLLM(state),
      grounded: state.retrievedChunks.length > 0
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
    grounded: validationResult.data?.grounded ?? false
  };
}
catch (error) {
  return {
    answer:  fallbackAnswer,
    grounded: false
  };
}  //return parseStructuredLlmResponse(structuredLlmResponseAsText, fallbackAnswer);
}



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



function parseStructuredLlmResponse(
  structuredLlmResponseAsText: string,
  fallbackAnswer: string
): Partial<AgentState> {
  try {
    const parsed = JSON.parse(structuredLlmResponseAsText) as {
      //using the format defined in the agent prompt as the llm response schema
      answer?: unknown;
      citations?: unknown;
      grounded?: unknown;

    };
    const result: Partial<AgentState> = 
    {
      answer:
        typeof parsed.answer === "string" && parsed.answer.trim().length > 0
          ? parsed.answer.trim()
          : fallbackAnswer,
      grounded:
        typeof parsed.grounded === "boolean"
          ? parsed.grounded
          : false
    };

    return result;
  } catch (error) {
    logError("Failed to parse structured llm response", { error });
    throw error;
    return {
      answer: fallbackAnswer,
      grounded: false
    };
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