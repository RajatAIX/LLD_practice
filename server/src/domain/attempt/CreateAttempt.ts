import { Attempt } from "./Attempt.js";
import type { AttemptRepository } from "./AttemptRepository.js";
import type { ProblemRepository } from "../problem/ProblemRepository.js";
import { randomUUID } from "node:crypto";
export class CreateAttempt {
  constructor(
    private attemptRepository: AttemptRepository,
    private problemRepository: ProblemRepository
  ) {}
  public async execute(params: { problemId: string }): Promise<Attempt> {
    const problem = await this.problemRepository.findById(params.problemId);
    if (!problem) throw new Error("Problem not found");
    const attempt = new Attempt({
      id: randomUUID(),
      problemId: params.problemId,
      problemTitle: problem.getTitle(),
    });
    return this.attemptRepository.save(attempt);
  }
}