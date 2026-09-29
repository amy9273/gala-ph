import {
  calculateHaversineDistanceKm,
  type ConvoySosReason,
} from "@gala-ph/shared";
import { outboxRepository } from "../lib/sqlite/repositories/outbox.repository";
import type {
  ConvoyVehicleState,
  ConvoyTelemetrySummary,
  DriverQuickStatus,
} from "../types";

export const STRAGGLER_DISTANCE_THRESHOLD_KM = 5.0;

export interface TriggerSosInput {
  tripId: string;
  userId: string;
  userName: string;
  userPhone?: string;
  reason: ConvoySosReason;
  latitude: number;
  longitude: number;
  details?: string;
}

export interface ActiveSosState {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userPhone?: string;
  reason: ConvoySosReason;
  latitude: number;
  longitude: number;
  details?: string;
  isResolved: boolean;
  issuedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

/**
 * Converts degree heading (0-360) into 16-point cardinal compass text.
 */
export function getCompassHeading(headingDegrees: number): string {
  const normalized = ((headingDegrees % 360) + 360) % 360;
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index] || "N";
}

/**
 * Returns color category based on vehicle speed.
 */
export function getSpeedColorCategory(
  speedKmh: number,
): "cruising" | "expressway" | "overspeed" {
  if (speedKmh > 100) return "overspeed";
  if (speedKmh >= 80) return "expressway";
  return "cruising";
}

/**
 * Sample Convoy Presets for La Union & Baguio road trips.
 */
export const SAMPLE_CONVOY_PRESETS = {
  ELYU_CORRIDOR: {
    tripId: "trip-elyu-001",
    myVehicleId: "veh-innova-02",
    vehicles: [
      {
        userId: "usr-mark-001",
        userName: "Kuya Mark (Lead)",
        vehicleId: "veh-vios-01",
        vehicleName: "Toyota Vios (Silver)",
        driverPhone: "+639171234567",
        latitude: 16.482,
        longitude: 120.32,
        speedKmh: 88,
        heading: 350,
        batteryLevel: 92,
        updatedAt: new Date().toISOString(),
        quickStatus: "CRUISING" as DriverQuickStatus,
      },
      {
        userId: "usr-sarah-002",
        userName: "Sarah (Me)",
        vehicleId: "veh-innova-02",
        vehicleName: "Toyota Innova (Black)",
        driverPhone: "+639189876543",
        latitude: 16.468,
        longitude: 120.318,
        speedKmh: 84,
        heading: 350,
        batteryLevel: 80,
        updatedAt: new Date().toISOString(),
        quickStatus: "CRUISING" as DriverQuickStatus,
      },
      {
        userId: "usr-miggy-003",
        userName: "Miggy (Tail)",
        vehicleId: "veh-wigo-03",
        vehicleName: "Toyota Wigo (Red)",
        driverPhone: "+639205551234",
        latitude: 16.415,
        longitude: 120.312,
        speedKmh: 68,
        heading: 350,
        batteryLevel: 58,
        updatedAt: new Date().toISOString(),
        quickStatus: "CRUISING" as DriverQuickStatus,
      },
    ],
  },
};

export class ConvoyService {
  private activeSos: ActiveSosState | null = null;
  private currentVehicles: ConvoyVehicleState[] = [];
  private myUserId: string = "usr-sarah-002";
  private myVehicleId: string = "veh-innova-02";

  constructor() {
    this.loadPreset("ELYU_CORRIDOR");
  }

  /**
   * Loads a preset simulation convoy state.
   */
  public loadPreset(presetKey: keyof typeof SAMPLE_CONVOY_PRESETS): void {
    const preset = SAMPLE_CONVOY_PRESETS[presetKey];
    this.myVehicleId = preset.myVehicleId;

    const myVehicleRaw =
      preset.vehicles.find(
        (v: (typeof preset.vehicles)[number]) =>
          v.vehicleId === this.myVehicleId,
      ) || preset.vehicles[0];
    const myLat = myVehicleRaw?.latitude ?? 16.468;
    const myLon = myVehicleRaw?.longitude ?? 120.318;

    this.currentVehicles = preset.vehicles.map(
      (v: (typeof preset.vehicles)[number]): ConvoyVehicleState => {
        const distKm = calculateHaversineDistanceKm(
          myLat,
          myLon,
          v.latitude,
          v.longitude,
        );
        let relativePosition: "AHEAD" | "BEHIND" | "CURRENT" = "CURRENT";
        if (v.vehicleId !== this.myVehicleId) {
          relativePosition = v.latitude >= myLat ? "AHEAD" : "BEHIND";
        }

        return {
          ...v,
          distanceFromMeKm: Math.round(distKm * 10) / 10,
          relativePosition,
          isStraggler: distKm >= STRAGGLER_DISTANCE_THRESHOLD_KM,
        };
      },
    );
  }

  /**
   * Sets the current user & vehicle identity.
   */
  public setIdentity(userId: string, vehicleId: string): void {
    this.myUserId = userId;
    this.myVehicleId = vehicleId;
  }

