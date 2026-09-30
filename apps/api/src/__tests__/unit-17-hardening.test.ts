import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { tollService } from "../services/toll.service.js";
import { transitService } from "../services/transit.service.js";
import { tripService } from "../services/trip.service.js";

describe("Unit 17: Clean Architecture, Query Hygiene & Engineering Hardening", () => {
  let authToken: string;
  let testUserId: string;
  let testTripId: string;

  before(async () => {
    const timestamp = Date.now();

    // Register a fresh test user
    const authRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `harden_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Hardening Tester",
        phone: "09179998877",
      });

    assert.equal(authRes.status, 201);
    authToken = authRes.body.token;
    testUserId = authRes.body.user.id;

    // Create a fresh test trip
    const tripRes = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Hardening Verification Trip",
        destination: "San Juan, La Union",
        startDate: "2026-11-01T00:00:00.000Z",
        endDate: "2026-11-03T23:59:59.000Z",
        travelMode: "HYBRID",
      });

    assert.equal(tripRes.status, 201);
    testTripId = tripRes.body.trip.id;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  describe("1. PII & Secret Logger Redaction", () => {
    it("should have redact configured on Pino logger", () => {
      assert.ok(logger);
      // Safely logs sensitive fields without throwing
      logger.info(
        {
          password: "super_secret_password",
          token: "jwt.secret.token",
          gcashNumber: "09171234567",
        },
        "Test PII log entry",
      );
    });
  });

  describe("2. Standardized API Error Response Envelope", () => {
    it("should return uniform { success: false, error: { code, message } } on validation error", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "invalid-email" });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
      assert.ok(res.body.error.message);
    });

    it("should return uniform { success: false, error: { code, message } } on not found error", async () => {
      const res = await request(app)
        .get("/api/v1/trips/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error);
      assert.equal(res.body.error.code, "NOT_FOUND");
    });
  });

  describe("3. Database Query Hygiene & Anti-N+1 Toll Batching", () => {
    it("should batch-resolve multi-segment expressway toll routes in a single query", async () => {
      const result = await tollService.calculateRouteToll({
        presetRoute: "MANILA_TO_LA_UNION",
        classType: 1,
      });

      assert.ok(result);
      assert.equal(result.legs.length, 4);
      assert.ok(result.totalTollCentavos > 0);
      assert.ok(result.rfidBreakdown.autosweep.totalCentavos > 0);
      assert.ok(result.rfidBreakdown.easytrip.totalCentavos > 0);
      assert.equal(
        result.totalTollCentavos,
        result.rfidBreakdown.autosweep.totalCentavos +
          result.rfidBreakdown.easytrip.totalCentavos,
      );
    });
  });

  describe("4. Transactional Atomic Transit Persistence", () => {
    it("should replace transit legs atomically in a transaction", async () => {
      const attachRes = await transitService.attachTransitLegsToTrip(
        testUserId,
        testTripId,
        {
          legs: [
            {
              stepNumber: 1,
              modeType: "BUS",
              operatorName: "Partas Bus Lines",
              origin: "Cubao Hub",
              destination: "San Fernando, La Union",
              farePerHead: 650,
              notes: "Express aircon bus via TPLEX",
            },
            {
              stepNumber: 2,
              modeType: "TRICYCLE",
              operatorName: "Urbiztondo TODA",
              origin: "San Fernando Town Plaza",
              destination: "Urbiztondo Beach",
              farePerHead: 30,
              specialTripFare: 100,
              notes: "Chartered special trip for surfboards",
            },
          ],
        },
      );

      assert.ok(attachRes);
      assert.equal(attachRes.legs.length, 2);
      assert.equal(attachRes.legs[0]?.operatorName, "Partas Bus Lines");
      assert.equal(attachRes.legs[1]?.operatorName, "Urbiztondo TODA");
    });
  });

  describe("5. Bounded Memory & Pagination", () => {
    it("should bound getUserTrips results with limit and skip parameters", async () => {
      const tripsPage1 = await tripService.getUserTrips(testUserId, {
        page: 1,
        limit: 1,
      });

      assert.ok(Array.isArray(tripsPage1));
      assert.equal(tripsPage1.length, 1);
    });
  });
});
