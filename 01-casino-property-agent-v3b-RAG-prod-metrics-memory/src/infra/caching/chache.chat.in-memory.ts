import type { ChatResponse } from "../../api/chat/chat.types.js";
import { recordChatCacheExpired, recordChatCacheHit, recordChatCacheMiss, recordChatCacheSize } from "../observability/metrics/cache.metrics.service.js";
/**
 * chat.cache.in-memory.ts
 * Simple in-memory cache for chat responses.
 * Cache Key   = propertyName + normalized question
 * Cache Value = ChatResponse + createdAt timestamp
 * TTL         = 5 minutes
 */


//The cache is a map of cache key to cache value
const cache = new Map<string, CacheEntry>();

/**
 * build the cache key (property name (eg, casino1) :: question) 
 * Note: the property name is used to support multiple property files.
 * eg, ask "where can i eat around casino" for casino1 
 * and also for casino2 
 * use same cache map
 */
//cache key
function buildCacheKey(question: string, propertyName: string): string {
    return `${propertyName}::${normalize(question)}`;
}

function normalize(text: string): string {
    return text.trim().toLowerCase();
}

//cache value
type CacheEntry = {
    value: ChatResponse;
    createdAt: number; 
};

// cache  TTL (e.g. 5 minutes)
const TTL_MS = 5 * 60 * 1000;




/**
 * Stores the chat response in the cache (key = property name :: question)
 */
export function setCachedChatResponse(
    question: string,
    propertyName: string,
    response: ChatResponse
  ): void {
    const key = buildCacheKey(question, propertyName);
    cache.set(key, {
      value: response,
      createdAt: Date.now()
    });
    recordChatCacheSize(cache.size);
  }


/**
 * retreive the answer by the question from the cache (if exists and is not expired)
 */
export function getCachedChatResponse(
  question: string,
  propertyName: string
): ChatResponse | null {
  const key = buildCacheKey(question, propertyName);
  const entry = cache.get(key);
  if (!entry) {
    //case1: key not found in the cache
    recordChatCacheMiss();
    return null;
  }

  if (Date.now() - entry.createdAt > TTL_MS) {
    //case2: key found in the cache but expired
    cache.delete(key);
    recordChatCacheExpired();
    recordChatCacheMiss();
    recordChatCacheSize(cache.size);
    return null;
  }
  //case3: key found in the cache and is not expired
  recordChatCacheHit();
  return entry.value;
}




