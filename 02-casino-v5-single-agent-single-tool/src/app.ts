import express from "express";
import cors from "cors";
import chatRouter from "./api/chat/chat.route.js";
import { getChatCacheStats } from "./infra/observability/metrics/cache.metrics.service.js";
import { getAllMetrics } from "./infra/observability/metrics/metrics.repo.in-memory.js";
import { getAiStats } from "./infra/observability/metrics/ai.metrics.service.js";
export function createApp() {
  const app = express();

  app.use(cors());    // Enable browser clients during local development.
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get("/debug/metrics", (_req, res) => {
    res.status(200).json({
      cache: getChatCacheStats(),
      ai: getAiStats(),
      allMetrics: getAllMetrics()
    });
  });

  app.use("/chat", chatRouter);
  return app;
}
