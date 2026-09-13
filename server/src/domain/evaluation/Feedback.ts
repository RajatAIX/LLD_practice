export interface CriterionFeedback {
  criterion: string;
  score: number;
  evidence: string[];
  concern: string;
  suggestion: string;
  confidence: number;
}

export class Feedback {
  public summary: string;
  public strengths: string[];
  public improvements: string[];
  public recommendations: string[];
  public criteria: CriterionFeedback[];

  constructor(data: {
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    criteria?: CriterionFeedback[];
  }) {
    this.summary = data.summary;
    this.strengths = data.strengths;
    this.improvements = data.improvements;
    this.recommendations = data.recommendations;
    this.criteria = data.criteria ?? [];
  }
}