import { Router, Request, Response } from "express";
import { getRedisClient } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const healthRouter = Router();

/**
 * Liveness probe: Lightweight process vitality check (< 1ms).
 * NEVER touches databases or external services.
 */
healthRouter.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Readiness probe: Deep dependency health check.
 * Verifies PostgreSQL and Redis connectivity.
 */
healthRouter.get("/ready", async (_req: Request, res: Response) => {
  const checks: {
    database: "healthy" | "unhealthy" | "disabled";
    redis: "healthy" | "unhealthy" | "disabled";
  } = {
    database: "disabled",
    redis: "disabled",
  };

  let isReady = true;

  // Check PostgreSQL via Prisma if configured
  if (env.DATABASE_URL) {
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Database timeout")), 2000),
        ),
      ]);
      checks.database = "healthy";
    } catch (err) {
      logger.warn({ err }, "Readiness check: PostgreSQL ping failed");
      checks.database = "unhealthy";
      isReady = false;
    }
  }

  // Check Redis if configured
  const redis = getRedisClient();
  if (redis) {
    try {
      const pingRes = await Promise.race([
        redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis timeout")), 2000),
        ),
      ]);
      checks.redis = pingRes === "PONG" ? "healthy" : "unhealthy";
      if (checks.redis === "unhealthy") isReady = false;
    } catch (err) {
      logger.warn({ err }, "Readiness check: Redis ping failed");
      checks.redis = "unhealthy";
      isReady = false;
    }
  }

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json({
    status: isReady ? "ready" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    environment: env.NODE_ENV,
    version: "0.1.0",
  });
});
