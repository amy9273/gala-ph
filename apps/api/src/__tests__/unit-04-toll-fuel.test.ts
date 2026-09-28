import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../app.js";
import { disconnectPrisma } from "../lib/prisma.js";
import { getRedisClient } from "../lib/redis.js";

describe("Unit 04: Toll & Fuel Calculation Engine", () => {
  let authToken = "";
  let testTripId = "";

  before(async () => {
    // Register test user and create a trip for transit estimate attachment
    const authRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `driver_${Date.now()}@gala-ph.dev`,
        password: "DriveSafe2026!",
        name: "Driver Carlo",
        phone: "09173334455",
      });

    assert.strictEqual(authRes.status, 201);
    authToken = authRes.body.token;

    const tripRes = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Elyu Surf Express",
        destination: "San Juan, La Union",
        startDate: "2026-10-16T00:00:00.000Z",
        endDate: "2026-10-18T23:59:59.000Z",
        travelMode: "PRIVATE_CAR",
      });

    assert.strictEqual(tripRes.status, 201);
    testTripId = tripRes.body.trip.id;
  });

  after(async () => {
    const redis = getRedisClient();
    if (redis) {
      redis.disconnect();
    }
    await disconnectPrisma();
  });

  describe("1. Preset Philippine Road Trip Routes", () => {
    it("should list all available preset road trip routes", async () => {
      const res = await request(app).get("/api/v1/toll/presets");

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.presets));
      assert.ok(res.body.presets.length >= 5);

      let foundElyu = false;
      for (const preset of res.body.presets) {
        if (preset.id === "MANILA_TO_LA_UNION") {
          foundElyu = true;
          assert.strictEqual(preset.destination, "San Juan, La Union");
          assert.strictEqual(preset.segmentCount, 4);
        }
      }
      assert.ok(foundElyu, "Preset MANILA_TO_LA_UNION should exist");
    });
  });

  describe("2. Dual-RFID Toll Matrix & Isolation (Manila to Elyu)", () => {
    it("should calculate exact toll and isolate Autosweep vs Easytrip for Manila to La Union", async () => {
      const res = await request(app).post("/api/v1/toll/calculate").send({
        presetRoute: "MANILA_TO_LA_UNION",
        classType: 1,
      });

      assert.strictEqual(res.status, 200);
      const data = res.body;

      // 4 evaluated legs: Skyway 3, NLEX, SCTEX, TPLEX
      assert.strictEqual(data.legs.length, 4);

      // Verify Grand Total: ₱264 + ₱302 + ₱114 + ₱311 = ₱991.00 (99,100 centavos)
      assert.strictEqual(data.totalTollPesos, 991.0);
      assert.strictEqual(data.totalTollCentavos, 99100);
      assert.ok(data.formattedTotalToll.includes("991.00"));

      // Verify Dual-RFID Isolation:
      // Autosweep: Skyway 3 (₱264) + TPLEX (₱311) = ₱575.00
      const autosweep = data.rfidBreakdown.autosweep;
      assert.ok(autosweep, "Autosweep breakdown required");
      assert.strictEqual(autosweep.totalPesos, 575.0);
      assert.strictEqual(autosweep.totalCentavos, 57500);
      assert.strictEqual(autosweep.recommendedTopUpPesos, 600.0);
      assert.strictEqual(autosweep.legs.length, 2);

      // Easytrip: NLEX (₱302) + SCTEX (₱114) = ₱416.00
      const easytrip = data.rfidBreakdown.easytrip;
      assert.ok(easytrip, "Easytrip breakdown required");
      assert.strictEqual(easytrip.totalPesos, 416.0);
      assert.strictEqual(easytrip.totalCentavos, 41600);
      assert.strictEqual(easytrip.recommendedTopUpPesos, 450.0);
      assert.strictEqual(easytrip.legs.length, 2);
    });

    it("should apply Class 2 rates for Manila to Tagaytay (Coaster / Van)", async () => {
      const res = await request(app).post("/api/v1/toll/calculate").send({
        presetRoute: "MANILA_TO_TAGAYTAY",
        classType: 2,
      });

      assert.strictEqual(res.status, 200);
      const data = res.body;

      // SLEX Magallanes -> Santa Rosa (Class 2: ₱328)
      // CALAX Mamplasan -> Aguinaldo (Class 2: ₱420)
      // Total: ₱748.00
      assert.strictEqual(data.totalTollPesos, 748.0);
      assert.strictEqual(data.totalTollCentavos, 74800);
      assert.strictEqual(data.rfidBreakdown.autosweep.totalPesos, 328.0);
      assert.strictEqual(data.rfidBreakdown.easytrip.totalPesos, 420.0);
    });
  });

  describe("3. Plaza Symmetrical Bidirectional Lookup & Custom Routes", () => {
    it("should resolve reverse plaza order using symmetrical fallback", async () => {
      // Query Dau to Balintawak (southbound)
      const res = await request(app)
        .post("/api/v1/toll/calculate")
        .send({
          segments: [
            {
              expressway: "NLEX",
              entryPlaza: "Dau",
              exitPlaza: "Balintawak",
            },
          ],
          classType: 1,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.legs.length, 1);
      assert.strictEqual(res.body.totalTollPesos, 302.0);
      assert.strictEqual(res.body.legs[0].rfidProvider, "EASYTRIP");
    });

    it("should return 404 when querying non-existent plaza segment", async () => {
      const res = await request(app)
        .post("/api/v1/toll/calculate")
        .send({
          segments: [
            {
              expressway: "NLEX",
              entryPlaza: "Balintawak",
              exitPlaza: "NonExistentExitPlaza",
            },
          ],
          classType: 1,
        });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error.code, "NOT_FOUND");
    });
  });

  describe("4. Philippine Fuel Consumption & Cost Calculator", () => {
    it("should accurately estimate fuel consumption for 1.5L Sedan on 275km Elyu trip", async () => {
      const res = await request(app).post("/api/v1/toll/fuel-estimate").send({
        distanceKm: 275,
        vehiclePreset: "SEDAN_1_5L",
        fuelType: "GASOLINE_95",
      });

      assert.strictEqual(res.status, 200);
      const data = res.body;

      // 275 km / 12.5 km/L = 22.0 Liters
      assert.strictEqual(data.litersNeeded, 22.0);
      assert.strictEqual(data.fuelEfficiencyKmPerLiter, 12.5);
      assert.strictEqual(data.pricePerLiter, 63.0);

      // 22.0 L * ₱63.00/L = ₱1,386.00 (138,600 centavos)
      assert.strictEqual(data.totalFuelPesos, 1386.0);
      assert.strictEqual(data.totalFuelCentavos, 138600);
      assert.ok(data.formattedTotalFuel.includes("1,386.00"));
    });

    it("should support custom fuel economy and fuel prices", async () => {
      const res = await request(app).post("/api/v1/toll/fuel-estimate").send({
        distanceKm: 200,
        vehiclePreset: "CUSTOM",
        fuelEfficiencyKmPerLiter: 10.0,
        fuelType: "CUSTOM",
        pricePerLiter: 50.0,
      });

      assert.strictEqual(res.status, 200);
      // 200 km / 10 km/L = 20 L * 50 = ₱1,000.00
      assert.strictEqual(res.body.litersNeeded, 20.0);
      assert.strictEqual(res.body.totalFuelPesos, 1000.0);
      assert.strictEqual(res.body.totalFuelCentavos, 100000);
    });
  });

  describe("5. Trip Transit Integration & Vehicle Tagging", () => {
    it("should attach toll estimates to trip with designated vehicleId", async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${testTripId}/toll-estimates`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          vehicleId: "car-vios-juan",
          presetRoute: "MANILA_TO_LA_UNION",
          classType: 1,
        });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.estimates);
      assert.strictEqual(res.body.estimates.length, 4);
      assert.strictEqual(res.body.vehicleId, "car-vios-juan");
      assert.strictEqual(res.body.summary.totalTollPesos, 991.0);

      for (const estimate of res.body.estimates) {
        assert.strictEqual(estimate.tripId, testTripId);
        assert.strictEqual(estimate.vehicleId, "car-vios-juan");
      }
    });

    it("should reject non-member from attaching toll estimates to a trip", async () => {
      const otherAuth = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `stranger_${Date.now()}@gala-ph.dev`,
          password: "StrangerPass123!",
          name: "Stranger NonMember",
          phone: "09179998811",
        });

      const res = await request(app)
        .post(`/api/v1/trips/${testTripId}/toll-estimates`)
        .set("Authorization", `Bearer ${otherAuth.body.token}`)
        .send({
          presetRoute: "MANILA_TO_LA_UNION",
          classType: 1,
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, "FORBIDDEN");
    });
  });
});
