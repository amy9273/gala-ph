import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redisInstance || redisInstance.status === "end") {
    redisInstance = new Redis(env.REDIS_URL, {
      keyPrefix: env.REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn("Redis reconnection attempt limit reached.");
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redisInstance.on("error", (err) => {
      logger.error({ err }, "Redis connection error");
    });

    redisInstance.on("connect", () => {
      logger.info("Connected to Redis");
    });
  }

  return redisInstance;
}
