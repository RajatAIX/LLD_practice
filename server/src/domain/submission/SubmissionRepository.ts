import type { Submission } from "./Submission.js";
export interface SubmissionRepository {
  findById(id: string): Promise<Submission | null>;
  findByAttemptId(attemptId: string): Promise<Submission[]>;
  save(submission: Submission): Promise<Submission>;
  update(submission: Submission): Promise<Submission>;
}