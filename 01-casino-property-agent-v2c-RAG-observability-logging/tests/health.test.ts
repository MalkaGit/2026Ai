/**
 * testing the health endpoint
 * (file: C:\dev\repos\node\2026Ai\01-casino-property-agent\src\app.ts)
 * 
 * ensure it returns 200 OK
 * ensure it returns the correct body
 */
import request from "supertest";
import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";

//OK for health endpoint
describe("health endpoint", () => {
  it("returns ok", async () => {
    const app = createApp();
const response = await request(app).get("/health");
expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
