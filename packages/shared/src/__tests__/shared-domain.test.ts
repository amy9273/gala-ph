import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  pesosToCentavos,
  centavosToPesos,
  formatPHP,
  splitAmountEqually,
  normalizePhilippinePhone,
  isValidPhilippinePhone,
  calculateHaversineDistanceKm,
  calculateHaversineDistanceMeters,
  ConvoyBeaconSchema,
  ConvoySosAlertSchema,
  UserRoleSchema,
  TravelModeSchema,
  ExpenseCategorySchema,
  RfidProviderSchema,
} from "../index.js";

describe("Unit 15: @gala-ph/shared Domain & Helper Verification", () => {
  describe("1. Exact Integer Centavo Currency Math & Remainder Splitting", () => {
    it("should convert PHP peso amounts to integer centavos without floating-point errors", () => {
      assert.equal(pesosToCentavos(150.75), 15075);
      assert.equal(pesosToCentavos("249.50"), 24950);
      assert.equal(pesosToCentavos(0), 0);
      assert.equal(pesosToCentavos(1250), 125000);
      assert.equal(pesosToCentavos(0.1 + 0.2), 30); // Floating point 0.30000000000000004 -> 30 centavos
    });

    it("should convert integer centavos back to peso decimals", () => {
      assert.equal(centavosToPesos(15075), 150.75);
      assert.equal(centavosToPesos(24950), 249.5);
      assert.equal(centavosToPesos(0), 0);
    });

    it("should format currency with Philippine Peso symbol and two decimal places", () => {
      const formatted = formatPHP(15075, true);
      assert.ok(formatted.includes("150.75"));
      assert.ok(formatted.includes("PHP") || formatted.includes("₱"));
    });

    it("should distribute odd remainder centavos fairly so sum(splits) strictly equals total", () => {
      // ₱10.00 (1000 centavos) split among 3 members: 334, 333, 333
      const splits3 = splitAmountEqually(1000, 3);
      assert.deepEqual(splits3, [334, 333, 333]);
      assert.equal(
        splits3.reduce((a: number, b: number) => a + b, 0),
        1000,
      );

      // ₱1.00 (100 centavos) split among 7 members
      const splits7 = splitAmountEqually(100, 7);
      assert.equal(splits7.length, 7);
      assert.equal(
        splits7.reduce((a: number, b: number) => a + b, 0),
        100,
      );

      // Edge cases: 0 count or 0 total
      assert.deepEqual(splitAmountEqually(1000, 0), []);
      assert.deepEqual(splitAmountEqually(0, 4), [0, 0, 0, 0]);
    });
  });

  describe("2. Philippine Mobile Phone Normalization & Validation", () => {
    it("should validate and normalize standard Philippine mobile numbers to E.164 (+639XXXXXXXXX)", () => {
      assert.equal(normalizePhilippinePhone("09171234567"), "+639171234567");
      assert.equal(normalizePhilippinePhone("+639189876543"), "+639189876543");
      assert.equal(normalizePhilippinePhone("9205551234"), "+639205551234");
      assert.equal(
        normalizePhilippinePhone("+63 917 123 4567"),
        "+639171234567",
      );
      assert.equal(normalizePhilippinePhone("0918-987-6543"), "+639189876543");

      assert.equal(isValidPhilippinePhone("09171234567"), true);
      assert.equal(isValidPhilippinePhone("+639189876543"), true);
      assert.equal(isValidPhilippinePhone("09998887777"), true);
    });

    it("should reject non-Philippine or malformed phone numbers", () => {
      assert.equal(normalizePhilippinePhone("08171234567"), null); // Non-9 prefix
      assert.equal(normalizePhilippinePhone("12345"), null);
      assert.equal(normalizePhilippinePhone("+12025550123"), null); // US number
      assert.equal(normalizePhilippinePhone(""), null);

      assert.equal(isValidPhilippinePhone("08171234567"), false);
      assert.equal(isValidPhilippinePhone("abc"), false);
    });
  });

  describe("3. Geographic Distance (Haversine Formula)", () => {
    it("should calculate great-circle distance in kilometers between Manila and San Juan, La Union", () => {
      const manila = { lat: 14.5995, lon: 120.9842 };
      const elyu = { lat: 16.6667, lon: 120.3333 };

      const distKm = calculateHaversineDistanceKm(
        manila.lat,
        manila.lon,
        elyu.lat,
        elyu.lon,
      );

      // Distance should be approximately 235 - 245 km
      assert.ok(distKm > 230 && distKm < 250, `Distance was ${distKm} km`);

      const distMeters = calculateHaversineDistanceMeters(
        manila.lat,
        manila.lon,
        elyu.lat,
        elyu.lon,
      );
      assert.equal(Math.round(distMeters), Math.round(distKm * 1000));
    });

    it("should return 0 distance for identical coordinates", () => {
      const dist = calculateHaversineDistanceKm(16.482, 120.32, 16.482, 120.32);
      assert.equal(dist, 0);
    });
  });

  describe("4. Zod Schema Validation Contracts", () => {
    it("should validate and parse a valid ConvoyBeacon payload", () => {
      const validBeacon = {
        tripId: "trip-001",
        userId: "usr-001",
        userName: "Kuya Mark",
        vehicleId: "veh-001",
        latitude: 16.482,
        longitude: 120.32,
        speedKmh: 85,
        heading: 350,
        batteryLevel: 90,
        updatedAt: new Date().toISOString(),
      };

      const result = ConvoyBeaconSchema.safeParse(validBeacon);
      assert.equal(result.success, true);
    });

    it("should reject an invalid ConvoyBeacon payload with out-of-range coordinates", () => {
      const invalidBeacon = {
        tripId: "trip-001",
        userId: "usr-001",
        latitude: 95.0, // Invalid latitude > 90
        longitude: 120.32,
        updatedAt: new Date().toISOString(),
      };

      const result = ConvoyBeaconSchema.safeParse(invalidBeacon);
      assert.equal(result.success, false);
    });

    it("should validate a valid ConvoySosAlert payload", () => {
      const validSos = {
        id: "sos-101",
        tripId: "trip-001",
        userId: "usr-001",
        userName: "Kuya Mark",
        latitude: 16.482,
        longitude: 120.32,
        reason: "FLAT_TIRE" as const,
        details: "Flat tire on NLEX near Dau exit",
        issuedAt: new Date().toISOString(),
      };

      const result = ConvoySosAlertSchema.safeParse(validSos);
      assert.equal(result.success, true);
    });

    it("should validate domain enums for roles, travel modes, and RFID providers", () => {
      assert.equal(UserRoleSchema.parse("TRIP_LEAD"), "TRIP_LEAD");
      assert.equal(TravelModeSchema.parse("HYBRID"), "HYBRID");
      assert.equal(RfidProviderSchema.parse("AUTOSWEEP"), "AUTOSWEEP");
      assert.equal(RfidProviderSchema.parse("EASYTRIP"), "EASYTRIP");
      assert.equal(
        ExpenseCategorySchema.parse("FOOD_AND_DINING"),
        "FOOD_AND_DINING",
      );
      assert.equal(
        ExpenseCategorySchema.parse("ALCOHOL_AND_BAR"),
        "ALCOHOL_AND_BAR",
      );

      assert.throws(() => UserRoleSchema.parse("INVALID_ROLE"));
      assert.throws(() => RfidProviderSchema.parse("GCASH"));
    });
  });
});
