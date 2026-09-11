export type Difficulty = "EASY" | "MEDIUM" | "HARD";

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
}