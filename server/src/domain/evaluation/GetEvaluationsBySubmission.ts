import type { Evaluation } from "./Evaluation.js";
import type { EvaluationRepository } from "./EvaluationRepository.js";
export class GetEvaluationsBySubmission {
  constructor(private evaluationRepository: EvaluationRepository) {}
  public async execute(params: { submissionId: string }): Promise<Evaluation[]> {
    return this.evaluationRepository.findBySubmissionId(params.submissionId);
  }
}