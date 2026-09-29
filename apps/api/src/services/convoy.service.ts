import crypto from "node:crypto";
import {
  calculateHaversineDistanceKm,
  ConvoyBeacon,
  ConvoySosAlert,
} from "@gala-ph/shared";
import { prisma } from "../lib/prisma.js";
import { getRedisClient } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import { ConvoyPingDto, ConvoySosDto } from "../schemas/convoy.schema.js";
import { broadcastToTrip } from "../sockets/socket.server.js";

// In-memory fallback for environments without Redis
interface MemoryBeaconEntry {
  beacon: ConvoyBeacon;
  expiresAt: number;
}
const memoryBeacons = new Map<string, Map<string, MemoryBeaconEntry>>();
const memorySosAlerts = new Map<string, Map<string, ConvoySosAlert>>();

const BEACON_TTL_SECONDS = 60;
const SOS_TTL_SECONDS = 86400; // 24 hours
const STRAGGLER_DISTANCE_THRESHOLD_KM = 5.0; // 5 km gap triggers straggler advisory

export class ConvoyService {
  /**
   * Asserts that a user is an active member of the given trip.
   */
  private async assertTripMember(tripId: string, userId: string) {
    const membership = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError(
        "You are not authorized to view or transmit convoy telemetry for this trip",
      );
    }