  /**
   * Updates current user's GPS telemetry beacon.
   */
  public updateMyTelemetry(params: {
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number;
    batteryLevel?: number;
    quickStatus?: DriverQuickStatus;
  }): ConvoyTelemetrySummary {
    const now = new Date().toISOString();
    let myFound = false;

    this.currentVehicles = this.currentVehicles.map(
      (v: ConvoyVehicleState): ConvoyVehicleState => {
        if (v.vehicleId === this.myVehicleId || v.userId === this.myUserId) {
          myFound = true;
          return {
            ...v,
            latitude: params.latitude,
            longitude: params.longitude,
            speedKmh: params.speedKmh,
            heading: params.heading,
            batteryLevel: params.batteryLevel ?? v.batteryLevel,
            quickStatus: params.quickStatus ?? v.quickStatus,
            updatedAt: now,
            distanceFromMeKm: 0,
            relativePosition: "CURRENT",
            isStraggler: false,
          };
        }
        return v;
      },
    );

    if (!myFound) {
      this.currentVehicles.push({
        userId: this.myUserId,
        userName: "Me (Driver)",
        vehicleId: this.myVehicleId,
        vehicleName: "My Vehicle",
        latitude: params.latitude,
        longitude: params.longitude,
        speedKmh: params.speedKmh,
        heading: params.heading,
        batteryLevel: params.batteryLevel ?? 80,
        updatedAt: now,
        distanceFromMeKm: 0,
        relativePosition: "CURRENT",
        isStraggler: false,
        quickStatus: params.quickStatus ?? "CRUISING",
      });
    }

    // Recompute distances relative to new location
    return this.recalculateTelemetrySummary();
  }

  /**
   * Updates telemetry received from peer vehicles in convoy.
   */
  public updatePeerTelemetry(peer: {
    userId: string;
    userName: string;
    vehicleId: string;
    vehicleName: string;
    driverPhone?: string;
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number;
    batteryLevel?: number;
    quickStatus?: DriverQuickStatus;
  }): ConvoyTelemetrySummary {
    const now = new Date().toISOString();
    const existingIndex = this.currentVehicles.findIndex(
      (v: ConvoyVehicleState) => v.vehicleId === peer.vehicleId,
    );

    if (existingIndex >= 0) {
      const existing = this.currentVehicles[existingIndex];
      if (existing) {
        this.currentVehicles[existingIndex] = {
          ...existing,
          ...peer,
          updatedAt: now,
        };
      }
    } else {
      this.currentVehicles.push({
        ...peer,
        updatedAt: now,
        distanceFromMeKm: 0,
        relativePosition: "AHEAD",
        isStraggler: false,
        quickStatus: peer.quickStatus ?? "CRUISING",
      });
    }

    return this.recalculateTelemetrySummary();
  }

  /**
   * Updates the current driver's quick status (e.g. Pulled over, Refuel, Restroom).
   */
  public async updateMyQuickStatus(
    tripId: string,
    status: DriverQuickStatus,
  ): Promise<ConvoyTelemetrySummary> {
    const myVehicle = this.currentVehicles.find(
      (v: ConvoyVehicleState) =>
        v.vehicleId === this.myVehicleId || v.userId === this.myUserId,
    );
    if (myVehicle) {
      myVehicle.quickStatus = status;
      myVehicle.updatedAt = new Date().toISOString();
    }

    // Queue status change into outbox
    const idempotencyKey = `idemp-status-${tripId}-${this.myUserId}-${Date.now()}`;
    await outboxRepository.enqueue({
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tripId,
      mutationType: "UPDATE_DRIVER_STATUS",
      payload: {
        userId: this.myUserId,
        vehicleId: this.myVehicleId,
        quickStatus: status,
        updatedAt: new Date().toISOString(),
      },
      status: "PENDING",
      retryCount: 0,
      createdAt: new Date().toISOString(),
      idempotencyKey,
    });

    return this.recalculateTelemetrySummary();
  }

