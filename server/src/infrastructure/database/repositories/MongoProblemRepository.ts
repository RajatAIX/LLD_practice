import { Problem, type Difficulty } from "../../../domain/problem/Problem.js";
import type { ProblemRepository } from "../../../domain/problem/ProblemRepository.js";
import { ProblemModel } from "../models/ProblemModel.js";

const LEGACY_FALLBACK_MAP: Record<string, string> = {
  "16c4f0a3-06c8-490f-923e-b074fea95e0e": "8198cb44-7b39-4d91-809b-7874683cd1ca", // Parking Lot
  "6526e2a9-3ff8-489f-8cfa-ec4d263e1851": "07b9edc5-db6c-42bb-8fa2-285d99ada094", // Elevator System
  "6d4ced55-9c6a-44fe-85df-e4c6adc09416": "3b0740f6-611a-4fa7-b189-5768fd3b735e", // Vending Machine
  "844a6e0a-31a5-47a7-8e42-fb6e3004d02e": "5f0f1b5b-d2dd-48eb-8831-ced9840853d2", // Library Management
  "4a3c47f3-98af-4b9c-b2c4-f726102d2f65": "e7c5576f-707b-41c6-a623-675346c404a1", // ATM System
  "7597208f-bf6f-4f1d-8734-c527f96372a4": "e28a002e-876a-4faa-b63d-4d71ce860340", // Food Ordering
};

export class MongoProblemRepository implements ProblemRepository {
  public async findById(id: string): Promise<Problem | null> {
    let doc = await ProblemModel.findById(id).lean();
    if (!doc && LEGACY_FALLBACK_MAP[id]) {
      doc = await ProblemModel.findById(LEGACY_FALLBACK_MAP[id]).lean();
    }
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
