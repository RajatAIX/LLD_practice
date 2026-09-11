import type { Problem } from "./Problem.js";
export interface ProblemRepository {
  findById(id: string): Promise<Problem | null>;
  findAll(): Promise<Problem[]>;
  save(problem: Problem): Promise<Problem>;
}