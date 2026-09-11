import { Evaluation } from "./Evaluation.js";
import type { EvaluationRepository } from "./EvaluationRepository.js";
import type { SubmissionRepository } from "../submission/SubmissionRepository.js";
import { randomUUID } from "node:crypto";
export class StartEvaluation {
  constructor(
    private evaluationRepository: EvaluationRepository,
    private submissionRepository: SubmissionRepository
  ) {}
  public async execute(params: { submissionId: string }): Promise<Evaluation> {
    const submission = await this.submissionRepository.findById(params.submissionId);
    if (!submission) throw new Error("Submission not found");
    const evaluation = new Evaluation({
      id: randomUUID(),
      submissionId: params.submissionId,
    });
    evaluation.start();
    return this.evaluationRepository.save(evaluation);
  }
}