    return membership;
  }

  /**
   * Records a live GPS telemetry ping from a vehicle or traveler in the convoy.
   */
  async recordBeacon(tripId: string, userId: string, dto: ConvoyPingDto) {
    const member = await this.assertTripMember(tripId, userId);

    const beacon: ConvoyBeacon = {
      tripId,
      userId,
      userName: member.user.name,
      vehicleId: dto.vehicleId ?? member.vehicleId ?? undefined,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speedKmh: dto.speedKmh ?? 0,
      heading: dto.heading ?? 0,
      batteryLevel: dto.batteryLevel ?? undefined,
      updatedAt: new Date().toISOString(),
    };

    const redis = getRedisClient();
    const beaconKey = `convoy:beacon:${tripId}:${userId}`;

    if (redis && redis.status === "ready") {
      try {
        await redis.set(
          beaconKey,
          JSON.stringify(beacon),
          "EX",
          BEACON_TTL_SECONDS,
        );
      } catch (err) {
        logger.warn({ err }, "Failed to write convoy beacon to Redis");
      }
    } else {
      // Memory fallback
      if (!memoryBeacons.has(tripId)) {
        memoryBeacons.set(tripId, new Map());
      }
      memoryBeacons.get(tripId)!.set(userId, {
        beacon,
        expiresAt: Date.now() + BEACON_TTL_SECONDS * 1000,
      });
    }

    // Broadcast GPS ping to all subscribed members in the trip
    broadcastToTrip(tripId, {
      type: "CONVOY_LOCATION_UPDATE",
      beacon,
    });

    // Evaluate straggler proximity against other active beacons
    try {
      await this.checkConvoyStragglers(tripId, beacon);
    } catch (err) {
      logger.debug({ err }, "Error checking straggler alerts");
    }

    return beacon;
  }

  /**
   * Retrieves all active convoy GPS beacons for a trip.
   */
  async getActiveBeacons(tripId: string, userId: string) {
    await this.assertTripMember(tripId, userId);

    const redis = getRedisClient();
    const activeBeacons: ConvoyBeacon[] = [];

    if (redis && redis.status === "ready") {
      try {
        // Find all active keys in this trip
        // Note: ioredis adds the keyPrefix to commands, but with keys pattern we match the sub-key
        const pattern = `convoy:beacon:${tripId}:*`;
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
          // If keyPrefix is configured in ioredis, keys returned from keys() might contain the prefix
          // Strip prefix if needed for mget or call directly
          const prefix = redis.options.keyPrefix || "";
          const rawKeys = keys.map((k) =>
            prefix && k.startsWith(prefix) ? k.slice(prefix.length) : k,
          );

          const values = await redis.mget(rawKeys);
          for (const raw of values) {
            if (raw) {
              try {
                const parsed = JSON.parse(raw) as ConvoyBeacon;
                activeBeacons.push(parsed);
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        logger.warn({ err }, "Failed to read convoy beacons from Redis");
      }
    } else {
      // Memory fallback lookup
      const tripMap = memoryBeacons.get(tripId);
      if (tripMap) {
        const now = Date.now();
        for (const [uid, entry] of tripMap.entries()) {
          if (entry.expiresAt > now) {
            activeBeacons.push(entry.beacon);
          } else {
            tripMap.delete(uid);
          }
        }
      }
    }

    // Compute maximum convoy spread in kilometers
    let maxSpreadKm = 0;
    if (activeBeacons.length >= 2) {
      for (let i = 0; i < activeBeacons.length; i++) {
        const b1 = activeBeacons[i];
        if (!b1) continue;
        for (let j = i + 1; j < activeBeacons.length; j++) {
          const b2 = activeBeacons[j];
          if (!b2) continue;
          const dist = calculateHaversineDistanceKm(
            b1.latitude,
            b1.longitude,
            b2.latitude,
            b2.longitude,
          );
          if (dist > maxSpreadKm) {
            maxSpreadKm = Math.round(dist * 100) / 100;
          }
        }
      }
    }

    return {
      tripId,
      activeCount: activeBeacons.length,
      maxSpreadKm,
      beacons: activeBeacons,
    };
  }

  /**
   * Internal routine to check if any vehicle has fallen behind the convoy lead.
   */
  private async checkConvoyStragglers(
    tripId: string,
    currentBeacon: ConvoyBeacon,
  ) {
    const beaconsData = await this.getActiveBeacons(
      tripId,
      currentBeacon.userId,
    );
    const beacons = beaconsData.beacons;

    if (beacons.length < 2) return;

    for (const other of beacons) {
      if (other.userId === currentBeacon.userId) continue;

      const dist = calculateHaversineDistanceKm(
        currentBeacon.latitude,
        currentBeacon.longitude,
        other.latitude,
        other.longitude,
      );

      if (dist >= STRAGGLER_DISTANCE_THRESHOLD_KM) {
        // Broadcast straggler alert
        broadcastToTrip(tripId, {
          type: "CONVOY_STRAGGLER_ALERT",
          alert: {
            tripId,
            distanceKm: Math.round(dist * 10) / 10,
            vehicle1: {
              userId: currentBeacon.userId,
              userName: currentBeacon.userName,
              vehicleId: currentBeacon.vehicleId,
            },
            vehicle2: {
              userId: other.userId,
              userName: other.userName,
              vehicleId: other.vehicleId,
            },
            advisory: `Convoy separation is ${Math.round(dist * 10) / 10}km between ${currentBeacon.userName} and ${other.userName}. Consider waiting at the next expressway toll plaza or gas station.`,
          },
        });
        break;
      }
    }
  }

  /**
   * Triggers an emergency roadside SOS beacon broadcast.
   */
  async triggerSos(tripId: string, userId: string, dto: ConvoySosDto) {
    const member = await this.assertTripMember(tripId, userId);

    const alertId = crypto.randomUUID();
    const alert: ConvoySosAlert = {
      id: alertId,
      tripId,
      userId,
      userName: member.user.name,
      userPhone: member.user.phone ?? undefined,
      reason: dto.reason,
      latitude: dto.latitude,
      longitude: dto.longitude,
      details: dto.details ?? undefined,
      isResolved: false,
      issuedAt: new Date().toISOString(),
    };

    const redis = getRedisClient();
    const sosKey = `convoy:sos:${tripId}:${alertId}`;

    if (redis && redis.status === "ready") {
      try {
        await redis.set(sosKey, JSON.stringify(alert), "EX", SOS_TTL_SECONDS);
      } catch (err) {
        logger.warn({ err }, "Failed to write SOS alert to Redis");
      }
    } else {
      if (!memorySosAlerts.has(tripId)) {
        memorySosAlerts.set(tripId, new Map());
      }
      memorySosAlerts.get(tripId)!.set(alertId, alert);
    }

    // Broadcast high-priority SOS alert
    broadcastToTrip(tripId, {
      type: "CONVOY_SOS_ALERT",
      alert,
    });

    return alert;
  }

  /**
   * Resolves / clears an active SOS emergency alert.
   */
  async resolveSos(tripId: string, userId: string, alertId: string) {
    const member = await this.assertTripMember(tripId, userId);

    const redis = getRedisClient();
    const sosKey = `convoy:sos:${tripId}:${alertId}`;
    let alert: ConvoySosAlert | null = null;

    if (redis && redis.status === "ready") {
      try {
        const raw = await redis.get(sosKey);
        if (raw) {
          alert = JSON.parse(raw) as ConvoySosAlert;
        }
      } catch (err) {
        logger.warn({ err }, "Failed to read SOS alert from Redis");
      }
    } else {
      const tripMap = memorySosAlerts.get(tripId);
      if (tripMap && tripMap.has(alertId)) {
        alert = tripMap.get(alertId)!;
      }
    }

    if (!alert) {
      throw new NotFoundError("SOS emergency alert not found or expired");
    }

    alert.isResolved = true;
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = member.user.name;

    if (redis && redis.status === "ready") {
      try {
        await redis.set(sosKey, JSON.stringify(alert), "EX", SOS_TTL_SECONDS);
      } catch (err) {
        logger.warn({ err }, "Failed to update SOS alert in Redis");
      }
    } else {
      memorySosAlerts.get(tripId)?.set(alertId, alert);
    }

    // Broadcast resolution to all trip members
    broadcastToTrip(tripId, {
      type: "CONVOY_SOS_RESOLVED",
      alert,
    });

    return alert;
  }

  /**
   * Retrieves all SOS alerts logged for a trip.
   */
  async getSosAlerts(tripId: string, userId: string) {
    await this.assertTripMember(tripId, userId);

    const redis = getRedisClient();
    const alerts: ConvoySosAlert[] = [];

    if (redis && redis.status === "ready") {
      try {
        const pattern = `convoy:sos:${tripId}:*`;
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
          const prefix = redis.options.keyPrefix || "";
          const rawKeys = keys.map((k) =>
            prefix && k.startsWith(prefix) ? k.slice(prefix.length) : k,
          );

          const values = await redis.mget(rawKeys);
          for (const raw of values) {
            if (raw) {
              try {
                alerts.push(JSON.parse(raw) as ConvoySosAlert);
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        logger.warn({ err }, "Failed to read SOS alerts from Redis");
      }
    } else {
      const tripMap = memorySosAlerts.get(tripId);
      if (tripMap) {
        for (const alert of tripMap.values()) {
          alerts.push(alert);
        }
      }
    }

    alerts.sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
    );

    return {
      tripId,
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter((a) => !a.isResolved).length,
      alerts,
    };
  }
}

export const convoyService = new ConvoyService();
