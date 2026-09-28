import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { asyncLocalStorage } from "../lib/logger.js";

export function correlationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const correlationId =
    (req.headers["x-correlation-id"] as string) || randomUUID();
  res.setHeader("x-correlation-id", correlationId);

  const store = new Map<string, string>();
  store.set("correlationId", correlationId);

  asyncLocalStorage.run(store, () => {
    next();
  });
}
