import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

describe("API Integration Tests", () => {
  it("GET /health should return 200 and status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /api/v1/unknown-endpoint should return 404", async () => {
    const res = await request(app).get("/api/v1/unknown-endpoint");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/v1/attempts with empty body should return 400 validation error", async () => {
    const res = await request(app)
      .post("/api/v1/attempts")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.errors).toBeDefined();
  });

  it("POST /api/v1/evaluations/start with missing submissionId should return 400", async () => {
    const res = await request(app)
      .post("/api/v1/evaluations/start")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].field).toBe("submissionId");
  });

  it("POST /api/v1/problems with invalid payload should return 400", async () => {
    const res = await request(app)
      .post("/api/v1/problems")
      .send({ title: "Hi" }); // title too short, missing description, etc.
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
