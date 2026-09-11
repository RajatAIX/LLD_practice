import { rateLimit } from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

export const evaluationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,             // 15 evaluations per minute (Gemini API protection)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many evaluation requests. Please wait a moment." },
});
