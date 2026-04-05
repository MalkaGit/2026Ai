/**
 * llm.factory.ts
 * provides a provider-agnostic way to create llm models.
 * we can switch providers through env config  (OpenAI, OpenRouter, or Ollama)
 * without changing code:
 * - agent is provider-agnostic
 * - tools are provider-agnostic
 * 
 * Supported providers:
 * OpenAI.                                             (LangChain Docs: https://docs.langchain.com/oss/javascript/integrations/chat/openai?utm_source=chatgpt.com)
 * - not free of charge
 * OpenRouter
 * - base URL because OpenRouter is OpenAI-compatible. (OpenRouter doc: https://openrouter.ai/docs/quickstart?utm_source=chatgpt.com)
 * - free of charge
 * - ChatOllama                                        (LangChain Docs: https://docs.langchain.com/oss/javascript/integrations/chat/ollama?utm_source=chatgpt.com)
 * - free of charge
 * - runs on local machine
*/
import { env } from "../config/env.js";
import { ChatOpenAI } from "@langchain/openai";

export function createChatModel() : ChatOpenAI | null {
      //v2- embedding is supported only with openai for now
      //not free of charge
      if (!env.openAiApiKey) {
        console.error("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
        return null;
      }
      console.log(`creating llm provider by configuration for: ${env.llmProvider}`);
      return new ChatOpenAI({
        apiKey: env.openAiApiKey,
        model:  env.openAiModel,
        temperature: 0
      });
}
    
/*
export function createChatModel() : ChatOpenAI | null {
  switch (env.llmProvider) {
    case "openai": {
      //not free of charge
      if (!env.openAiApiKey) {
        console.error("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
        return null;
      }
      console.log(`creating llm provider by configuration for: ${env.llmProvider}`);
      return new ChatOpenAI({
        apiKey: env.openAiApiKey,
        model:  env.openAiModel,
        temperature: 0
      });
    }
    case "openrouter": {
      //free of charge
      if (!env.openRouterApiKey) {
        console.error("OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter");
        return null;
      }
      console.log(`creating llm provider by configuration for: ${env.llmProvider}`);
      return new ChatOpenAI({
        apiKey: env.openRouterApiKey,
        model:  env.openRouterModel,
        temperature: 0,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "casino-property-agent"
          }
        }
      });
    }
    
    //case "ollama": {
    //  return new ChatOllama({
    //    baseUrl: env.ollamaBaseUrl,
    //    model: env.ollamaModel,
    //    temperature: 0
    //  });
    //}
    
    default: {
      console.error(`creating llm provider by configuration for: ${env.llmProvider}`);
      return null;

    }
  }
}
*/