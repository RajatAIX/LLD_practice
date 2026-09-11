import { Problem, type Difficulty } from "../../../domain/problem/Problem.js";
import type { ProblemRepository } from "../../../domain/problem/ProblemRepository.js";
import { ProblemModel } from "../models/ProblemModel.js";
export class MongoProblemRepository implements ProblemRepository {
  public async findById(id: string): Promise<Problem | null> {
    const doc = await ProblemModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc as any);
  }
  public async findAll(): Promise<Problem[]> {
    const docs = await ProblemModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(d => this.toDomain(d as any));
  }
  public async save(problem: Problem): Promise<Problem> {
    const doc = await ProblemModel.create({
      _id: problem.getId(),
      title: problem.getTitle(),
      description: problem.getDescription(),
      requirements: problem.getRequirements(),
      difficulty: problem.getDifficulty(),
      createdAt: problem.getCreatedAt(),
    });
    return this.toDomain(doc.toObject() as any);
  }
  private toDomain(doc: any): Problem {
    return new Problem({
      id: doc._id,
      title: doc.title,
      description: doc.description,
      requirements: doc.requirements,
      difficulty: doc.difficulty,
      createdAt: doc.createdAt,
    });
  }
}