import { Submission } from "./Submission.js";
import type { SubmissionRepository } from "./SubmissionRepository.js";
import type { AttemptRepository } from "../attempt/AttemptRepository.js";
import { randomUUID } from "node:crypto";
export class SubmitSubmission {
  constructor(
    private submissionRepository: SubmissionRepository,
    private attemptRepository: AttemptRepository
  ) {}
  public async execute(params: { attemptId: string; solution: string }): Promise<Submission> {
    const attempt = await this.attemptRepository.findById(params.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    const submission = new Submission({
      id: randomUUID(),
      attemptId: params.attemptId,
      solution: params.solution,
    });
    return this.submissionRepository.save(submission);
  }
}