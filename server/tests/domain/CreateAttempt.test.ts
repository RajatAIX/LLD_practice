import { describe, it, expect } from "vitest";
import { CreateAttempt } from "../../src/domain/attempt/CreateAttempt.js";
import { Problem } from "../../src/domain/problem/Problem.js";
import type { AttemptRepository } from "../../src/domain/attempt/AttemptRepository.js";
import type { ProblemRepository } from "../../src/domain/problem/ProblemRepository.js";
import { Attempt } from "../../src/domain/attempt/Attempt.js";

class MockAttemptRepository implements AttemptRepository {
  public attempts: Attempt[] = [];
  async findById(id: string): Promise<Attempt | null> {
    return this.attempts.find(a => a.getId() === id) ?? null;
  }
  async findAll(): Promise<Attempt[]> {
    return this.attempts;
  }
  async findByProblemId(problemId: string): Promise<Attempt[]> {
    return this.attempts.filter(a => a.getProblemId() === problemId);
  }
  async save(attempt: Attempt): Promise<Attempt> {
    this.attempts.push(attempt);
    return attempt;
  }
  async update(attempt: Attempt): Promise<Attempt> {
    const idx = this.attempts.findIndex(a => a.getId() === attempt.getId());
    if (idx >= 0) this.attempts[idx] = attempt;
    return attempt;
  }
  async delete(id: string): Promise<boolean> {
    const initialLen = this.attempts.length;
    this.attempts = this.attempts.filter(a => a.getId() !== id);
    return this.attempts.length < initialLen;
  }
}

class MockProblemRepository implements ProblemRepository {
  public problems: Problem[] = [
    new Problem({
      id: "prob-100",
      title: "Elevator System",
      description: "Design an elevator system for a high-rise building",
      requirements: ["Handle concurrent requests", "Dispatch algorithm"],
      difficulty: "MEDIUM",
    }),
  ];
  async findById(id: string): Promise<Problem | null> {
    return this.problems.find(p => p.getId() === id) ?? null;
  }
  async findAll(): Promise<Problem[]> {
    return this.problems;
  }
  async save(problem: Problem): Promise<Problem> {
    this.problems.push(problem);
    return problem;
  }
}

describe("CreateAttempt Use Case", () => {
  it("should create an attempt with snapshotted problemTitle", async () => {
    const attemptRepo = new MockAttemptRepository();
    const problemRepo = new MockProblemRepository();
    const useCase = new CreateAttempt(attemptRepo, problemRepo);

    const result = await useCase.execute({ problemId: "prob-100" });

    expect(result.getProblemId()).toBe("prob-100");
    expect(result.getProblemTitle()).toBe("Elevator System");
    expect(result.getStatus()).toBe("IN_PROGRESS");
    expect(attemptRepo.attempts).toHaveLength(1);
  });

  it("should throw an error if the problem is not found", async () => {
    const attemptRepo = new MockAttemptRepository();
    const problemRepo = new MockProblemRepository();
    const useCase = new CreateAttempt(attemptRepo, problemRepo);

    await expect(useCase.execute({ problemId: "non-existent" })).rejects.toThrow("Problem not found");
  });
});
