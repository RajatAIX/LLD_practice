import { describe, it, expect } from "vitest";
import { Submission } from "../../src/domain/submission/Submission.js";

describe("Submission Domain Entity", () => {
  it("should create a Submission with default DRAFT status", () => {
    const sub = new Submission({
      id: "sub-1",
      attemptId: "att-1",
      solution: "class ParkingLot {}",
    });

    expect(sub.getId()).toBe("sub-1");
    expect(sub.getAttemptId()).toBe("att-1");
    expect(sub.getSolution()).toBe("class ParkingLot {}");
    expect(sub.getStatus()).toBe("DRAFT");
    expect(sub.getSubmittedAt()).toBeInstanceOf(Date);
  });

  it("should allow updating solution while in DRAFT status", () => {
    const sub = new Submission({
      id: "sub-2",
      attemptId: "att-1",
      solution: "class V1 {}",
    });

    sub.updateSolution("class V2 {}");
    expect(sub.getSolution()).toBe("class V2 {}");
  });

  it("should transition status to SUBMITTED via markSubmitted()", () => {
    const sub = new Submission({
      id: "sub-3",
      attemptId: "att-1",
      solution: "class ParkingLot {}",
    });

    sub.markSubmitted();
    expect(sub.getStatus()).toBe("SUBMITTED");
  });

  it("should disallow updating solution after SUBMITTED", () => {
    const sub = new Submission({
      id: "sub-4",
      attemptId: "att-1",
      solution: "class ParkingLot {}",
      status: "SUBMITTED",
    });

    expect(() => sub.updateSolution("new solution")).toThrow("Cannot update a submitted submission.");
  });

  it("should disallow marking submitted twice", () => {
    const sub = new Submission({
      id: "sub-5",
      attemptId: "att-1",
      solution: "class ParkingLot {}",
      status: "SUBMITTED",
    });

    expect(() => sub.markSubmitted()).toThrow("Submission is already submitted.");
  });

  it("should serialize properly via toJSON", () => {
    const sub = new Submission({
      id: "sub-6",
      attemptId: "att-1",
      solution: "class ParkingLot {}",
    });

    const json = sub.toJSON();
    expect(json).toEqual({
      id: "sub-6",
      attemptId: "att-1",
      solution: "class ParkingLot {}",
      status: "DRAFT",
      submittedAt: expect.any(Date),
    });
  });
});
