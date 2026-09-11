import type { Submission } from "../submission/Submission.js";
import type { Rubric } from "./Rubric.js";
import type { Feedback } from "./Feedback.js";
export interface EvaluationResult {
  score: { overall: number; requirements: number; design: number; extensibility: number; codeQuality: number };
  feedback: Feedback;
}
export interface Evaluator {
  evaluate(submission: Submission, rubric: Rubric): Promise<EvaluationResult>;
}