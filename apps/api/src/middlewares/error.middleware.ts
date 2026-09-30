import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger, asyncLocalStorage } from "../lib/logger.js";
import { AppError } from "../errors/AppError.js";

export { AppError };

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const store = asyncLocalStorage.getStore();
  const correlationId =
    store?.get("correlationId") ||
    (req.headers["x-correlation-id"] as string) ||
    undefined;

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        correlationId,
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        correlationId,
        details: err.details,
      },
    });
    return;
  }

  logger.error(
    { err, path: req.path, method: req.method },
    "Unhandled internal server error",
  );

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected internal server error occurred",
      correlationId,
    },
  });
}
