import request from "supertest";
import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";

//bad request for empty or missing message
describe("chat endpoint", () => {
  it("returns 400 for missing message", async () => {
    const app = createApp();
const response = await request(app).post("/chat").send({});
expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid request");
  });

it("returns 400 for empty message", async () => {
    const app = createApp();
const response = await request(app).post("/chat").send({ message: "" });
expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid request");
  });
});
