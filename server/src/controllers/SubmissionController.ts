import type { Request, Response, NextFunction } from "express";
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
      if (!submission) throw new Error("Submission not found");
      submission.updateSolution(req.body.solution);
      const updated = await submissionRepository.update(submission);
      res.status(200).json({ success: true, data: updated });
    } catch (error) { next(error); }
  }

  public static async markSubmitted(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const submission = await submissionRepository.findById(id);
      if (!submission) throw new Error("Submission not found");
      submission.markSubmitted();
      const updated = await submissionRepository.update(submission);
      res.status(200).json({ success: true, data: updated });
    } catch (error) { next(error); }
  }

  public static async getSubmissionsByAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attemptId = req.params.attemptId as string;
      const submissions = await submissionRepository.findByAttemptId(attemptId);
      res.status(200).json({ success: true, data: submissions });
    } catch (error) { next(error); }
  }
}