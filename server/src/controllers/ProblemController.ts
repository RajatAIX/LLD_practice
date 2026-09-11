import type { Request, Response, NextFunction } from "express";
import { CreateProblem } from "../domain/problem/CreateProblem.js";
import { GetProblem } from "../domain/problem/GetProblem.js";
import { GetAllProblems } from "../domain/problem/GetAllProblems.js";
import { MongoProblemRepository } from "../infrastructure/database/repositories/MongoProblemRepository.js";

const problemRepository = new MongoProblemRepository();
const createProblemUseCase = new CreateProblem(problemRepository);
const getProblemUseCase = new GetProblem(problemRepository);
const getAllProblemsUseCase = new GetAllProblems(problemRepository);

export class ProblemController {
  public static async getAllProblems(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problems = await getAllProblemsUseCase.execute();
      res.status(200).json({ success: true, data: problems });
    } catch (error) { next(error); }
  }
  public static async createProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await createProblemUseCase.execute(req.body);
      res.status(201).json({ success: true, data: problem });
    } catch (error) { next(error); }
  }
  public static async getProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problem = await getProblemUseCase.execute({ id: req.params.id as string });
      res.status(200).json({ success: true, data: problem });
    } catch (error) { next(error); }
  }
}