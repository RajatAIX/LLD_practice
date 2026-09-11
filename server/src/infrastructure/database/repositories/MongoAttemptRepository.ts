import { Attempt, type AttemptStatus } from "../../../domain/attempt/Attempt.js";
import type { AttemptRepository } from "../../../domain/attempt/AttemptRepository.js";
import { AttemptModel } from "../models/AttemptModel.js";
import { SubmissionModel } from "../models/SubmissionModel.js";
import { EvaluationModel } from "../models/EvaluationModel.js";

export class MongoAttemptRepository implements AttemptRepository {
  public async findById(id: string): Promise<Attempt | null> {
    const doc = await AttemptModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc as any);
  }
  public async findAll(): Promise<Attempt[]> {
    const docs = await AttemptModel.find().sort({ startedAt: -1 }).lean();
    return docs.map(d => this.toDomain(d as any));
  }
  public async findByProblemId(problemId: string): Promise<Attempt[]> {
    const docs = await AttemptModel.find({ problemId }).sort({ startedAt: -1 }).lean();
    return docs.map(d => this.toDomain(d as any));
  }
  public async save(attempt: Attempt): Promise<Attempt> {
    const doc = await AttemptModel.create({
      _id: attempt.getId(),
      problemId: attempt.getProblemId(),
      problemTitle: attempt.getProblemTitle(),
      startedAt: attempt.getStartedAt(),
      status: attempt.getStatus(),
    });
    return this.toDomain(doc.toObject() as any);
  }
  public async update(attempt: Attempt): Promise<Attempt> {
    const doc = await AttemptModel.findByIdAndUpdate(
      attempt.getId(),
      {
        problemId: attempt.getProblemId(),
        problemTitle: attempt.getProblemTitle(),
        startedAt: attempt.getStartedAt(),
        status: attempt.getStatus(),
      },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) throw new Error("Attempt not found");
    return this.toDomain(doc as any);
  }
  public async delete(id: string): Promise<boolean> {
    const doc = await AttemptModel.findByIdAndDelete(id);
    if (!doc) return false;
    // Cascade delete submissions and evaluations
    const submissions = await SubmissionModel.find({ attemptId: id }).lean();
    for (const sub of submissions) {
      await EvaluationModel.deleteMany({ submissionId: sub._id });
    }
    await SubmissionModel.deleteMany({ attemptId: id });
    return true;
  }
  private toDomain(doc: any): Attempt {
    return new Attempt({
      id: doc._id,
      problemId: doc.problemId,
      problemTitle: doc.problemTitle ?? "Unknown Problem",
      startedAt: doc.startedAt,
      status: doc.status as AttemptStatus,
    });
  }
}