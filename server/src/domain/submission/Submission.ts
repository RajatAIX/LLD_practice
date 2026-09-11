export type SubmissionStatus = "DRAFT" | "SUBMITTED";

export class Submission {
  private id: string;
  private attemptId: string;
  private solution: string;
  private status: SubmissionStatus;
  private submittedAt: Date;

  constructor(data: {
    id: string;
    attemptId: string;
    solution: string;
    status?: SubmissionStatus;
    submittedAt?: Date;
  }) {
    this.id = data.id;
    this.attemptId = data.attemptId;
    this.solution = data.solution;
    this.status = data.status ?? "DRAFT";
    this.submittedAt = data.submittedAt || new Date();
  }

  public updateSolution(newSolution: string): void {
    if (this.status === "SUBMITTED") throw new Error("Cannot update a submitted submission.");
    this.solution = newSolution;
  }

  public markSubmitted(): void {
    if (this.status === "SUBMITTED") throw new Error("Submission is already submitted.");
    this.status = "SUBMITTED";
  }

  public getId(): string { return this.id; }
  public getAttemptId(): string { return this.attemptId; }
  public getSolution(): string { return this.solution; }
  public getStatus(): SubmissionStatus { return this.status; }
  public getSubmittedAt(): Date { return this.submittedAt; }

  public toJSON() {
    return {
      id: this.id,
      attemptId: this.attemptId,
      solution: this.solution,
      status: this.status,
      submittedAt: this.submittedAt,
    };
  }
}