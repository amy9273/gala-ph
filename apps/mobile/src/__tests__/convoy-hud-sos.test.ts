import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { sqliteClient } from "../lib/sqlite/db";
import { outboxRepository } from "../lib/sqlite/repositories/outbox.repository";
import {
  ConvoyService,
  getCompassHeading,
  getSpeedColorCategory,
  STRAGGLER_DISTANCE_THRESHOLD_KM,
} from "../services/convoy.service";

describe("Unit 14: Mobile Convoy HUD, Radar & Roadside SOS Engine", () => {
  let convoyService: ConvoyService;

  before(async () => {
    // Initialize in-memory SQLite schema for testing
    await sqliteClient.resetDatabase();
    convoyService = new ConvoyService();
  });

  describe("1. Convoy Telemetry, Distance Calculation & Compass Headings", () => {
    it("should convert compass degrees accurately into 16-cardinal points", () => {
      assert.equal(getCompassHeading(0), "N");
      assert.equal(getCompassHeading(360), "N");
      assert.equal(getCompassHeading(90), "E");
      assert.equal(getCompassHeading(180), "S");
      assert.equal(getCompassHeading(270), "W");
      assert.equal(getCompassHeading(337.5), "NNW");
      assert.equal(getCompassHeading(350), "N");
      assert.equal(getCompassHeading(45), "NE");
      assert.equal(getCompassHeading(135), "SE");
    });

    it("should classify vehicle velocity states into ergonomic color categories", () => {
      assert.equal(getSpeedColorCategory(60), "cruising");
      assert.equal(getSpeedColorCategory(80), "expressway");
      assert.equal(getSpeedColorCategory(100), "expressway");
      assert.equal(getSpeedColorCategory(105), "overspeed");
    });

    it("should parse initial Elyu convoy preset and compute distances and relative positions", () => {
      convoyService.loadPreset("ELYU_CORRIDOR");
      const summary = convoyService.recalculateTelemetrySummary();

      assert.equal(summary.totalVehicles, 3);
      assert.ok(summary.convoySpreadKm > 0, "Convoy spread should be positive");
      assert.ok(summary.leadVehicle, "Lead vehicle should be identified");
      assert.equal(summary.leadVehicle?.userName, "Kuya Mark (Lead)");
      assert.equal(summary.trailingVehicle?.userName, "Miggy (Tail)");

      const vehicles = convoyService.getVehicles();
      const myVehicle = vehicles.find(
        (v) => v.vehicleId === summary.myVehicleId,
      );
      assert.ok(myVehicle, "My vehicle should exist in convoy list");
      assert.equal(myVehicle?.distanceFromMeKm, 0);
      assert.equal(myVehicle?.relativePosition, "CURRENT");
    });
  });

  describe("2. Straggler Proximity Detection & Spread Math", () => {
    it("should flag vehicles exceeding straggler distance threshold (> 5.0 km)", () => {
      convoyService.loadPreset("ELYU_CORRIDOR");

      // Update peer vehicle (Miggy) to be ~8km behind
      convoyService.updatePeerTelemetry({
        userId: "usr-miggy-003",
        userName: "Miggy (Tail)",
        vehicleId: "veh-wigo-03",
        vehicleName: "Toyota Wigo (Red)",
        latitude: 16.38, // Farther south from 16.468
        longitude: 120.31,
        speedKmh: 60,
        heading: 350,
        batteryLevel: 50,
      });

      const summary = convoyService.recalculateTelemetrySummary();
      assert.ok(
        summary.stragglers.length >= 1,
        "Should detect at least one straggler",
      );

      const straggler = summary.stragglers.find(
        (s) => s.vehicleId === "veh-wigo-03",
      );
      assert.ok(straggler, "Miggy should be identified as straggler");
      assert.ok(
        (straggler?.distanceFromMeKm ?? 0) >= STRAGGLER_DISTANCE_THRESHOLD_KM,
      );
      assert.equal(straggler?.isStraggler, true);
    });
  });

  describe("3. Driver Quick Status & Outbox Enqueueing", () => {
    it("should update driver status and queue outbox mutation for offline sync", async () => {
      const summary = await convoyService.updateMyQuickStatus(
        "trip-elyu-001",
        "REFUEL",
      );

      const myVehicle =
        summary.leadVehicle?.relativePosition === "CURRENT"
          ? summary.leadVehicle
          : convoyService
              .getVehicles()
              .find((v) => v.vehicleId === summary.myVehicleId);

      assert.equal(myVehicle?.quickStatus, "REFUEL");

      // Check SQLite outbox
      const pendingMutations = await outboxRepository.getPending();
      const statusMutation = pendingMutations.find(
        (m) => m.mutationType === "UPDATE_DRIVER_STATUS",
      );
      assert.ok(
        statusMutation,
        "Should have queued UPDATE_DRIVER_STATUS mutation",
      );
      assert.equal(
        (statusMutation?.payload as Record<string, unknown>).quickStatus,
        "REFUEL",
      );
    });
  });

  describe("4. 1-Tap Roadside Emergency SOS Dispatch & Resolution", () => {
    it("should broadcast SOS alert, set EMERGENCY_STOP, and queue TRIGGER_SOS mutation", async () => {
      const sosAlert = await convoyService.triggerSos({
        tripId: "trip-elyu-001",
        userId: "usr-sarah-002",
        userName: "Sarah (Me)",
        userPhone: "+639189876543",
        reason: "FLAT_TIRE",
        latitude: 16.468,
        longitude: 120.318,
        details: "Punctured right rear tire on TPLEX km 184",
      });

      assert.ok(sosAlert.id.startsWith("sos-"));
      assert.equal(sosAlert.reason, "FLAT_TIRE");
      assert.equal(sosAlert.isResolved, false);

      const activeSos = convoyService.getActiveSos();
      assert.ok(activeSos, "Active SOS should be recorded");
      assert.equal(activeSos?.id, sosAlert.id);

      // Verify outbox mutation
      const pendingMutations = await outboxRepository.getPending();
      const triggerMutation = pendingMutations.find(
        (m) =>
          m.mutationType === "TRIGGER_SOS" &&
          (m.payload as Record<string, unknown>).id === sosAlert.id,
      );
      assert.ok(triggerMutation, "Should queue TRIGGER_SOS into outbox");
    });

    it("should resolve active SOS alert and queue RESOLVE_SOS mutation", async () => {
      const activeSos = convoyService.getActiveSos();
      assert.ok(activeSos, "Active SOS should exist from previous test");

      const resolved = await convoyService.resolveSos(
        "trip-elyu-001",
        activeSos!.id,
        "Sarah (Driver resolved)",
      );

      assert.ok(resolved, "Should successfully return resolved SOS");
      assert.equal(resolved?.isResolved, true);
      assert.equal(convoyService.getActiveSos(), null);

      // Verify outbox mutation
      const pendingMutations = await outboxRepository.getPending();
      const resolveMutation = pendingMutations.find(
        (m) =>
          m.mutationType === "RESOLVE_SOS" &&
          (m.payload as Record<string, unknown>).alertId === activeSos!.id,
      );
      assert.ok(resolveMutation, "Should queue RESOLVE_SOS into outbox");
    });
  });
});
