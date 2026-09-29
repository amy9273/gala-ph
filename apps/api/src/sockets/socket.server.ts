import { Server as HttpServer, IncomingMessage } from "node:http";
import { URL } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { verifyJwtToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

export interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  userName: string;
  isAlive: boolean;
  tripRooms: Set<string>;
}

let wss: WebSocketServer | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

// Map tripId -> Set of authenticated client WebSockets
const tripRooms = new Map<string, Set<AuthenticatedWebSocket>>();

/**
 * Broadcasts an event payload to all clients subscribed to a specific trip room.
 */
export function broadcastToTrip(
  tripId: string,
  payload: { type: string; [key: string]: unknown },
  excludeSocket?: WebSocket,
) {
  const room = tripRooms.get(tripId);
  if (!room || room.size === 0) return;

  const message = JSON.stringify(payload);
  for (const client of room) {
    if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        logger.debug(
          { err, tripId },
          "Failed to send message to client socket",
        );
      }
    }
  }
}

/**
 * Extracts and verifies JWT from upgrade request (Query param or Authorization header).
 */
function authenticateSocketRequest(req: IncomingMessage): {
  userId: string;
  userName: string;
} | null {
  try {
    let token: string | null = null;

    // 1. Check Query parameter: ?token=xxx
    if (req.url) {
      const url = new URL(req.url, "http://localhost");
      token = url.searchParams.get("token");
    }

    // 2. Check Authorization header: Bearer xxx
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1] ?? null;
      }
    }

    if (!token) return null;

    const payload = verifyJwtToken(token);
    return {
      userId: payload.userId,
      userName: payload.name,
    };
  } catch (err) {
    logger.debug({ err }, "WebSocket authentication failed");
    return null;
  }
}

/**
 * Initializes the WebSocket Server attached to an HTTP Server instance.
 */
export function initWebSocketServer(httpServer: HttpServer): WebSocketServer {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    // Check path: only upgrade if starting with /ws or /socket or root ws
    const pathname = request.url
      ? new URL(request.url, "http://localhost").pathname
      : "";
    if (
      pathname.startsWith("/ws") ||
      pathname === "/" ||
      pathname.startsWith("/socket")
    ) {
      const user = authenticateSocketRequest(request);

      if (!user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss?.handleUpgrade(request, socket, head, (ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        authWs.userId = user.userId;
        authWs.userName = user.userName;
        authWs.isAlive = true;
        authWs.tripRooms = new Set();
        wss?.emit("connection", authWs, request);
      });
    }
  });

  wss.on("connection", (ws: AuthenticatedWebSocket) => {
    logger.debug({ userId: ws.userId }, "WebSocket client connected");

    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (data: Buffer | string) => {
      try {
        const text = data.toString();
        const msg = JSON.parse(text);
        const event = msg.event || msg.type;
        const payload = msg.data || msg.payload || {};

        switch (event) {
          case "JOIN_TRIP": {
            const tripId = payload.tripId as string;
            if (!tripId) break;

            // Verify membership
            const membership = await prisma.tripMember.findUnique({
              where: {
                tripId_userId: {
                  tripId,
                  userId: ws.userId,
                },
              },
            });

            if (!membership) {
              ws.send(
                JSON.stringify({
                  event: "ERROR",
                  message: "Unauthorized: You are not a member of this trip",
                  tripId,
                }),
              );
              break;
            }

            if (!tripRooms.has(tripId)) {
              tripRooms.set(tripId, new Set());
            }
            tripRooms.get(tripId)!.add(ws);
            ws.tripRooms.add(tripId);

            ws.send(
              JSON.stringify({
                event: "JOINED_TRIP",
                data: {
                  tripId,
                  userId: ws.userId,
                  userName: ws.userName,
                },
              }),
            );
            break;
          }

          case "LEAVE_TRIP": {
            const tripId = payload.tripId as string;
            if (tripId && tripRooms.has(tripId)) {
              tripRooms.get(tripId)!.delete(ws);
              ws.tripRooms.delete(tripId);
            }
            ws.send(
              JSON.stringify({
                event: "LEFT_TRIP",
                data: { tripId },
              }),
            );
            break;
          }

          case "PING": {
            ws.send(JSON.stringify({ event: "PONG", timestamp: Date.now() }));
            break;
          }

          default:
            logger.debug({ event }, "Unknown WebSocket client event");
        }
      } catch (err) {
        logger.warn({ err }, "Error processing WebSocket message");
      }
    });

    ws.on("close", () => {
      // Remove from all trip rooms
      for (const tripId of ws.tripRooms) {
        const room = tripRooms.get(tripId);
        if (room) {
          room.delete(ws);
          if (room.size === 0) {
            tripRooms.delete(tripId);
          }
        }
      }
      logger.debug({ userId: ws.userId }, "WebSocket client disconnected");
    });
  });

  // Heartbeat monitoring every 30 seconds
  heartbeatInterval = setInterval(() => {
    if (!wss) return;
    for (const ws of wss.clients) {
      const authWs = ws as AuthenticatedWebSocket;
      if (authWs.isAlive === false) {
        authWs.terminate();
      } else {
        authWs.isAlive = false;
        authWs.ping();
      }
    }
  }, 30000);

  logger.info("📡 GalaPH Realtime WebSocket Hub initialized.");
  return wss;
}

/**
 * Returns the active WebSocketServer instance.
 */
export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

/**
 * Gracefully shuts down the WebSocketServer and cleans up timers.
 */
export async function closeWebSocketServer(): Promise<void> {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  tripRooms.clear();

  if (wss) {
    for (const client of wss.clients) {
      client.terminate();
    }
    await new Promise<void>((resolve) => {
      wss?.close(() => {
        wss = null;
        resolve();
      });
    });
  }
}
