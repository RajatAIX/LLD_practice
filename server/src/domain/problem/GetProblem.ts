import type { Problem } from "./Problem.js";
import type { ProblemRepository } from "./ProblemRepository.js";
export class GetProblem {
  constructor(private problemRepository: ProblemRepository) {}
  public async execute(params: { id: string }): Promise<Problem> {
    const problem = await this.problemRepository.findById(params.id);
    if (!problem) throw new Error("Problem not found");
    return problem;
  }
}