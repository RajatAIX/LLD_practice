import type { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export const globalErrorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.status ?? err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Log full error in all environments (but don't expose stack in prod response)
  console.error(`[ERROR] ${err.message}`, isProduction ? "" : err.stack);

  res.status(statusCode).json({
    success: false,
    message: err.message ?? "Internal Server Error",
    ...(isProduction ? {} : { stack: err.stack }),
  });
};