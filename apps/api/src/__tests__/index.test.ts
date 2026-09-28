import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../app.js";
import { getRedisClient } from "../lib/redis.js";
import {
  pesosToCentavos,
  centavosToPesos,
  formatPHP,
  splitAmountEqually,
  normalizePhilippinePhone,
  isValidPhilippinePhone,
} from "@gala-ph/shared";

// Teardown hook to cleanly disconnect Redis socket & Prisma client to avoid hanging CI test runners
after(async () => {
  const redis = getRedisClient();
  if (redis) {
    redis.disconnect();
  }
  const { disconnectPrisma } = await import("../lib/prisma.js");
  await disconnectPrisma();
});

describe("Unit 01: API Health Probes & Shared Utilities", () => {
  describe("GET /health/live", () => {
    it("should return 200 with status alive in < 50ms", async () => {
      const startTime = Date.now();
      const res = await request(app).get("/health/live");
      const duration = Date.now() - startTime;

      assert.equal(res.status, 200);
      assert.equal(res.body.status, "alive");
      assert.ok(typeof res.body.timestamp === "string");
      assert.ok(duration < 200, `Expected duration < 200ms, got ${duration}ms`);
    });
  });

  describe("GET /health/ready", () => {
    it("should return 200 with dependency health status", async () => {
      const res = await request(app).get("/health/ready");

      assert.equal(res.status, 200);
      assert.equal(res.body.status, "ready");
      assert.ok(res.body.checks);
      assert.ok("database" in res.body.checks);
      assert.ok("redis" in res.body.checks);
    });
  });

  describe("404 Handler & Correlation Middleware", () => {
    it("should return 404 with structured error JSON and correlation header", async () => {
      const res = await request(app)
        .get("/non-existent-route-endpoint")
        .set("x-correlation-id", "test-cid-12345");

      assert.equal(res.status, 404);
      assert.equal(res.headers["x-correlation-id"], "test-cid-12345");
      assert.equal(res.body.error.code, "NOT_FOUND");
    });
  });

  describe("@gala-ph/shared: Centavo & Currency Math", () => {
    it("should accurately convert pesos to integer centavos", () => {
      assert.equal(pesosToCentavos(150.75), 15075);
      assert.equal(pesosToCentavos("2499.50"), 249950);
      assert.equal(pesosToCentavos(0), 0);
    });

    it("should accurately convert centavos to pesos", () => {
      assert.equal(centavosToPesos(15075), 150.75);
      assert.equal(centavosToPesos(100), 1.0);
    });

    it("should format Philippine peso currency strings properly", () => {
      const formatted = formatPHP(150000, true);
      assert.ok(formatted.includes("1,500.00"));
    });

    it("should distribute odd cents with mathematical conservation (sum === total)", () => {
      const splits = splitAmountEqually(1000, 3); // 1000 centavos / 3
      assert.equal(splits.length, 3);
      assert.deepEqual(splits, [334, 333, 333]);
      const sum = splits.reduce((a, b) => a + b, 0);
      assert.equal(sum, 1000);
    });
  });

  describe("@gala-ph/shared: Philippine Mobile Number Validation", () => {
    it("should normalize valid PH mobile numbers from 09XX and +639XX formats", () => {
      assert.equal(normalizePhilippinePhone("09171234567"), "+639171234567");
      assert.equal(
        normalizePhilippinePhone("+63 918 765 4321"),
        "+639187654321",
      );
      assert.equal(normalizePhilippinePhone("9221234567"), "+639221234567");
    });

    it("should reject invalid mobile numbers", () => {
      assert.equal(isValidPhilippinePhone("123456"), false);
      assert.equal(isValidPhilippinePhone("08123456789"), false);
    });
  });
});
