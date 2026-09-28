import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { correlationMiddleware } from "./middlewares/correlation.middleware.js";
import { errorMiddleware, AppError } from "./middlewares/error.middleware.js";
import { healthRouter } from "./routes/health.routes.js";

export function createApp(): Express {
  const app = express();

  // Security & standard middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(correlationMiddleware);

  // API Routes
  app.use("/health", healthRouter);

  // Catch-all 404 handler
  app.use((req, _res, next) => {
    next(
      new AppError({
        message: `Cannot ${req.method} ${req.path}`,
        statusCode: 404,
        code: "NOT_FOUND",
      }),
    );
  });

  // Central error handling middleware
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
