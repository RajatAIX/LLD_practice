import type { Evaluation } from "./Evaluation.js";
import type { EvaluationRepository } from "./EvaluationRepository.js";
export class GetEvaluation {
  constructor(private evaluationRepository: EvaluationRepository) {}
  public async execute(params: { id: string }): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findById(params.id);
    if (!evaluation) throw new Error("Evaluation not found");
    return evaluation;
  }
}