import type { Evaluation } from "./Evaluation.js";
import type { EvaluationRepository } from "./EvaluationRepository.js";
import type { Feedback } from "./Feedback.js";
export class CompleteEvaluation {
  constructor(private evaluationRepository: EvaluationRepository) {}
  public async execute(params: { evaluationId: string; score: any; feedback: Feedback }): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findById(params.evaluationId);
    if (!evaluation) throw new Error("Evaluation not found");
    evaluation.complete(params.score, params.feedback);
    return this.evaluationRepository.update(evaluation);
  }
}