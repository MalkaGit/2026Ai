import express from "express";
import cors from "cors";
import chatRouter from "./api/chat/chat.route.js";
export function createApp() {
  const app = express();
  // Enable browser clients during local development.
  app.use(cors());
  app.use(express.json());
  // Lightweight endpoint used by tests and container health checks.
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  // All conversational requests are handled under /chat.
  app.use("/chat", chatRouter);
  return app;
}
