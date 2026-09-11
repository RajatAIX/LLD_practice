import { Submission, type SubmissionStatus } from "../../../domain/submission/Submission.js";
import type { SubmissionRepository } from "../../../domain/submission/SubmissionRepository.js";
import { SubmissionModel } from "../models/SubmissionModel.js";
export class MongoSubmissionRepository implements SubmissionRepository {
  public async findById(id: string): Promise<Submission | null> {
    const doc = await SubmissionModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc as any);
  }
  public async findByAttemptId(attemptId: string): Promise<Submission[]> {
    const docs = await SubmissionModel.find({ attemptId }).sort({ submittedAt: -1 }).lean();
    return docs.map(d => this.toDomain(d as any));
  }
  public async save(submission: Submission): Promise<Submission> {
    const doc = await SubmissionModel.create({
      _id: submission.getId(),
      attemptId: submission.getAttemptId(),
      solution: submission.getSolution(),
      status: submission.getStatus(),
      submittedAt: submission.getSubmittedAt(),
    });
    return this.toDomain(doc.toObject() as any);
  }
  public async update(submission: Submission): Promise<Submission> {
    const doc = await SubmissionModel.findByIdAndUpdate(
      submission.getId(),
      {
        attemptId: submission.getAttemptId(),
        solution: submission.getSolution(),
        status: submission.getStatus(),
        submittedAt: submission.getSubmittedAt(),
      },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) throw new Error("Submission not found");
    return this.toDomain(doc as any);
  }
  private toDomain(doc: any): Submission {
    return new Submission({
      id: doc._id,
      attemptId: doc.attemptId,
      solution: doc.solution,
      status: (doc.status ?? "DRAFT") as SubmissionStatus,
      submittedAt: doc.submittedAt,
    });
  }
}