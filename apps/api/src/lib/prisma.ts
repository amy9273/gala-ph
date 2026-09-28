import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }

  const client = new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error", "warn"],
  });

  if (env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = client;
  }

  return client;
}

export const prisma = getPrismaClient();

export async function disconnectPrisma(): Promise<void> {
  if (globalThis.prismaGlobal) {
    await globalThis.prismaGlobal.$disconnect();
    globalThis.prismaGlobal = undefined;
    logger.info("Prisma client disconnected.");
  }
}
