import express from "express";
import cors from "cors";
import chatRouter from "./api/chat/chat.route.js";

export function createApp() {
  const app = express();

  app.use(cors());    // Enable browser clients during local development.
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/chat", chatRouter);
  return app;
}
