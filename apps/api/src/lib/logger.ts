import pino from "pino";
import { AsyncLocalStorage } from "async_hooks";

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        }
      : undefined,
  mixin() {
    const store = asyncLocalStorage.getStore();
    const correlationId = store?.get("correlationId");
    return correlationId ? { correlationId } : {};
  },
});
