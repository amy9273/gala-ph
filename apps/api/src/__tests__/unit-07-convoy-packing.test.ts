import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import request from "supertest";
import { WebSocket } from "ws";
import { app } from "../app.js";
import { disconnectPrisma } from "../lib/prisma.js";
import { getRedisClient } from "../lib/redis.js";
import {
  initWebSocketServer,
  closeWebSocketServer,
} from "../sockets/socket.server.js";
import {
  calculateHaversineDistanceKm,
  calculateHaversineDistanceMeters,
} from "@gala-ph/shared";

describe("Unit 07: Realtime Convoy Telemetry & Bayanihan Packing Sync", () => {
  let juanToken = "";
  let juanId = "";
  let mariaToken = "";
  let mariaId = "";
  let carloToken = "";
  let carloId = "";
  let outsiderToken = "";

  let tripId = "";
  let inviteCode = "";

  let coolerItemId = "";
  let cordItemId = "";
  let medItemId = "";

  let activeSosAlertId = "";

  let httpServer: http.Server;
  let serverPort = 0;

  before(async () => {
    const timestamp = Date.now();

    // 1. Register Juan (Trip Lead, Driver CAR-01)
    const resJuan = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `juan_convoy_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Juan Dela Cruz",
        phone: "09171234567",
      });
    assert.strictEqual(resJuan.status, 201);
    juanToken = resJuan.body.token;
    juanId = resJuan.body.user.id;

    // 2. Register Maria (Driver CAR-02)
    const resMaria = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `maria_convoy_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Maria Santos",
        phone: "09189876543",
      });
    assert.strictEqual(resMaria.status, 201);
    mariaToken = resMaria.body.token;
    mariaId = resMaria.body.user.id;

    // 3. Register Carlo (Member / Passenger)
    const resCarlo = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `carlo_convoy_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Carlo Reyes",
        phone: "09195554321",
      });
    assert.strictEqual(resCarlo.status, 201);
    carloToken = resCarlo.body.token;
    carloId = resCarlo.body.user.id;

    // 4. Register Outsider
    const resOutsider = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `outsider_convoy_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Outsider Sam",
        phone: "09229998877",
      });
    assert.strictEqual(resOutsider.status, 201);
    outsiderToken = resOutsider.body.token;

    // 5. Juan creates Trip
    const resTrip = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${juanToken}`)
      .send({
        title: "Elyu Convoy & Packing Test Trip",
        destination: "San Juan, La Union",
        startDate: "2026-10-30T00:00:00.000Z",
        endDate: "2026-11-01T23:59:59.000Z",
        travelMode: "PRIVATE_CAR",
      });
    assert.strictEqual(resTrip.status, 201);
    tripId = resTrip.body.trip.id;
    inviteCode = resTrip.body.trip.inviteCode;

    // Juan sets driver profile
    await request(app)
      .patch(`/api/v1/trips/${tripId}/members/${juanId}`)
      .set("Authorization", `Bearer ${juanToken}`)
      .send({ isDriver: true, vehicleId: "CAR-01" });

    // Maria joins trip & sets driver profile
    await request(app)
      .post("/api/v1/trips/join")
      .set("Authorization", `Bearer ${mariaToken}`)
      .send({ inviteCode });
    await request(app)
      .patch(`/api/v1/trips/${tripId}/members/${mariaId}`)
      .set("Authorization", `Bearer ${mariaToken}`)
      .send({ isDriver: true, vehicleId: "CAR-02" });

    // Carlo joins trip
    await request(app)
      .post("/api/v1/trips/join")
      .set("Authorization", `Bearer ${carloToken}`)
      .send({ inviteCode });

    // Start HTTP and WebSocket test server on random port
    httpServer = http.createServer(app);
    initWebSocketServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        if (typeof address === "object" && address !== null) {
          serverPort = address.port;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await closeWebSocketServer();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });

    const redis = getRedisClient();
    if (redis) {
      redis.disconnect();
    }
    await disconnectPrisma();
  });

  describe("1. Bayanihan Shared Packing Checklist Engine", () => {
    it("should reject non-member from viewing packing list", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/packing`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      assert.strictEqual(res.status, 403);
    });

    it("should allow creating assignable packing items with categories", async () => {
      // 1. Juan creates Cooler assigned to himself
      const res1 = await request(app)
        .post(`/api/v1/trips/${tripId}/packing`)
        .set("Authorization", `Bearer ${juanToken}`)
        .send({
          itemName: "Coleman 40L Ice Cooler",
          category: "GEAR",
          quantity: 1,
          assignedToId: juanId,
        });
      assert.strictEqual(res1.status, 201);
      assert.strictEqual(res1.body.data.itemName, "Coleman 40L Ice Cooler");
      assert.strictEqual(res1.body.data.isPacked, false);
      assert.strictEqual(res1.body.data.assignedTo.name, "Juan Dela Cruz");
      coolerItemId = res1.body.data.id;

      // 2. Maria creates Extension Cord (unassigned)
      const res2 = await request(app)
        .post(`/api/v1/trips/${tripId}/packing`)
        .set("Authorization", `Bearer ${mariaToken}`)
        .send({
          itemName: "Extension Cord 10m Heavy Duty",
          category: "GEAR",
          quantity: 2,
        });
      assert.strictEqual(res2.status, 201);
      assert.strictEqual(res2.body.data.assignedToId, null);
      cordItemId = res2.body.data.id;

      // 3. Carlo creates First Aid Kit assigned to Maria
      const res3 = await request(app)
        .post(`/api/v1/trips/${tripId}/packing`)
        .set("Authorization", `Bearer ${carloToken}`)
        .send({
          itemName: "First Aid Kit & Biogesic",
          category: "MEDICAL",
          quantity: 1,
          assignedToId: mariaId,
        });
      assert.strictEqual(res3.status, 201);
      assert.strictEqual(res3.body.data.assignedTo.name, "Maria Santos");
      medItemId = res3.body.data.id;
    });

    it("should retrieve packing list with progress metrics summary", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/packing`)
        .set("Authorization", `Bearer ${carloToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.summary.totalItems, 3);
      assert.strictEqual(res.body.data.summary.packedItems, 0);
      assert.strictEqual(res.body.data.summary.unpackedItems, 3);
      assert.strictEqual(res.body.data.summary.completionPercentage, 0);
      assert.strictEqual(res.body.data.items.length, 3);
    });

    it("should toggle packing item packed state and record packedAt timestamp", async () => {
      // Check off the Cooler
      const toggleRes1 = await request(app)
        .patch(`/api/v1/trips/${tripId}/packing/${coolerItemId}/toggle`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(toggleRes1.status, 200);
      assert.strictEqual(toggleRes1.body.data.isPacked, true);
      assert.ok(toggleRes1.body.data.packedAt);

      // Verify updated summary (1 of 3 = 33%)
      const listRes = await request(app)
        .get(`/api/v1/trips/${tripId}/packing`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(listRes.body.data.summary.packedItems, 1);
      assert.strictEqual(listRes.body.data.summary.unpackedItems, 2);
      assert.strictEqual(listRes.body.data.summary.completionPercentage, 33);

      // Untoggle back to unpacked
      const toggleRes2 = await request(app)
        .patch(`/api/v1/trips/${tripId}/packing/${coolerItemId}/toggle`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(toggleRes2.status, 200);
      assert.strictEqual(toggleRes2.body.data.isPacked, false);
      assert.strictEqual(toggleRes2.body.data.packedAt, null);
    });

    it("should update packing item details (claim assignment & change quantity)", async () => {
      // Carlo claims the unassigned Extension Cord and changes quantity to 3
      const res = await request(app)
        .patch(`/api/v1/trips/${tripId}/packing/${cordItemId}`)
        .set("Authorization", `Bearer ${carloToken}`)
        .send({
          assignedToId: carloId,
          quantity: 3,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.assignedToId, carloId);
      assert.strictEqual(res.body.data.quantity, 3);
      assert.strictEqual(res.body.data.assignedTo.name, "Carlo Reyes");
    });

    it("should delete a packing item from the checklist", async () => {
      const res = await request(app)
        .delete(`/api/v1/trips/${tripId}/packing/${medItemId}`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.itemId, medItemId);

      const listRes = await request(app)
        .get(`/api/v1/trips/${tripId}/packing`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(listRes.body.data.summary.totalItems, 2);
    });
  });

  describe("2. Convoy GPS Telemetry & Straggler Calculation", () => {
    it("should calculate Haversine great-circle distances accurately", () => {
      // Distance from Manila (14.5995, 120.9842) to San Juan La Union (16.6744, 120.3341)
      const distKm = calculateHaversineDistanceKm(
        14.5995,
        120.9842,
        16.6744,
        120.3341,
      );
      assert.ok(distKm > 230 && distKm < 245, `Distance was ${distKm}km`);

      const distMeters = calculateHaversineDistanceMeters(
        14.5995,
        120.9842,
        16.6744,
        120.3341,
      );
      assert.strictEqual(distMeters, distKm * 1000);
    });

    it("should record GPS telemetry ping from Juan (Car 1)", async () => {
      // Balintawak Toll Plaza coordinates
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/convoy/ping`)
        .set("Authorization", `Bearer ${juanToken}`)
        .send({
          vehicleId: "CAR-01",
          latitude: 14.6575,
          longitude: 120.9986,
          speedKmh: 80.5,
          heading: 350.0,
          batteryLevel: 92,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.userName, "Juan Dela Cruz");
      assert.strictEqual(res.body.data.vehicleId, "CAR-01");
      assert.strictEqual(res.body.data.latitude, 14.6575);
      assert.strictEqual(res.body.data.longitude, 120.9986);
      assert.strictEqual(res.body.data.speedKmh, 80.5);
    });

    it("should record GPS telemetry ping from Maria (Car 2) and compute convoy separation", async () => {
      // Dau SCTEX Interchange coordinates (~72 km north of Balintawak)
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/convoy/ping`)
        .set("Authorization", `Bearer ${mariaToken}`)
        .send({
          vehicleId: "CAR-02",
          latitude: 15.1764,
          longitude: 120.5901,
          speedKmh: 75.0,
          heading: 340.0,
          batteryLevel: 78,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.userName, "Maria Santos");
      assert.strictEqual(res.body.data.vehicleId, "CAR-02");

      // Check active convoy beacons snapshot
      const locRes = await request(app)
        .get(`/api/v1/trips/${tripId}/convoy/locations`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(locRes.status, 200);
      assert.strictEqual(locRes.body.data.activeCount, 2);
      assert.ok(
        locRes.body.data.maxSpreadKm > 60,
        `Spread should be > 60km, got ${locRes.body.data.maxSpreadKm}`,
      );
    });

    it("should reject non-members from reading or posting convoy telemetry", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/convoy/locations`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      assert.strictEqual(res.status, 403);
    });
  });

  describe("3. Roadside SOS Emergency Beacon", () => {
    it("should trigger an emergency roadside SOS beacon", async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/convoy/sos`)
        .set("Authorization", `Bearer ${mariaToken}`)
        .send({
          reason: "FLAT_TIRE",
          latitude: 15.1764,
          longitude: 120.5901,
          details:
            "Rear right tire blowout near Dau exit. Need wrench assistance.",
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.data.id);
      assert.strictEqual(res.body.data.reason, "FLAT_TIRE");
      assert.strictEqual(res.body.data.userName, "Maria Santos");
      assert.strictEqual(res.body.data.userPhone, "+639189876543");
      assert.strictEqual(res.body.data.isResolved, false);
      activeSosAlertId = res.body.data.id;
    });

    it("should list active SOS alerts for the trip", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/convoy/sos`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.totalAlerts, 1);
      assert.strictEqual(res.body.data.activeAlerts, 1);
      assert.strictEqual(res.body.data.alerts[0].id, activeSosAlertId);
    });

    it("should resolve the active SOS emergency alert", async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/convoy/sos/resolve`)
        .set("Authorization", `Bearer ${juanToken}`)
        .send({ alertId: activeSosAlertId });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.isResolved, true);
      assert.strictEqual(res.body.data.resolvedBy, "Juan Dela Cruz");
      assert.ok(res.body.data.resolvedAt);

      // Verify active count is now 0
      const listRes = await request(app)
        .get(`/api/v1/trips/${tripId}/convoy/sos`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(listRes.body.data.activeAlerts, 0);
    });
  });

  describe("4. Realtime WebSocket Hub Integration", () => {
    it("should reject unauthenticated WebSocket handshake", async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}/ws`);

      await new Promise<void>((resolve) => {
        ws.on("error", () => {
          // Expected connection failure / 401
          resolve();
        });
        ws.on("close", (code) => {
          assert.ok(code === 1006 || code === 1005 || code === 1002);
          resolve();
        });
      });
    });

    it("should connect authenticated client and handle JOIN_TRIP room subscription", async () => {
      const wsJuan = new WebSocket(
        `ws://localhost:${serverPort}/ws?token=${juanToken}`,
      );

      await new Promise<void>((resolve, reject) => {
        wsJuan.on("open", () => {
          wsJuan.send(
            JSON.stringify({
              event: "JOIN_TRIP",
              data: { tripId },
            }),
          );
        });

        wsJuan.on("message", (raw) => {
          const msg = JSON.parse(raw.toString());
          if (msg.event === "JOINED_TRIP") {
            assert.strictEqual(msg.data.tripId, tripId);
            assert.strictEqual(msg.data.userName, "Juan Dela Cruz");
            wsJuan.close();
            resolve();
          }
        });

        wsJuan.on("error", (err) => reject(err));
      });
    });

    it("should broadcast real-time packing events across subscribed WebSocket clients", async () => {
      const wsMaria = new WebSocket(
        `ws://localhost:${serverPort}/ws?token=${mariaToken}`,
      );

      await new Promise<void>((resolve, reject) => {
        wsMaria.on("open", () => {
          wsMaria.send(
            JSON.stringify({
              event: "JOIN_TRIP",
              data: { tripId },
            }),
          );
        });

        wsMaria.on("message", (raw) => {
          const msg = JSON.parse(raw.toString());
          if (msg.event === "JOINED_TRIP") {
            // Once Maria joined the room, Juan creates a packing item via REST
            request(app)
              .post(`/api/v1/trips/${tripId}/packing`)
              .set("Authorization", `Bearer ${juanToken}`)
              .send({
                itemName: "Marshmallows & Bonfire Sticks",
                category: "FOOD_DRINKS",
                quantity: 2,
              })
              .then((res) => {
                assert.strictEqual(res.status, 201);
              });
          }

          if (msg.type === "PACKING_ITEM_ADDED") {
            assert.strictEqual(
              msg.item.itemName,
              "Marshmallows & Bonfire Sticks",
            );
            assert.strictEqual(msg.item.category, "FOOD_DRINKS");
            assert.strictEqual(msg.actorId, juanId);
            wsMaria.close();
            resolve();
          }
        });

        wsMaria.on("error", (err) => reject(err));
      });
    });

    it("should broadcast live GPS convoy updates across subscribed WebSocket clients", async () => {
      const wsMaria = new WebSocket(
        `ws://localhost:${serverPort}/ws?token=${mariaToken}`,
      );

      await new Promise<void>((resolve, reject) => {
        wsMaria.on("open", () => {
          wsMaria.send(
            JSON.stringify({
              event: "JOIN_TRIP",
              data: { tripId },
            }),
          );
        });

        wsMaria.on("message", (raw) => {
          const msg = JSON.parse(raw.toString());
          if (msg.event === "JOINED_TRIP") {
            // Juan sends GPS telemetry ping via REST
            request(app)
              .post(`/api/v1/trips/${tripId}/convoy/ping`)
              .set("Authorization", `Bearer ${juanToken}`)
              .send({
                vehicleId: "CAR-01",
                latitude: 16.6744,
                longitude: 120.3341,
                speedKmh: 45.0,
                heading: 10.0,
              })
              .then((res) => {
                assert.strictEqual(res.status, 200);
              });
          }

          if (msg.type === "CONVOY_LOCATION_UPDATE") {
            assert.strictEqual(msg.beacon.userId, juanId);
            assert.strictEqual(msg.beacon.latitude, 16.6744);
            assert.strictEqual(msg.beacon.longitude, 120.3341);
            wsMaria.close();
            resolve();
          }
        });

        wsMaria.on("error", (err) => reject(err));
      });
    });
  });
});
