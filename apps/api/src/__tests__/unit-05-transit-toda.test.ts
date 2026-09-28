import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../app.js";
import { disconnectPrisma } from "../lib/prisma.js";
import { getRedisClient } from "../lib/redis.js";

describe("Unit 05: Commuter Transit & TODA Tariff Engine", () => {
  let authToken = "";
  let testTripId = "";

  before(async () => {
    // Register commuter user and create trip for transit leg attachment
    const authRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `commuter_${Date.now()}@gala-ph.dev`,
        password: "CommuteSafe2026!",
        name: "Commuter Bea",
        phone: "09187776655",
      });

    assert.strictEqual(authRes.status, 201);
    authToken = authRes.body.token;

    const tripRes = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Elyu Commuter Adventure",
        destination: "San Juan, La Union",
        startDate: "2026-10-16T00:00:00.000Z",
        endDate: "2026-10-18T23:59:59.000Z",
        travelMode: "COMMUTE_BUS",
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

  describe("1. Provincial Transit Hubs Directory", () => {
    it("should list all major provincial terminals (PITX, Cubao, Buendia)", async () => {
      const res = await request(app).get("/api/v1/transit/hubs");

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.hubs));
      assert.ok(res.body.hubs.length >= 3);

      const hubNames: string[] = [];
      for (const hub of res.body.hubs) {
        hubNames.push(hub.name);
      }

      assert.ok(hubNames.some((h) => h.includes("PITX")));
      assert.ok(hubNames.some((h) => h.includes("Cubao")));
      assert.ok(hubNames.some((h) => h.includes("Buendia")));
    });
  });

  describe("2. Provincial Bus Schedules & GTFS Search", () => {
    it("should search bus routes to La Union and return Genesis JoyBus details", async () => {
      const res = await request(app)
        .get("/api/v1/transit/buses")
        .query({ destination: "La Union" });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.routes));
      assert.ok(res.body.routes.length >= 1);

      const joybus = res.body.routes[0];
      assert.ok(joybus.operatorName.includes("Genesis"));
      assert.strictEqual(joybus.baseFare, 850.0);
      assert.strictEqual(joybus.baseFareCentavos, 85000);
      assert.ok(joybus.formattedFare.includes("850.00"));
      assert.ok(joybus.firstTrip);
      assert.ok(joybus.lastTrip);
    });

    it("should search bus routes to Batangas from Buendia terminal", async () => {
      const res = await request(app)
        .get("/api/v1/transit/buses")
        .query({ destination: "Batangas", origin: "Buendia" });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.routes));
      assert.ok(res.body.routes.length >= 1);

      const batangasBus = res.body.routes[0];
      assert.strictEqual(batangasBus.baseFare, 210.0);
      assert.strictEqual(batangasBus.baseFareCentavos, 21000);
    });
  });

  describe("3. Official TODA Tariff Directory & Dialect Tips", () => {
    it("should retrieve official San Juan La Union TODA tariffs with Ilocano dialect tips", async () => {
      const res = await request(app)
        .get("/api/v1/transit/toda")
        .query({ municipality: "San Juan, La Union" });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.tariffs));
      assert.ok(res.body.tariffs.length >= 2);

      let urbiztondo = null;
      for (const tariff of res.body.tariffs) {
        if (tariff.barangayOrZone === "Urbiztondo") {
          urbiztondo = tariff;
          break;
        }
      }

      assert.ok(urbiztondo, "Urbiztondo tariff required");
      assert.strictEqual(urbiztondo.regularFarePerHead, 25.0);
      assert.strictEqual(urbiztondo.specialTripFare, 100.0);
      assert.strictEqual(urbiztondo.nightDiffFare, 120.0);
      assert.strictEqual(urbiztondo.lastTripCurfew, "21:30");
      assert.ok(urbiztondo.dialectTips.includes("Mano ti plete"));
    });

    it("should search TODA by zone query and return Batangas Wawa Port with Batangueño tips", async () => {
      const res = await request(app)
        .get("/api/v1/transit/toda")
        .query({ query: "Wawa" });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.tariffs));
      assert.ok(res.body.tariffs.length >= 1);

      const wawa = res.body.tariffs[0];
      assert.strictEqual(wawa.municipality, "Nasugbu, Batangas");
      assert.strictEqual(wawa.regularFarePerHead, 20.0);
      assert.strictEqual(wawa.specialTripFare, 80.0);
      assert.ok(wawa.dialectTips.includes("Bossing, gaano ga"));
    });
  });

  describe("4. End-to-End Multi-Leg Commuter Itinerary Planner", () => {
    it("should plan multi-leg route (Cubao Bus + San Juan TODA) for 3 commuters to Elyu", async () => {
      const res = await request(app).post("/api/v1/transit/plan").send({
        origin: "Cubao",
        destination: "Urbiztondo Beachfront, La Union",
        passengers: 3,
      });

      assert.strictEqual(res.status, 200);
      const plan = res.body;

      // 2 legs: Genesis JoyBus + Local TODA
      assert.strictEqual(plan.legs.length, 2);

      const leg1 = plan.legs[0];
      assert.strictEqual(leg1.modeType, "BUS");
      assert.strictEqual(leg1.farePerHead, 850.0);

      const leg2 = plan.legs[1];
      assert.strictEqual(leg2.modeType, "TRICYCLE");
      assert.strictEqual(leg2.farePerHead, 25.0);

      // Total per head: ₱850 + ₱25 = ₱875.00 (87,500 centavos)
      assert.strictEqual(plan.totalFarePerHeadPesos, 875.0);
      assert.strictEqual(plan.totalFarePerHeadCentavos, 87500);

      // Total group (3 pax): ₱875 * 3 = ₱2,625.00 (262,500 centavos)
      assert.strictEqual(plan.totalGroupFarePesos, 2625.0);
      assert.strictEqual(plan.totalGroupFareCentavos, 262500);

      // Curfew and Dialect Tips
      assert.strictEqual(plan.hasCurfewWarning, true);
      assert.ok(plan.curfewAdvisory.includes("21:30"));
      assert.ok(plan.dialectTips.includes("Ilocano"));
    });
  });

  describe("5. Trip Transit Legs Attachment", () => {
    it("should attach planned transit legs to a barkada trip", async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${testTripId}/transit-legs`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          legs: [
            {
              stepNumber: 1,
              modeType: "BUS",
              operatorName: "Genesis JoyBus",
              origin: "Cubao Terminal",
              destination: "San Juan Town Plaza",
              farePerHead: 850.0,
              notes: "Depart 04:00 AM",
            },
            {
              stepNumber: 2,
              modeType: "TRICYCLE",
              operatorName: "San Juan TODA",
              origin: "San Juan Town Plaza",
              destination: "Urbiztondo Beachfront",
              farePerHead: 25.0,
              specialTripFare: 100.0,
              lastTripTime: "21:30",
              notes: "Take tricycle to hostel beachfront",
            },
          ],
        });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.legs);
      assert.strictEqual(res.body.legs.length, 2);
      assert.strictEqual(res.body.legs[0].tripId, testTripId);
      assert.strictEqual(res.body.legs[0].stepNumber, 1);
      assert.strictEqual(res.body.legs[1].stepNumber, 2);
    });

    it("should reject non-member from attaching transit legs to trip", async () => {
      const strangerAuth = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `stranger_transit_${Date.now()}@gala-ph.dev`,
          password: "StrangerPass123!",
          name: "Stranger NonMember",
          phone: "09171112233",
        });

      const res = await request(app)
        .post(`/api/v1/trips/${testTripId}/transit-legs`)
        .set("Authorization", `Bearer ${strangerAuth.body.token}`)
        .send({
          legs: [
            {
              stepNumber: 1,
              modeType: "BUS",
              origin: "Cubao",
              destination: "La Union",
              farePerHead: 850.0,
            },
          ],
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, "FORBIDDEN");
    });
  });
});
