import type { Attempt } from "./Attempt.js";
import type { AttemptRepository } from "./AttemptRepository.js";
export class GetAllAttempts {
  constructor(private attemptRepository: AttemptRepository) {}
  public async execute(): Promise<Attempt[]> {
    return this.attemptRepository.findAll();
  }
}