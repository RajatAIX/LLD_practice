import { Problem, type Difficulty } from "./Problem.js";
import type { ProblemRepository } from "./ProblemRepository.js";
import { randomUUID } from "node:crypto";
export class CreateProblem {
  constructor(private problemRepository: ProblemRepository) {}
  public async execute(params: {
    title: string;
    description: string;
    requirements: string[];
    difficulty: Difficulty;
  }): Promise<Problem> {
    const problem = new Problem({
      id: randomUUID(),
      title: params.title,
      description: params.description,
      requirements: params.requirements,
      difficulty: params.difficulty,
    });
    return this.problemRepository.save(problem);
  }
}