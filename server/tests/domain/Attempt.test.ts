import { describe, it, expect } from "vitest";
import { Attempt } from "../../src/domain/attempt/Attempt.js";

describe("Attempt Domain Entity", () => {
  it("should create an Attempt with default IN_PROGRESS status", () => {
    const attempt = new Attempt({
      id: "attempt-1",
      problemId: "prob-1",
      problemTitle: "Parking Lot System",
    });

    expect(attempt.getId()).toBe("attempt-1");
    expect(attempt.getProblemId()).toBe("prob-1");
    expect(attempt.getProblemTitle()).toBe("Parking Lot System");
    expect(attempt.getStatus()).toBe("IN_PROGRESS");
    expect(attempt.getStartedAt()).toBeInstanceOf(Date);
  });

  it("should transition status from IN_PROGRESS to SUBMITTED", () => {
    const attempt = new Attempt({
      id: "attempt-2",
      problemId: "prob-1",
      problemTitle: "Parking Lot System",
    });

    attempt.submit();
    expect(attempt.getStatus()).toBe("SUBMITTED");
  });

  it("should transition status from SUBMITTED to EVALUATED", () => {
    const attempt = new Attempt({
      id: "attempt-3",
      problemId: "prob-1",
      problemTitle: "Parking Lot System",
      status: "SUBMITTED",
    });

    attempt.completeEvaluation();
    expect(attempt.getStatus()).toBe("EVALUATED");
  });

  it("should throw when trying to submit an already submitted attempt", () => {
    const attempt = new Attempt({
      id: "attempt-4",
      problemId: "prob-1",
      problemTitle: "Parking Lot System",
      status: "SUBMITTED",
    });

    expect(() => attempt.submit()).toThrow("Only in-progress attempts can be submitted");
  });

  it("should throw when trying to evaluate an in-progress attempt", () => {
    const attempt = new Attempt({
      id: "attempt-5",
      problemId: "prob-1",
      problemTitle: "Parking Lot System",
      status: "IN_PROGRESS",
    });

    expect(() => attempt.completeEvaluation()).toThrow("Only submitted attempts can be evaluated");
  });

  it("should serialize properly via toJSON", () => {
    const attempt = new Attempt({
      id: "attempt-6",
      problemId: "prob-1",
      problemTitle: "Parking Lot System",
    });

    const json = attempt.toJSON();
    expect(json).toEqual({
      id: "attempt-6",
      problemId: "prob-1",
      problemTitle: "Parking Lot System",
      startedAt: expect.any(Date),
      status: "IN_PROGRESS",
    });
  });
});
