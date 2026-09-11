import { Router } from "express";
import { SubmissionController } from "../controllers/SubmissionController.js";
import { validate, submitSubmissionSchema, updateSubmissionSchema } from "../middleware/validateMiddleware.js";
const router = Router();
router.get("/attempt/:attemptId", SubmissionController.getSubmissionsByAttempt);
router.post("/", validate(submitSubmissionSchema), SubmissionController.submitSubmission);
router.put("/:id", validate(updateSubmissionSchema), SubmissionController.updateSubmission);
router.post("/:id/submit", SubmissionController.markSubmitted);
export default router;