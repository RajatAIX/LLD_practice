import type { Attempt } from "./Attempt.js";
import type { AttemptRepository } from "./AttemptRepository.js";
export class SubmitAttempt {
  constructor(private attemptRepository: AttemptRepository) {}
  public async execute(params: { attemptId: string }): Promise<Attempt> {
    const attempt = await this.attemptRepository.findById(params.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    attempt.submit();
    return this.attemptRepository.update(attempt);
  }
}