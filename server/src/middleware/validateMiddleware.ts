import type { Request, Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Schemas ───────────────────────────────────────────────────────────────
export const createProblemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.array(z.string()).min(1, "At least one requirement is needed"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

export const createAttemptSchema = z.object({
  problemId: z.string().min(1, "problemId is required"),
});

export const submitSubmissionSchema = z.object({
  attemptId: z.string().min(1, "attemptId is required"),
  solution: z.string(),
});

export const updateSubmissionSchema = z.object({
  solution: z.string().min(1, "Solution cannot be empty"),
});

export const startEvaluationSchema = z.object({
  submissionId: z.string().min(1, "submissionId is required"),
});
