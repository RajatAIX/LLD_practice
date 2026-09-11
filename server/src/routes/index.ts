import { Router } from "express";
import problemRoutes from "./problemRoutes.js";
import attemptRoutes from "./attemptRoutes.js";
import submissionRoutes from "./submissionRoutes.js";
import evaluationRoutes from "./evaluationRoutes.js";

const router = Router();
router.use("/problems", problemRoutes);
router.use("/attempts", attemptRoutes);
router.use("/submissions", submissionRoutes);
router.use("/evaluations", evaluationRoutes);
export default router;