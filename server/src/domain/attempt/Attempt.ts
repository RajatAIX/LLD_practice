export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EVALUATED";
export class Attempt {
  private id: string;
  private problemId: string;
  private problemTitle: string;
  private startedAt: Date;
  private status: AttemptStatus;

  constructor(data: {
    id: string;
    problemId: string;
    problemTitle: string;
    startedAt?: Date;
    status?: AttemptStatus;
  }) {
    this.id = data.id;
    this.problemId = data.problemId;
    this.problemTitle = data.problemTitle;
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
  public getProblemTitle(): string { return this.problemTitle; }
  public getStartedAt(): Date { return this.startedAt; }
  public getStatus(): AttemptStatus { return this.status; }

  public toJSON() {
    return {
      id: this.id,
      problemId: this.problemId,
      problemTitle: this.problemTitle,
      startedAt: this.startedAt,
      status: this.status,
    };
  }
}