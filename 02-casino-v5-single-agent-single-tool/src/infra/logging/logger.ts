/**
 * logger.ts
 *  generic structured logging
 */
export function logInfo(message: string, meta?: LogMeta): void {
    log("info", message, meta);
  }
  export function logWarn(message: string, meta?: LogMeta): void {
    log("warn", message, meta);
  }
  export function logError(message: string, meta?: LogMeta): void {
    log("error", message, meta);
  }
  export interface LogMeta {
    [key: string]: unknown;
  }

/**
 * Very small structured logger.
 * For now it writes JSON to console.
 * Later you can replace this file with Pino without changing callers.
 */
export function log(level: LogLevel, message: string, meta?: LogMeta): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta ? { meta } : {})
    };
  switch (level) {
      case "info":
        console.log(JSON.stringify(entry));
        return;
      case "warn":
        console.warn(JSON.stringify(entry));
        return;
      case "error":
        console.error(JSON.stringify(entry));
        return;
    }
  }
  
  export type LogLevel = "info" | "warn" | "error";