  /**
   * Triggers a high-priority 1-Tap Roadside SOS Beacon.
   */
  public async triggerSos(input: TriggerSosInput): Promise<ActiveSosState> {
    const alertId = `sos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const issuedAt = new Date().toISOString();

    const sosAlert: ActiveSosState = {
      id: alertId,
      tripId: input.tripId,
      userId: input.userId,
      userName: input.userName,
      userPhone: input.userPhone,
      reason: input.reason,
      latitude: input.latitude,
      longitude: input.longitude,
      details: input.details,
      isResolved: false,
      issuedAt,
    };

    this.activeSos = sosAlert;

    // Mark current vehicle status as EMERGENCY_STOP
    const myVeh = this.currentVehicles.find(
      (v: ConvoyVehicleState) =>
        v.userId === input.userId || v.vehicleId === this.myVehicleId,
    );
    if (myVeh) {
      myVeh.quickStatus = "EMERGENCY_STOP";
    }

    // Persist to Outbox for offline synchronization
    const idempotencyKey = `idemp-sos-${alertId}`;
    await outboxRepository.enqueue({
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tripId: input.tripId,
      mutationType: "TRIGGER_SOS",
      payload: sosAlert as unknown as Record<string, unknown>,
      status: "PENDING",
      retryCount: 0,
      createdAt: new Date().toISOString(),
      idempotencyKey,
    });

    return sosAlert;
  }

  /**
   * Resolves an active roadside SOS emergency.
   */
  public async resolveSos(
    tripId: string,
    alertId: string,
    resolvedBy: string,
  ): Promise<ActiveSosState | null> {
    if (!this.activeSos || this.activeSos.id !== alertId) {
      return null;
    }

    const resolvedAt = new Date().toISOString();
    this.activeSos.isResolved = true;
    this.activeSos.resolvedAt = resolvedAt;
    this.activeSos.resolvedBy = resolvedBy;

    const resolvedState = { ...this.activeSos };
    this.activeSos = null;

    // Reset vehicle status to CRUISING
    const myVeh = this.currentVehicles.find(
      (v: ConvoyVehicleState) => v.vehicleId === this.myVehicleId,
    );
    if (myVeh && myVeh.quickStatus === "EMERGENCY_STOP") {
      myVeh.quickStatus = "CRUISING";
    }

    // Queue resolution to outbox
    const idempotencyKey = `idemp-sos-resolve-${alertId}-${Date.now()}`;
    await outboxRepository.enqueue({
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tripId,
      mutationType: "RESOLVE_SOS",
      payload: {
        alertId,
        resolvedBy,
        resolvedAt,
      },
      status: "PENDING",
      retryCount: 0,
      createdAt: new Date().toISOString(),
      idempotencyKey,
    });

    return resolvedState;
  }

  /**
   * Returns current active SOS state, if any.
   */
  public getActiveSos(): ActiveSosState | null {
    return this.activeSos;
  }

  /**
   * Calculates comprehensive convoy telemetry summary.
   */
  public recalculateTelemetrySummary(): ConvoyTelemetrySummary {
    const myVehicle = this.currentVehicles.find(
      (v: ConvoyVehicleState) =>
        v.vehicleId === this.myVehicleId || v.userId === this.myUserId,
    );
    const myLat = myVehicle?.latitude ?? 16.468;
    const myLon = myVehicle?.longitude ?? 120.318;

    let maxSpreadKm = 0;
    const stragglers: ConvoyVehicleState[] = [];

    // Recompute distances for each vehicle
    this.currentVehicles = this.currentVehicles.map(
      (v: ConvoyVehicleState): ConvoyVehicleState => {
        if (v.vehicleId === this.myVehicleId || v.userId === this.myUserId) {
          return {
            ...v,
            distanceFromMeKm: 0,
            relativePosition: "CURRENT",
            isStraggler: false,
          };
        }

        const distKm = calculateHaversineDistanceKm(
          myLat,
          myLon,
          v.latitude,
          v.longitude,
        );
        const roundedDist = Math.round(distKm * 10) / 10;
        const relativePosition: "AHEAD" | "BEHIND" | "CURRENT" =
          v.latitude >= myLat ? "AHEAD" : "BEHIND";
        const isStraggler = roundedDist >= STRAGGLER_DISTANCE_THRESHOLD_KM;

        const updated = {
          ...v,
          distanceFromMeKm: roundedDist,
          relativePosition,
          isStraggler,
        };

        if (isStraggler) {
          stragglers.push(updated);
        }

        return updated;
      },
    );

    // Calculate maximum pairwise spread across all convoy vehicles
    for (let i = 0; i < this.currentVehicles.length; i++) {
      for (let j = i + 1; j < this.currentVehicles.length; j++) {
        const v1 = this.currentVehicles[i];
        const v2 = this.currentVehicles[j];
        if (v1 && v2) {
          const d = calculateHaversineDistanceKm(
            v1.latitude,
            v1.longitude,
            v2.latitude,
            v2.longitude,
          );
          if (d > maxSpreadKm) {
            maxSpreadKm = d;
          }
        }
      }
    }

    // Determine lead (highest latitude for northbound) and trailing vehicles
    const sorted = [...this.currentVehicles].sort(
      (a, b) => b.latitude - a.latitude,
    );
    const leadVehicle = sorted[0];
    const trailingVehicle =
      sorted.length > 1 ? sorted[sorted.length - 1] : undefined;

    return {
      tripId: "trip-elyu-001",
      myVehicleId: this.myVehicleId,
      totalVehicles: this.currentVehicles.length,
      convoySpreadKm: Math.round(maxSpreadKm * 10) / 10,
      leadVehicle,
      trailingVehicle,
      stragglers,
      activeSos: this.activeSos || undefined,
    };
  }

  /**
   * Returns current list of convoy vehicles.
   */
  public getVehicles(): ConvoyVehicleState[] {
    return [...this.currentVehicles];
  }
}

export const convoyService = new ConvoyService();
