import type { AttemptRepository } from "./AttemptRepository.js";

export class DeleteAttempt {
  constructor(private attemptRepository: AttemptRepository) {}

  public async execute(params: { id: string }): Promise<boolean> {
    const attempt = await this.attemptRepository.findById(params.id);
    if (!attempt) {
      throw new Error("Attempt not found");
    }
    return this.attemptRepository.delete(params.id);
  }
}
