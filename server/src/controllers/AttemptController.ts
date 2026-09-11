import type { Request, Response, NextFunction } from "express";
import { CreateAttempt } from "../domain/attempt/CreateAttempt.js";
import { GetAttempt } from "../domain/attempt/GetAttempt.js";
import { SubmitAttempt } from "../domain/attempt/SubmitAttempt.js";
import { GetAllAttempts } from "../domain/attempt/GetAllAttempts.js";
import { DeleteAttempt } from "../domain/attempt/DeleteAttempt.js";
import { MongoAttemptRepository } from "../infrastructure/database/repositories/MongoAttemptRepository.js";
import { MongoProblemRepository } from "../infrastructure/database/repositories/MongoProblemRepository.js";

const attemptRepository = new MongoAttemptRepository();
const problemRepository = new MongoProblemRepository();

const createAttemptUseCase = new CreateAttempt(attemptRepository, problemRepository);
const getAttemptUseCase = new GetAttempt(attemptRepository);
const submitAttemptUseCase = new SubmitAttempt(attemptRepository);
const getAllAttemptsUseCase = new GetAllAttempts(attemptRepository);
const deleteAttemptUseCase = new DeleteAttempt(attemptRepository);

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
  public static async deleteAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await deleteAttemptUseCase.execute({ id: req.params.id as string });
      res.status(200).json({ success: true, message: "Attempt deleted successfully" });
    } catch (error) { next(error); }
  }
}