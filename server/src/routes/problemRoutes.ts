import { Router } from "express";
import { ProblemController } from "../controllers/ProblemController.js";
import { validate, createProblemSchema } from "../middleware/validateMiddleware.js";
const router = Router();
router.get("/", ProblemController.getAllProblems);
router.post("/", validate(createProblemSchema), ProblemController.createProblem);
router.get("/:id", ProblemController.getProblem);
export default router;