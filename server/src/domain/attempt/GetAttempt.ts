import type { Attempt } from "./Attempt.js";
import type { AttemptRepository } from "./AttemptRepository.js";
export class GetAttempt {
  constructor(private attemptRepository: AttemptRepository) {}
  public async execute(params: { id: string }): Promise<Attempt> {
    const attempt = await this.attemptRepository.findById(params.id);
    if (!attempt) throw new Error("Attempt not found");
    return attempt;
  }
}