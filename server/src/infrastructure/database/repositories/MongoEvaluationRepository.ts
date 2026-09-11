import { Evaluation, type EvaluationStatus } from "../../../domain/evaluation/Evaluation.js";
import type { EvaluationRepository } from "../../../domain/evaluation/EvaluationRepository.js";
import { EvaluationModel } from "../models/EvaluationModel.js";
import { Feedback } from "../../../domain/evaluation/Feedback.js";
export class MongoEvaluationRepository implements EvaluationRepository {
  public async findById(id: string): Promise<Evaluation | null> {
    const doc = await EvaluationModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc as any);
  }
  public async findBySubmissionId(submissionId: string): Promise<Evaluation[]> {
    const docs = await EvaluationModel.find({ submissionId }).sort({ evaluatedAt: -1 }).lean();
    return docs.map(d => this.toDomain(d as any));
  }
  public async save(evaluation: Evaluation): Promise<Evaluation> {
    const doc = await EvaluationModel.create({
      _id: evaluation.getId(),
      submissionId: evaluation.getSubmissionId(),
      status: evaluation.getStatus(),
      score: evaluation.getScore(),
      feedback: evaluation.getFeedback(),
      evaluatedAt: evaluation.getEvaluatedAt(),
    });
    return this.toDomain(doc.toObject() as any);
  }
  public async update(evaluation: Evaluation): Promise<Evaluation> {
    const doc = await EvaluationModel.findByIdAndUpdate(
      evaluation.getId(),
      { submissionId: evaluation.getSubmissionId(), status: evaluation.getStatus(), score: evaluation.getScore(), feedback: evaluation.getFeedback(), evaluatedAt: evaluation.getEvaluatedAt() },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) throw new Error("Evaluation not found");
    return this.toDomain(doc as any);
  }
  private toDomain(doc: any): Evaluation {
    return new Evaluation({
      id: doc._id,
      submissionId: doc.submissionId,
      status: doc.status as EvaluationStatus,
      score: doc.score,
      feedback: doc.feedback ? new Feedback(doc.feedback) : null,
      evaluatedAt: doc.evaluatedAt,
    });
  }
}