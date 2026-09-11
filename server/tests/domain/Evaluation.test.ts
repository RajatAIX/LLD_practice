import { describe, it, expect } from "vitest";
import { Evaluation } from "../../src/domain/evaluation/Evaluation.js";

describe("Evaluation Domain Entity", () => {
  it("should create an Evaluation with default PENDING status", () => {
    const ev = new Evaluation({
      id: "eval-1",
      submissionId: "sub-1",
    });

    expect(ev.getId()).toBe("eval-1");
    expect(ev.getSubmissionId()).toBe("sub-1");
    expect(ev.getStatus()).toBe("PENDING");
    expect(ev.getScore()).toBeNull();
    expect(ev.getFeedback()).toBeNull();
    expect(ev.getEvaluatedAt()).toBeNull();
  });

  it("should transition to IN_PROGRESS on start()", () => {
    const ev = new Evaluation({
      id: "eval-2",
      submissionId: "sub-1",
    });

    ev.start();
    expect(ev.getStatus()).toBe("IN_PROGRESS");
  });

  it("should complete evaluation with score and feedback", () => {
    const ev = new Evaluation({
      id: "eval-3",
      submissionId: "sub-1",
    });

    ev.start();
    const score = { overall: 8, requirements: 8, design: 8, extensibility: 8, codeQuality: 8 };
    const feedback = {
      summary: "Good design",
      strengths: ["Clear interfaces"],
      improvements: ["Add concurrency guards"],
      recommendations: ["Use Factory pattern"],
    };

    ev.complete(score, feedback);
    expect(ev.getStatus()).toBe("COMPLETED");
    expect(ev.getScore()).toEqual(score);
    expect(ev.getFeedback()).toEqual(feedback);
    expect(ev.getEvaluatedAt()).toBeInstanceOf(Date);
  });

  it("should transition to FAILED on fail()", () => {
    const ev = new Evaluation({
      id: "eval-4",
      submissionId: "sub-1",
    });

    ev.start();
    ev.fail();
    expect(ev.getStatus()).toBe("FAILED");
  });

  it("should serialize properly via toJSON", () => {
    const ev = new Evaluation({
      id: "eval-5",
      submissionId: "sub-1",
    });

    const json = ev.toJSON();
    expect(json).toEqual({
      id: "eval-5",
      submissionId: "sub-1",
      status: "PENDING",
      score: null,
      feedback: null,
      evaluatedAt: null,
    });
  });
});
