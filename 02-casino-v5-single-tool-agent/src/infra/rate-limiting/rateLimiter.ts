/**
 * rateLimiter.ts - works with eateLimit.middleware.ts
 * in memory Rate limiter for the chat API.
 * Uses a sliding window algorithm to limit the number of requests per minute.
 * Uses in memeory map to store the rate limit entries.
 * Uses a constant for the window size.
 * Uses a constant for the maximum number of requests.
 * Returns true if the request is allowed, false otherwise.
 * Returns the remaining number of requests.
 */
type RateLimitEntry = {
    count: number;
    windowStart: number;
  };
  const store = new Map<string, RateLimitEntry>();
  const WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 1;20;


  export function checkRateLimit(key: string): {
    allowed: boolean;
    remaining: number;
  } {
    console.log("===========>checkRateLimit", key);
    const now = Date.now();
    const entry = store.get(key);
    if (!entry) {
      store.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }
    // reset window
    if (now - entry.windowStart > WINDOW_MS) {
      store.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    if (entry.count >= MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }
    entry.count++;
    return { allowed: true, remaining: MAX_REQUESTS - entry.count };
  }
  
  