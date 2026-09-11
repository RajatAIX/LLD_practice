import fs from 'fs';
import path from 'path';

const rootDir = path.resolve('server');

const dirs = [
  'src/config',
  'src/middleware',
  'src/domain/problem',
  'src/domain/attempt',
  'src/domain/submission',
  'src/domain/evaluation',
  'src/infrastructure/database/models',
  'src/infrastructure/database/repositories',
  'src/infrastructure/ai',
  'src/controllers',
  'src/routes',
];

dirs.forEach(dir => fs.mkdirSync(path.join(rootDir, dir), { recursive: true }));

const files = {
  // CONFIG
  'package.json': `{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "helmet": "^7.1.0",
    "mongoose": "^8.6.1",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.5.4",
    "tsx": "^4.19.0",
    "typescript": "^5.5.4"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "nodenext",
    "target": "esnext",
    "sourceMap": true,
    "declaration": true,
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}`,
  'src/config/env.ts': `import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/lld-practice",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",
};`,
  'src/middleware/errorMiddleware.ts': `import type { Request, Response, NextFunction } from "express";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};`,

  // DATABASE
  'src/infrastructure/database/database.ts': `import mongoose from "mongoose";
import { env } from "../../config/env.js";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};`,

  // DOMAIN: PROBLEM
  'src/domain/problem/Problem.ts': `export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export class Problem {
  private id: string;
  private title: string;
  private description: string;
  private requirements: string[];
  private difficulty: Difficulty;
  private createdAt: Date;

  constructor(data: {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    difficulty: Difficulty;
    createdAt?: Date;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.requirements = data.requirements;
    this.difficulty = data.difficulty;
    this.createdAt = data.createdAt || new Date();
  }

  public getId(): string { return this.id; }
  public getTitle(): string { return this.title; }
  public getDescription(): string { return this.description; }
  public getRequirements(): string[] { return this.requirements; }
  public getDifficulty(): Difficulty { return this.difficulty; }
  public getCreatedAt(): Date { return this.createdAt; }
}`,
  'src/domain/problem/ProblemRepository.ts': `import type { Problem } from "./Problem.js";
export interface ProblemRepository {
  findById(id: string): Promise<Problem | null>;
  findAll(): Promise<Problem[]>;
  save(problem: Problem): Promise<Problem>;
}`,
  'src/domain/problem/GetProblem.ts': `import type { Problem } from "./Problem.js";
import type { ProblemRepository } from "./ProblemRepository.js";
export class GetProblem {
  constructor(private problemRepository: ProblemRepository) {}
  public async execute(params: { id: string }): Promise<Problem> {
    const problem = await this.problemRepository.findById(params.id);
    if (!problem) throw new Error("Problem not found");
    return problem;
  }
}`,
  'src/domain/problem/GetAllProblems.ts': `import type { Problem } from "./Problem.js";
import type { ProblemRepository } from "./ProblemRepository.js";
export class GetAllProblems {
  constructor(private problemRepository: ProblemRepository) {}
  public async execute(): Promise<Problem[]> {
    return this.problemRepository.findAll();
  }
}`,
  'src/domain/problem/CreateProblem.ts': `import { Problem, type Difficulty } from "./Problem.js";
import type { ProblemRepository } from "./ProblemRepository.js";
import { randomUUID } from "node:crypto";
export class CreateProblem {
  constructor(private problemRepository: ProblemRepository) {}
  public async execute(params: {
    title: string;
    description: string;
    requirements: string[];
    difficulty: Difficulty;
  }): Promise<Problem> {
    const problem = new Problem({
      id: randomUUID(),
      title: params.title,
      description: params.description,
      requirements: params.requirements,
      difficulty: params.difficulty,
    });
    return this.problemRepository.save(problem);
  }
}`,

  // DOMAIN: ATTEMPT
  'src/domain/attempt/Attempt.ts': `export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EVALUATED";
export class Attempt {
  private id: string;
  private problemId: string;
  private startedAt: Date;
  private status: AttemptStatus;

  constructor(data: {
    id: string;
    problemId: string;
    startedAt?: Date;
    status?: AttemptStatus;
  }) {
    this.id = data.id;
    this.problemId = data.problemId;
    this.startedAt = data.startedAt || new Date();
    this.status = data.status || "IN_PROGRESS";
  }

  public submit(): void {
    if (this.status !== "IN_PROGRESS") throw new Error("Only in-progress attempts can be submitted");
    this.status = "SUBMITTED";
  }

  public completeEvaluation(): void {
    if (this.status !== "SUBMITTED") throw new Error("Only submitted attempts can be evaluated");
    this.status = "EVALUATED";
  }

  public getId(): string { return this.id; }
  public getProblemId(): string { return this.problemId; }
  public getStartedAt(): Date { return this.startedAt; }
  public getStatus(): AttemptStatus { return this.status; }
}`,
  'src/domain/attempt/AttemptRepository.ts': `import type { Attempt } from "./Attempt.js";
export interface AttemptRepository {
  findById(id: string): Promise<Attempt | null>;
  findByProblemId(problemId: string): Promise<Attempt[]>;
  findAll(): Promise<Attempt[]>;
  save(attempt: Attempt): Promise<Attempt>;
  update(attempt: Attempt): Promise<Attempt>;
}`,
  'src/domain/attempt/CreateAttempt.ts': `import { Attempt } from "./Attempt.js";
import type { AttemptRepository } from "./AttemptRepository.js";
import type { ProblemRepository } from "../problem/ProblemRepository.js";
import { randomUUID } from "node:crypto";
export class CreateAttempt {
  constructor(
    private attemptRepository: AttemptRepository,
    private problemRepository: ProblemRepository
  ) {}
  public async execute(params: { problemId: string }): Promise<Attempt> {
    const problem = await this.problemRepository.findById(params.problemId);
    if (!problem) throw new Error("Problem not found");
    const attempt = new Attempt({ id: randomUUID(), problemId: params.problemId });
    return this.attemptRepository.save(attempt);
  }
}`,
  'src/domain/attempt/GetAttempt.ts': `import type { Attempt } from "./Attempt.js";
import type { AttemptRepository } from "./AttemptRepository.js";
export class GetAttempt {
  constructor(private attemptRepository: AttemptRepository) {}
  public async execute(params: { id: string }): Promise<Attempt> {
    const attempt = await this.attemptRepository.findById(params.id);
    if (!attempt) throw new Error("Attempt not found");
    return attempt;
  }
}`,
  'src/domain/attempt/GetAllAttempts.ts': `import type { Attempt } from "./Attempt.js";
import type { AttemptRepository } from "./AttemptRepository.js";
export class GetAllAttempts {
  constructor(private attemptRepository: AttemptRepository) {}
  public async execute(): Promise<Attempt[]> {
    return this.attemptRepository.findAll();
  }
}`,
  'src/domain/attempt/SubmitAttempt.ts': `import type { Attempt } from "./Attempt.js";
import type { AttemptRepository } from "./AttemptRepository.js";
export class SubmitAttempt {
  constructor(private attemptRepository: AttemptRepository) {}
  public async execute(params: { attemptId: string }): Promise<Attempt> {
    const attempt = await this.attemptRepository.findById(params.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    attempt.submit();
    return this.attemptRepository.update(attempt);
  }
}`,

  // DOMAIN: SUBMISSION
  'src/domain/submission/Submission.ts': `export class Submission {
  private id: string;
  private attemptId: string;
  private solution: string;
  private submittedAt: Date;

  constructor(data: {
    id: string;
    attemptId: string;
    solution: string;
    submittedAt?: Date;
  }) {
    this.id = data.id;
    this.attemptId = data.attemptId;
    this.solution = data.solution;
    this.submittedAt = data.submittedAt || new Date();
  }

  public updateSolution(newSolution: string): void {
    this.solution = newSolution;
  }

  public getId(): string { return this.id; }
  public getAttemptId(): string { return this.attemptId; }
  public getSolution(): string { return this.solution; }
  public getSubmittedAt(): Date { return this.submittedAt; }
}`,
  'src/domain/submission/SubmissionRepository.ts': `import type { Submission } from "./Submission.js";
export interface SubmissionRepository {
  findById(id: string): Promise<Submission | null>;
  findByAttemptId(attemptId: string): Promise<Submission[]>;
  save(submission: Submission): Promise<Submission>;
  update(submission: Submission): Promise<Submission>;
}`,
  'src/domain/submission/SubmitSubmission.ts': `import { Submission } from "./Submission.js";
import type { SubmissionRepository } from "./SubmissionRepository.js";
import type { AttemptRepository } from "../attempt/AttemptRepository.js";
import { randomUUID } from "node:crypto";
export class SubmitSubmission {
  constructor(
    private submissionRepository: SubmissionRepository,
    private attemptRepository: AttemptRepository
  ) {}
  public async execute(params: { attemptId: string; solution: string }): Promise<Submission> {
    const attempt = await this.attemptRepository.findById(params.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    const submission = new Submission({
      id: randomUUID(),
      attemptId: params.attemptId,
      solution: params.solution,
    });
    return this.submissionRepository.save(submission);
  }
}`,

  // DOMAIN: EVALUATION
  'src/domain/evaluation/Rubric.ts': `export class Rubric {
  private id: string;
  private name: string;
  private criteria: { category: string; description: string; maxScore: number }[];
  constructor(data: { id: string; name: string; criteria: any[] }) {
    this.id = data.id;
    this.name = data.name;
    this.criteria = data.criteria;
  }
  public getCriteria() { return this.criteria; }
}`,
  'src/domain/evaluation/Feedback.ts': `export class Feedback {
  public summary: string;
  public strengths: string[];
  public improvements: string[];
  public recommendations: string[];
  constructor(data: { summary: string; strengths: string[]; improvements: string[]; recommendations: string[] }) {
    this.summary = data.summary;
    this.strengths = data.strengths;
    this.improvements = data.improvements;
    this.recommendations = data.recommendations;
  }
}`,
  'src/domain/evaluation/Evaluator.ts': `import type { Submission } from "../submission/Submission.js";
import type { Rubric } from "./Rubric.js";
import type { Feedback } from "./Feedback.js";
export interface EvaluationResult {
  score: { overall: number; requirements: number; design: number; extensibility: number; codeQuality: number };
  feedback: Feedback;
}
export interface Evaluator {
  evaluate(submission: Submission, rubric: Rubric): Promise<EvaluationResult>;
}`,
  'src/domain/evaluation/Evaluation.ts': `import type { Feedback } from "./Feedback.js";
export type EvaluationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export class Evaluation {
  private id: string;
  private submissionId: string;
  private status: EvaluationStatus;
  private score: any | null;
  private feedback: Feedback | null;
  private evaluatedAt: Date | null;

  constructor(data: {
    id: string;
    submissionId: string;
    status?: EvaluationStatus;
    score?: any;
    feedback?: Feedback | null;
    evaluatedAt?: Date | null;
  }) {
    this.id = data.id;
    this.submissionId = data.submissionId;
    this.status = data.status || "PENDING";
    this.score = data.score || null;
    this.feedback = data.feedback || null;
    this.evaluatedAt = data.evaluatedAt || null;
  }

  public start(): void {
    this.status = "IN_PROGRESS";
  }

  public complete(score: any, feedback: Feedback): void {
    this.status = "COMPLETED";
    this.score = score;
    this.feedback = feedback;
    this.evaluatedAt = new Date();
  }

  public fail(): void {
    this.status = "FAILED";
  }

  public getId(): string { return this.id; }
  public getSubmissionId(): string { return this.submissionId; }
  public getStatus(): EvaluationStatus { return this.status; }
  public getScore(): any | null { return this.score; }
  public getFeedback(): Feedback | null { return this.feedback; }
  public getEvaluatedAt(): Date | null { return this.evaluatedAt; }
}`,
  'src/domain/evaluation/EvaluationRepository.ts': `import type { Evaluation } from "./Evaluation.js";
export interface EvaluationRepository {
  findById(id: string): Promise<Evaluation | null>;
  findBySubmissionId(submissionId: string): Promise<Evaluation[]>;
  save(evaluation: Evaluation): Promise<Evaluation>;
  update(evaluation: Evaluation): Promise<Evaluation>;
}`,
  'src/domain/evaluation/StartEvaluation.ts': `import { Evaluation } from "./Evaluation.js";
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
}`,
  'src/domain/evaluation/CompleteEvaluation.ts': `import type { Evaluation } from "./Evaluation.js";
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
}`,
  'src/domain/evaluation/GetEvaluation.ts': `import type { Evaluation } from "./Evaluation.js";
import type { EvaluationRepository } from "./EvaluationRepository.js";
export class GetEvaluation {
  constructor(private evaluationRepository: EvaluationRepository) {}
  public async execute(params: { id: string }): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findById(params.id);
    if (!evaluation) throw new Error("Evaluation not found");
    return evaluation;
  }
}`,
  'src/domain/evaluation/GetEvaluationsBySubmission.ts': `import type { Evaluation } from "./Evaluation.js";
import type { EvaluationRepository } from "./EvaluationRepository.js";
export class GetEvaluationsBySubmission {
  constructor(private evaluationRepository: EvaluationRepository) {}
  public async execute(params: { submissionId: string }): Promise<Evaluation[]> {
    return this.evaluationRepository.findBySubmissionId(params.submissionId);
  }
}`,

  // INFRASTRUCTURE: MODELS
  'src/infrastructure/database/models/ProblemModel.ts': `import mongoose, { Schema, type Document } from "mongoose";
export interface IProblemDocument extends Document {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  difficulty: string;
  createdAt: Date;
}
const problemSchema = new Schema<IProblemDocument>({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: [String], required: true },
  difficulty: { type: String, required: true, enum: ["EASY", "MEDIUM", "HARD"] },
  createdAt: { type: Date, required: true, default: Date.now }
});
export const ProblemModel = mongoose.model<IProblemDocument>("Problem", problemSchema);`,
  
  'src/infrastructure/database/models/AttemptModel.ts': `import mongoose, { Schema, type Document } from "mongoose";
export interface IAttemptDocument extends Document {
  _id: string;
  problemId: string;
  startedAt: Date;
  status: string;
}
const attemptSchema = new Schema<IAttemptDocument>({
  _id: { type: String, required: true },
  problemId: { type: String, required: true, ref: "Problem" },
  startedAt: { type: Date, required: true, default: Date.now },
  status: { type: String, required: true, enum: ["IN_PROGRESS", "SUBMITTED", "EVALUATED"] }
});
export const AttemptModel = mongoose.model<IAttemptDocument>("Attempt", attemptSchema);`,

  'src/infrastructure/database/models/SubmissionModel.ts': `import mongoose, { Schema, type Document } from "mongoose";
export interface ISubmissionDocument extends Document {
  _id: string;
  attemptId: string;
  solution: string;
  submittedAt: Date;
}
const submissionSchema = new Schema<ISubmissionDocument>({
  _id: { type: String, required: true },
  attemptId: { type: String, required: true, ref: "Attempt" },
  solution: { type: String, required: true },
  submittedAt: { type: Date, required: true, default: Date.now }
});
export const SubmissionModel = mongoose.model<ISubmissionDocument>("Submission", submissionSchema);`,

  'src/infrastructure/database/models/EvaluationModel.ts': `import mongoose, { Schema, type Document } from "mongoose";
export interface IEvaluationDocument extends Document {
  _id: string;
  submissionId: string;
  status: string;
  score: any;
  feedback: any;
  evaluatedAt: Date;
}
const evaluationSchema = new Schema<IEvaluationDocument>({
  _id: { type: String, required: true },
  submissionId: { type: String, required: true, ref: "Submission" },
  status: { type: String, required: true, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"] },
  score: { type: Schema.Types.Mixed, default: null },
  feedback: { type: Schema.Types.Mixed, default: null },
  evaluatedAt: { type: Date, default: null }
});
export const EvaluationModel = mongoose.model<IEvaluationDocument>("Evaluation", evaluationSchema);`,

  // INFRASTRUCTURE: REPOSITORIES
  'src/infrastructure/database/repositories/MongoProblemRepository.ts': `import { Problem, type Difficulty } from "../../../domain/problem/Problem.js";
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
}`,

  'src/infrastructure/database/repositories/MongoAttemptRepository.ts': `import { Attempt, type AttemptStatus } from "../../../domain/attempt/Attempt.js";
import type { AttemptRepository } from "../../../domain/attempt/AttemptRepository.js";
import { AttemptModel } from "../models/AttemptModel.js";
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
      startedAt: attempt.getStartedAt(),
      status: attempt.getStatus(),
    });
    return this.toDomain(doc.toObject() as any);
  }
  public async update(attempt: Attempt): Promise<Attempt> {
    const doc = await AttemptModel.findByIdAndUpdate(
      attempt.getId(),
      { problemId: attempt.getProblemId(), startedAt: attempt.getStartedAt(), status: attempt.getStatus() },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) throw new Error("Attempt not found");
    return this.toDomain(doc as any);
  }
  private toDomain(doc: any): Attempt {
    return new Attempt({
      id: doc._id,
      problemId: doc.problemId,
      startedAt: doc.startedAt,
      status: doc.status as AttemptStatus,
    });
  }
}`,

  'src/infrastructure/database/repositories/MongoSubmissionRepository.ts': `import { Submission } from "../../../domain/submission/Submission.js";
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
      submittedAt: submission.getSubmittedAt(),
    });
    return this.toDomain(doc.toObject() as any);
  }
  public async update(submission: Submission): Promise<Submission> {
    const doc = await SubmissionModel.findByIdAndUpdate(
      submission.getId(),
      { attemptId: submission.getAttemptId(), solution: submission.getSolution(), submittedAt: submission.getSubmittedAt() },
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
      submittedAt: doc.submittedAt,
    });
  }
}`,

  'src/infrastructure/database/repositories/MongoEvaluationRepository.ts': `import { Evaluation, type EvaluationStatus } from "../../../domain/evaluation/Evaluation.js";
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
}`,

  // INFRASTRUCTURE: AI
  'src/infrastructure/ai/GeminiEvaluator.ts': `import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../../config/env.js";
import type { Evaluator, EvaluationResult } from "../../domain/evaluation/Evaluator.js";
import type { Submission } from "../../domain/submission/Submission.js";
import type { Rubric } from "../../domain/evaluation/Rubric.js";
import { Feedback } from "../../domain/evaluation/Feedback.js";

export class GeminiEvaluator implements Evaluator {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }

  public async evaluate(
    submission: Submission,
    rubric: Rubric
  ): Promise<EvaluationResult> {
    // Fallback Mock Evaluation if API Key is missing
    if (!env.geminiApiKey) {
      console.log("No Gemini API Key found. Returning mock evaluation in 3 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        score: {
          overall: 8,
          requirements: 8,
          design: 8,
          extensibility: 7,
          codeQuality: 9,
        },
        feedback: new Feedback({
          summary: "This is a solid design that captures the primary requirements. The entities are well-identified, but some of the relationships could be decoupled to improve extensibility.",
          strengths: [
            "Good identification of core domain entities.",
            "Clear separation of responsibilities for the main controllers."
          ],
          improvements: [
            "Consider using the Strategy Pattern for pricing models instead of hardcoding.",
            "The repository layer could be abstracted further to avoid tight coupling."
          ],
          recommendations: [
            "Review SOLID principles, specifically the Open/Closed Principle.",
            "Practice diagramming the data flow to spot circular dependencies."
          ],
        })
      };
    }

    const prompt = \`
You are an expert software engineer evaluating a Low-Level Design (LLD) submission.
Evaluate the candidate's submission based on the provided rubric.

Rubric:
\${JSON.stringify(rubric.getCriteria(), null, 2)}

Candidate Submission:
\${submission.getSolution()}

Provide a structured evaluation result including scores for each category and detailed feedback.
Scores must be between 0 and 10.
\`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.OBJECT,
              properties: {
                overall: { type: Type.INTEGER },
                requirements: { type: Type.INTEGER },
                design: { type: Type.INTEGER },
                extensibility: { type: Type.INTEGER },
                codeQuality: { type: Type.INTEGER },
              },
              required: ["overall", "requirements", "design", "extensibility", "codeQuality"]
            },
            feedback: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["summary", "strengths", "improvements", "recommendations"]
            }
          },
          required: ["score", "feedback"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Failed to generate evaluation result");
    }

    const parsed = JSON.parse(text);

    return {
      score: {
        overall: parsed.score.overall,
        requirements: parsed.score.requirements,
        design: parsed.score.design,
        extensibility: parsed.score.extensibility,
        codeQuality: parsed.score.codeQuality,
      },
      feedback: new Feedback({
        summary: parsed.feedback.summary,
        strengths: parsed.feedback.strengths,
        improvements: parsed.feedback.improvements,
        recommendations: parsed.feedback.recommendations,
      })
    };
  }
}`,

  // CONTROLLERS
  'src/controllers/ProblemController.ts': `import type { Request, Response, NextFunction } from "express";
import { CreateProblem } from "../domain/problem/CreateProblem.js";
import { GetProblem } from "../domain/problem/GetProblem.js";
import { GetAllProblems } from "../domain/problem/GetAllProblems.js";
import { MongoProblemRepository } from "../infrastructure/database/repositories/MongoProblemRepository.js";

const problemRepository = new MongoProblemRepository();
const createProblemUseCase = new CreateProblem(problemRepository);
const getProblemUseCase = new GetProblem(problemRepository);
const getAllProblemsUseCase = new GetAllProblems(problemRepository);

export class ProblemController {
  public static async getAllProblems(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problems = await getAllProblemsUseCase.execute();
      res.status(200).json({ success: true, data: problems });
    } catch (error) { next(error); }
  }
  public static async createProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await createProblemUseCase.execute(req.body);
      res.status(201).json({ success: true, data: problem });
    } catch (error) { next(error); }
  }
  public static async getProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await getProblemUseCase.execute({ id: req.params.id as string });
      res.status(200).json({ success: true, data: problem });
    } catch (error) { next(error); }
  }
}`,
  
  'src/controllers/AttemptController.ts': `import type { Request, Response, NextFunction } from "express";
import { CreateAttempt } from "../domain/attempt/CreateAttempt.js";
import { GetAttempt } from "../domain/attempt/GetAttempt.js";
import { SubmitAttempt } from "../domain/attempt/SubmitAttempt.js";
import { GetAllAttempts } from "../domain/attempt/GetAllAttempts.js";
import { MongoAttemptRepository } from "../infrastructure/database/repositories/MongoAttemptRepository.js";
import { MongoProblemRepository } from "../infrastructure/database/repositories/MongoProblemRepository.js";

const attemptRepository = new MongoAttemptRepository();
const problemRepository = new MongoProblemRepository();

const createAttemptUseCase = new CreateAttempt(attemptRepository, problemRepository);
const getAttemptUseCase = new GetAttempt(attemptRepository);
const submitAttemptUseCase = new SubmitAttempt(attemptRepository);
const getAllAttemptsUseCase = new GetAllAttempts(attemptRepository);

export class AttemptController {
  public static async getAllAttempts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attempts = await getAllAttemptsUseCase.execute();
      res.status(200).json({ success: true, data: attempts });
    } catch (error) { next(error); }
  }
  public static async createAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attempt = await createAttemptUseCase.execute({ problemId: req.body.problemId });
      res.status(201).json({ success: true, data: attempt });
    } catch (error) { next(error); }
  }
  public static async getAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attempt = await getAttemptUseCase.execute({ id: req.params.id as string });
      res.status(200).json({ success: true, data: attempt });
    } catch (error) { next(error); }
  }
  public static async submitAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attempt = await submitAttemptUseCase.execute({ attemptId: req.params.id as string });
      res.status(200).json({ success: true, data: attempt });
    } catch (error) { next(error); }
  }
}`,

  'src/controllers/SubmissionController.ts': `import type { Request, Response, NextFunction } from "express";
import { SubmitSubmission } from "../domain/submission/SubmitSubmission.js";
import { MongoSubmissionRepository } from "../infrastructure/database/repositories/MongoSubmissionRepository.js";
import { MongoAttemptRepository } from "../infrastructure/database/repositories/MongoAttemptRepository.js";

const submissionRepository = new MongoSubmissionRepository();
const attemptRepository = new MongoAttemptRepository();
const submitSubmissionUseCase = new SubmitSubmission(submissionRepository, attemptRepository);

export class SubmissionController {
  public static async submitSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await submitSubmissionUseCase.execute({
        attemptId: req.body.attemptId,
        solution: req.body.solution,
      });
      res.status(201).json({ success: true, data: submission });
    } catch (error) { next(error); }
  }
  public static async updateSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const submission = await submissionRepository.findById(id);
      if(!submission) throw new Error("Submission not found");
      submission.updateSolution(req.body.solution);
      await submissionRepository.update(submission);
      res.status(200).json({ success: true, data: submission });
    } catch (error) { next(error); }
  }
  public static async markSubmitted(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
       res.status(200).json({ success: true, data: "ok" });
    } catch (error) { next(error); }
  }
}`,

  'src/controllers/EvaluationController.ts': `import type { Request, Response, NextFunction } from "express";
import { StartEvaluation } from "../domain/evaluation/StartEvaluation.js";
import { CompleteEvaluation } from "../domain/evaluation/CompleteEvaluation.js";
import { GetEvaluation } from "../domain/evaluation/GetEvaluation.js";
import { GetEvaluationsBySubmission } from "../domain/evaluation/GetEvaluationsBySubmission.js";
import { MongoEvaluationRepository } from "../infrastructure/database/repositories/MongoEvaluationRepository.js";
import { MongoSubmissionRepository } from "../infrastructure/database/repositories/MongoSubmissionRepository.js";
import { GeminiEvaluator } from "../infrastructure/ai/GeminiEvaluator.js";
import { Rubric } from "../domain/evaluation/Rubric.js";

const evaluationRepository = new MongoEvaluationRepository();
const submissionRepository = new MongoSubmissionRepository();
const evaluator = new GeminiEvaluator();

const startEvaluationUseCase = new StartEvaluation(evaluationRepository, submissionRepository);
const completeEvaluationUseCase = new CompleteEvaluation(evaluationRepository);
const getEvaluationUseCase = new GetEvaluation(evaluationRepository);
const getEvaluationsBySubmissionUseCase = new GetEvaluationsBySubmission(evaluationRepository);

const DEFAULT_RUBRIC = new Rubric({
  id: "default-rubric",
  name: "Standard LLD Rubric",
  criteria: [
    { category: "REQUIREMENTS", description: "Does the design meet all functional requirements?", maxScore: 10 },
    { category: "OBJECT_ORIENTED_DESIGN", description: "Are classes and responsibilities well-defined?", maxScore: 10 },
    { category: "EXTENSIBILITY", description: "Is the design easy to extend?", maxScore: 10 },
    { category: "CODE_QUALITY", description: "Is the explanation clear and maintainable?", maxScore: 10 }
  ]
});

export class EvaluationController {
  public static async startEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { submissionId } = req.body;
      const evaluation = await startEvaluationUseCase.execute({ submissionId });
      
      res.status(202).json({
        success: true,
        message: "Evaluation started. Check back later for results.",
        data: evaluation,
      });

      setTimeout(async () => {
        try {
          const submission = await submissionRepository.findById(submissionId);
          if (!submission) return;
          const result = await evaluator.evaluate(submission, DEFAULT_RUBRIC);
          await completeEvaluationUseCase.execute({
            evaluationId: evaluation.getId(),
            score: result.score,
            feedback: result.feedback,
          });
          console.log(\`Evaluation \${evaluation.getId()} completed successfully.\`);
        } catch (err) {
          console.error(\`Evaluation \${evaluation.getId()} failed:\`, err);
          evaluation.fail();
          await evaluationRepository.update(evaluation);
        }
      }, 0);
    } catch (error) { next(error); }
  }

  public static async completeEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const evaluation = await completeEvaluationUseCase.execute({
        evaluationId: req.params.id as string,
        score: req.body.score,
        feedback: req.body.feedback,
      });
      res.status(200).json({ success: true, data: evaluation });
    } catch (error) { next(error); }
  }

  public static async getEvaluation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const evaluation = await getEvaluationUseCase.execute({ id: req.params.id as string });
      res.status(200).json({ success: true, data: evaluation });
    } catch (error) { next(error); }
  }

  public static async getEvaluationsBySubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const evaluations = await getEvaluationsBySubmissionUseCase.execute({ submissionId: req.params.submissionId as string });
      res.status(200).json({ success: true, data: evaluations });
    } catch (error) { next(error); }
  }
}`,

  // ROUTES
  'src/routes/problemRoutes.ts': `import { Router } from "express";
import { ProblemController } from "../controllers/ProblemController.js";
const router = Router();
router.get("/", ProblemController.getAllProblems);
router.post("/", ProblemController.createProblem);
router.get("/:id", ProblemController.getProblem);
export default router;`,

  'src/routes/attemptRoutes.ts': `import { Router } from "express";
import { AttemptController } from "../controllers/AttemptController.js";
const router = Router();
router.get("/", AttemptController.getAllAttempts);
router.post("/", AttemptController.createAttempt);
router.get("/:id", AttemptController.getAttempt);
router.post("/:id/submit", AttemptController.submitAttempt);
export default router;`,

  'src/routes/submissionRoutes.ts': `import { Router } from "express";
import { SubmissionController } from "../controllers/SubmissionController.js";
const router = Router();
router.post("/", SubmissionController.submitSubmission);
router.put("/:id", SubmissionController.updateSubmission);
router.post("/:id/submit", SubmissionController.markSubmitted);
export default router;`,

  'src/routes/evaluationRoutes.ts': `import { Router } from "express";
import { EvaluationController } from "../controllers/EvaluationController.js";
const router = Router();
router.post("/start", EvaluationController.startEvaluation);
router.post("/:id/complete", EvaluationController.completeEvaluation);
router.get("/:id", EvaluationController.getEvaluation);
router.get("/submission/:submissionId", EvaluationController.getEvaluationsBySubmission);
export default router;`,

  'src/routes/index.ts': `import { Router } from "express";
import problemRoutes from "./problemRoutes.js";
import attemptRoutes from "./attemptRoutes.js";
import submissionRoutes from "./submissionRoutes.js";
import evaluationRoutes from "./evaluationRoutes.js";

const router = Router();
router.use("/problems", problemRoutes);
router.use("/attempts", attemptRoutes);
router.use("/submissions", submissionRoutes);
router.use("/evaluations", evaluationRoutes);
export default router;`,

  // APP AND SERVER
  'src/app.ts': `import express from "express";
import type { Express } from "express";
import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1", routes);

app.use(globalErrorHandler);
export default app;`,

  'src/server.ts': `import { env } from "./config/env.js";
import { connectDatabase } from "./infrastructure/database/database.js";
import type { Server } from "http";
import { ProblemModel } from "./infrastructure/database/models/ProblemModel.js";
import { randomUUID } from "node:crypto";
import appInstance from "./app.js";

const app = appInstance;
let server: Server;

async function seedDatabase() {
  const count = await ProblemModel.countDocuments();
  if (count === 0) {
    console.log("Seeding database with initial problems...");
    await ProblemModel.create([
      {
        _id: randomUUID(),
        title: "Design a Parking Lot",
        description: "Design a multi-level parking lot system. It should support multiple vehicle types and different pricing models.",
        requirements: ["Support Cars, Motorcycles, and Trucks.", "Calculate fee based on time spent.", "Handle entry and exit gates."],
        difficulty: "MEDIUM",
        createdAt: new Date()
      },
      {
        _id: randomUUID(),
        title: "Design an Elevator System",
        description: "Design an elevator system for a multi-story building that optimizes wait times.",
        requirements: ["Handle internal and external requests.", "Support emergency stops.", "Optimize dispatch algorithm."],
        difficulty: "HARD",
        createdAt: new Date()
      },
      {
        _id: randomUUID(),
        title: "Design a Vending Machine",
        description: "Design a state machine for a vending machine.",
        requirements: ["Accept different denominations.", "Dispense product and change.", "Handle out of stock."],
        difficulty: "EASY",
        createdAt: new Date()
      }
    ]);
    console.log("Database seeded successfully.");
  }
}

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await seedDatabase();
    console.log("Server initialization completed");

    server = app.listen(env.port, () => {
      console.log(\`Server is running on port \${env.port}\`);
    });
  } catch (error) {
    console.error("Server initialization failed", error);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});`
};

for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(rootDir, filePath), content);
}

console.log("Backend server scaffolded successfully!");
