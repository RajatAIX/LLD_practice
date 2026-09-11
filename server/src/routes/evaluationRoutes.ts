import { Router } from "express";
import { EvaluationController } from "../controllers/EvaluationController.js";
import { validate, startEvaluationSchema } from "../middleware/validateMiddleware.js";
import { evaluationLimiter } from "../middleware/rateLimitMiddleware.js";

const router = Router();

router.post("/start", evaluationLimiter, validate(startEvaluationSchema), EvaluationController.startEvaluation);
router.post("/:id/complete", EvaluationController.completeEvaluation);
// IMPORTANT: specific route must come BEFORE the wildcard /:id
router.get("/submission/:submissionId", EvaluationController.getEvaluationsBySubmission);
router.get("/:id", EvaluationController.getEvaluation);

export default router;