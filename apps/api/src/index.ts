import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { getRedisClient } from "./lib/redis.js";
import {
  initWebSocketServer,
  closeWebSocketServer,
} from "./sockets/socket.server.js";

const server = app.listen(env.PORT, () => {
  logger.info(
    `🌴 GalaPH API server listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`,
  );
});

// Initialize WebSocket hub on the HTTP server
initWebSocketServer(server);

async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  await closeWebSocketServer();
  logger.info("WebSocket server closed.");

  server.close(async () => {
    logger.info("HTTP server closed.");

    const redis = getRedisClient();
    if (redis) {
      await redis.quit();
      logger.info("Redis connection closed.");
    }

    const { disconnectPrisma } = await import("./lib/prisma.js");
    await disconnectPrisma();

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
