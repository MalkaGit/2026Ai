/**
 * holds cache-related metric names and helper functions
   Your cache code should only say things like:
	• recordChatCacheHit()
	• recordChatCacheMiss()
	• recordChatCacheExpired()
    That keeps cache logic separate from metrics implementation. 
*/


import { 	getCounter,	setGauge,	incrementCounter } from "./metrics.repo.in-memory.js";
  
   /**
   * Metric names.
   * Keep them stable and explicit so they are easy to map to Prometheus later.
   */
  const CHAT_CACHE_HITS_TOTAL    = "chat_cache_hits_total";
  const CHAT_CACHE_MISSES_TOTAL  = "chat_cache_misses_total";
  const CHAT_CACHE_EXPIRED_TOTAL = "chat_cache_expired_total";
  const CHAT_CACHE_SIZE          = "chat_cache_size";
  
  /**
   * Record chat cache hit.
   */
  export function recordChatCacheHit(): void {
	incrementCounter(CHAT_CACHE_HITS_TOTAL);
  }


  /**
   * Record chat cache miss.
   */
  export function recordChatCacheMiss(): void {
	incrementCounter(CHAT_CACHE_MISSES_TOTAL);
  }

  /**
   * Record expired cache entry.
   */
  export function recordChatCacheExpired(): void {
	incrementCounter(CHAT_CACHE_EXPIRED_TOTAL);
  }

  /**
   * Update current cache size gauge.
   */
  export function recordChatCacheSize(size: number): void {
	setGauge(CHAT_CACHE_SIZE, size);
  }


  /**
   * Derived stats for debugging and local visibility.
   * Later Prometheus/Grafana would compute rates/ratios differently,
   * but this is useful now.
   */
  export function getChatCacheStats(): {
	hits: number;
	misses: number;
	expired: number;
	hitRate: number;
  } {
	const hits    = getCounter(CHAT_CACHE_HITS_TOTAL);
	const misses  = getCounter(CHAT_CACHE_MISSES_TOTAL);
	const expired = getCounter(CHAT_CACHE_EXPIRED_TOTAL);
    const totalLookups = hits + misses;
    return {
	  hits,
	  misses,
	  expired,
	  hitRate: totalLookups > 0 ? hits / totalLookups : 0
	};
  }
  
  