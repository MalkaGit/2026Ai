/**
 *  hold ai related metrics
 *  latency, token usage, fallback, errors
 */

import { getCounter, incrementCounter, setGauge } from "./metrics.repo.in-memory.js";
  /**
   * Metric names.
   * Keep names Prometheus-friendly from day one.
   */
  const AI_REQUESTS_TOTAL             = "ai_requests_total";
  const AI_REQUESTS_SUCCESS_TOTAL     = "ai_requests_success_total";
  const AI_REQUESTS_FAILED_TOTAL      = "ai_requests_failed_total";
  const AI_REQUEST_LATENCY_MS_TOTAL   = "ai_request_latency_ms_total";
  const AI_REQUEST_LATENCY_MS_LAST    = "ai_request_latency_ms_last";
  const AI_RETRIEVAL_EMBEDDING_TOTAL  = "ai_retrieval_embedding_total";
  const AI_RETRIEVAL_KEYWORD_TOTAL    = "ai_retrieval_keyword_total";
  const AI_RETRIEVAL_FALLBACK_TOTAL   = "ai_retrieval_fallback_total";
  const AI_RETRIEVAL_EMPTY_TOTAL      = "ai_retrieval_empty_total";
  const AI_LLM_CALLS_TOTAL            = "ai_llm_calls_total";
  const AI_LLM_ERRORS_TOTAL           = "ai_llm_errors_total";
  const AI_EMBEDDING_CALLS_TOTAL      = "ai_embedding_calls_total";

  
  /**
   * Request lifecycle
   */
  export function recordAiRequestStarted(): void {
    incrementCounter(AI_REQUESTS_TOTAL);
  }
  export function recordAiRequestSucceeded(): void {
    incrementCounter(AI_REQUESTS_SUCCESS_TOTAL);
  }
  export function recordAiRequestFailed(): void {
    incrementCounter(AI_REQUESTS_FAILED_TOTAL);
  }
  /**
   * Latency
   */
  export function recordAiRequestLatency(durationMs: number): void {
    incrementCounter(AI_REQUEST_LATENCY_MS_TOTAL, durationMs);
    setGauge(AI_REQUEST_LATENCY_MS_LAST, durationMs);
  }
  /**
   * Retrieval method
   */
  export function recordEmbeddingRetrievalUsed(): void {
    incrementCounter(AI_RETRIEVAL_EMBEDDING_TOTAL);
  }
  export function recordKeywordRetrievalUsed(): void {
    incrementCounter(AI_RETRIEVAL_KEYWORD_TOTAL);
  }
  export function recordRetrievalFallbackUsed(): void {
    incrementCounter(AI_RETRIEVAL_FALLBACK_TOTAL);
  }
  export function recordEmptyRetrieval(): void {
    incrementCounter(AI_RETRIEVAL_EMPTY_TOTAL);
  }

  export function recordLlmCall(): void {
    incrementCounter(AI_LLM_CALLS_TOTAL);
  }
  export function recordLlmError(): void {
    incrementCounter(AI_LLM_ERRORS_TOTAL);
  }
  export function recordEmbeddingCall(count = 1): void {
    incrementCounter(AI_EMBEDDING_CALLS_TOTAL, count);
  }
  

  /**
   * Derived stats for local debugging.
   * Later Prometheus/Grafana can compute rates/averages externally.
   */
  export function getAiStats(): {
    requests: number;
    success: number;
    failed: number;
    avgLatencyMs: number;
    embeddingRetrievalCount: number;
    keywordRetrievalCount: number;
    fallbackCount: number;
    emptyRetrievalCount: number;
    llmCallsCount: number;
    llmErrorsCount: number;
    embeddingCallsCount: number;
  } {
    const requests = getCounter(AI_REQUESTS_TOTAL);
    const success = getCounter(AI_REQUESTS_SUCCESS_TOTAL);
    const failed = getCounter(AI_REQUESTS_FAILED_TOTAL);
    const totalLatency = getCounter(AI_REQUEST_LATENCY_MS_TOTAL);
  return {
      requests,
      success,
      failed,
      avgLatencyMs: requests > 0 ? totalLatency / requests : 0,
      embeddingRetrievalCount: getCounter(AI_RETRIEVAL_EMBEDDING_TOTAL),
      keywordRetrievalCount: getCounter(AI_RETRIEVAL_KEYWORD_TOTAL),
      fallbackCount: getCounter(AI_RETRIEVAL_FALLBACK_TOTAL),
      emptyRetrievalCount: getCounter(AI_RETRIEVAL_EMPTY_TOTAL),
      llmCallsCount: getCounter(AI_LLM_CALLS_TOTAL),
      llmErrorsCount: getCounter(AI_LLM_ERRORS_TOTAL),
      embeddingCallsCount: getCounter(AI_EMBEDDING_CALLS_TOTAL)
    
  }
}