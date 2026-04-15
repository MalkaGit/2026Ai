/**
 * rateLimit.middleware.ts - works with app.ts
 * Rate limiter middleware for the chat API.
 * Uses the checkRateLimit function from rateLimiter.ts
 * Uses the ip address of the request to identify the user
 * Uses a constant for the window size.
 * Uses a constant for the maximum number of requests.
 * Returns true if the request is allowed, false otherwise.
 * Returns the remaining number of requests.
 */
import { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../infra/rate-limiting/rateLimiter.js";

/** Map localhost IPv4/IPv6 forms to one bucket so the same browser does not get a fresh limit per address shape. */
function clientKey(req: Request): string {
  const raw = req.ip ?? req.socket?.remoteAddress ?? "unknown";
  if (raw === "::1") return "127.0.0.1";
  if (raw.startsWith("::ffff:")) return raw.slice(7);
  return raw;
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { allowed, remaining } = checkRateLimit(clientKey(req));
  if (!allowed) {
    return res.status(429).json({
      message: "Too many requests. Please try again later."
    });
  }
  // optional headers (industry standard)
  res.setHeader("X-RateLimit-Remaining", remaining);
  next();
  return;
}

