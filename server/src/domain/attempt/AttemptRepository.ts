import type { Attempt } from "./Attempt.js";
export interface AttemptRepository {
  findById(id: string): Promise<Attempt | null>;
  findByProblemId(problemId: string): Promise<Attempt[]>;
  findAll(): Promise<Attempt[]>;
  save(attempt: Attempt): Promise<Attempt>;
  update(attempt: Attempt): Promise<Attempt>;
  delete(id: string): Promise<boolean>;
}