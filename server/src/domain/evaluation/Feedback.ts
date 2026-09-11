export class Feedback {
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
}