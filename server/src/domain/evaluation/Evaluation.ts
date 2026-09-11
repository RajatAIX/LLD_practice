import type { Feedback } from "./Feedback.js";
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

  public toJSON() {
    return {
      id: this.id,
      submissionId: this.submissionId,
      status: this.status,
      score: this.score,
      feedback: this.feedback,
      evaluatedAt: this.evaluatedAt,
    };
  }
}