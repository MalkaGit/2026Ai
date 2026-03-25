/**
 * agent.graph.ts
 * Orchestrates the agent's behavior using LangGraph.
 */
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";
import { loadPropertyMarkdown } from "../tools/property.loader.js";
import { searchPropertyContent } from "../tools/property.search.js";
import { buildAnswerPrompt, SYSTEM_RULES } from "./agent.prompts.js";
import type { AgentState } from "../agent/agent.state.js";
import type { ChatResponse } from "../api/chat/chat.types.js";
import { evaluateQuestionScope } from "../tools/scope.service.js";


export async function askPropertyAgent(question: string): Promise<ChatResponse> {
  console.log("USING agent.graph.ts", { question });
  const propertyContent = loadPropertyMarkdown();
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
  const result : Partial<AgentState> = await propertyGraph.invoke(initialState);
  console.log("result", result);
  const chatResponse: ChatResponse = {
    answer: result.answer ?? "",
    property: env.propertyName,
    grounded: result.grounded ?? false,
    citations: result.citations ?? []
  };
  return chatResponse;
}


const propertyGraph = buildGraph();

function buildGraph() {
  return new StateGraph<AgentState>({
    channels: {
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


async function answerQuestionNode(state: AgentState): Promise<Partial<AgentState>> {
 
  //if (!env.openAiApiKey) {
  //  throw new Error("OPENAI_API_KEY is required to generate answers.");
  //}

  //if the OPENAI_API_KEY is not set, use a fallback answer
  if (!env.openAiApiKey) {
    return {
      answer: buildFallbackAnswer(state),
      grounded: state.retrievedChunks.length > 0
    };
  }


  if (state.retrievedChunks.length === 0) {
    return {
      answer:
        "I do not know based on the provided property information.",
      grounded: false
    };
  }
  //creating instance if the LLM model (this case we are using the OpenAI API)
  const model = new ChatOpenAI({
    apiKey: env.openAiApiKey,
    model: "gpt-4o-mini",
    temperature: 0
  });
  const prompt: string = buildAnswerPrompt({
    propertyName: state.propertyName,
    question: state.question,
    contextChunks: state.retrievedChunks
  });
const response = await model.invoke([
    {
      role: "system",
      content: SYSTEM_RULES
    },
    {
      role: "user",
      content: prompt
    }
  ]);
const answerText =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content
            .map((item) => ("text" in item ? item.text : ""))
            .join("")
        : "I do not know based on the provided property information.";
return {
    answer: answerText.trim(),
    grounded: true
  };
}


function buildFallbackAnswer(state: AgentState): string {
  //returns no answer when the api key is not set in the environment variables
  if (state.retrievedChunks.length === 0) {
    return "I do not know based on the provided property information.";
  }

  // Very simple fallback: return first chunk summary
  const firstChunk = state.retrievedChunks[0];

  return `Based on the property information:\n\n${firstChunk.slice(0, 300)}...`;
}

async function scopeCheckNode(state: AgentState): Promise<Partial<AgentState>> {
  const scopeResult = evaluateQuestionScope(state.question);
return {
    isInScope: scopeResult.isInScope,
    rejectionReason: scopeResult.rejectionReason
  };
}



async function retrieveContextNode(state: AgentState): Promise<Partial<AgentState>> {
  const result = searchPropertyContent(state.question, state.propertyContent);
return {
    retrievedChunks: result.chunks,
    citations: result.citations
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