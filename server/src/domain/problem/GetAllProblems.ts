import type { Problem } from "./Problem.js";
import type { ProblemRepository } from "./ProblemRepository.js";
export class GetAllProblems {
  constructor(private problemRepository: ProblemRepository) {}
  public async execute(): Promise<Problem[]> {
    return this.problemRepository.findAll();
  }
}