import { describe, it, expect } from "vitest";
import { DeleteAttempt } from "../../src/domain/attempt/DeleteAttempt.js";
import { Attempt } from "../../src/domain/attempt/Attempt.js";
import type { AttemptRepository } from "../../src/domain/attempt/AttemptRepository.js";

class MockAttemptRepository implements AttemptRepository {
  public attempts: Attempt[] = [
    new Attempt({
      id: "attempt-1",
      problemId: "prob-1",
      problemTitle: "Parking Lot",
    }),
  ];

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
    return attempt;
  }
  async delete(id: string): Promise<boolean> {
    const initialLen = this.attempts.length;
    this.attempts = this.attempts.filter(a => a.getId() !== id);
    return this.attempts.length < initialLen;
  }
}

describe("DeleteAttempt Use Case", () => {
  it("should delete an existing attempt", async () => {
    const repo = new MockAttemptRepository();
    const useCase = new DeleteAttempt(repo);

    const result = await useCase.execute({ id: "attempt-1" });
    expect(result).toBe(true);
    expect(repo.attempts).toHaveLength(0);
  });

  it("should throw an error if attempt does not exist", async () => {
    const repo = new MockAttemptRepository();
    const useCase = new DeleteAttempt(repo);

    await expect(useCase.execute({ id: "unknown" })).rejects.toThrow("Attempt not found");
  });
});
