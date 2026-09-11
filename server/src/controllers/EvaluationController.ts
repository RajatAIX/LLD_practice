import type { Request, Response, NextFunction } from "express";
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
          console.log(`Evaluation ${evaluation.getId()} completed successfully.`);
        } catch (err) {
          console.error(`Evaluation ${evaluation.getId()} failed:`, err);
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
}