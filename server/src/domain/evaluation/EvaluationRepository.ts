import type { Evaluation } from "./Evaluation.js";
export interface EvaluationRepository {
  findById(id: string): Promise<Evaluation | null>;
  findBySubmissionId(submissionId: string): Promise<Evaluation[]>;
  save(evaluation: Evaluation): Promise<Evaluation>;
  update(evaluation: Evaluation): Promise<Evaluation>;
}