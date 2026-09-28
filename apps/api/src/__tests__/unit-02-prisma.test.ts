import { describe, it, after } from "node:test";
import assert from "node:assert";
import { prisma, disconnectPrisma } from "../lib/prisma.js";

describe("Unit 02: Database Models & Prisma Integration", () => {
  after(async () => {
    await disconnectPrisma();
  });

  describe("Database Connectivity & Health", () => {
    it("should successfully execute a raw query on Neon PostgreSQL", async () => {
      const result = await prisma.$queryRaw<
        Array<{ ping: number }>
      >`SELECT 1 as ping`;
      assert.strictEqual(result.length, 1);
      const row = result[0];
      assert.ok(row);
      assert.strictEqual(Number(row.ping), 1);
    });
  });

  describe("Philippine Expressway Toll Matrix", () => {
    it("should query NLEX Balintawak to San Fernando Class 1-3 toll rates", async () => {
      const rate = await prisma.expresswayTollRate.findUnique({
        where: {
          expressway_entryPlaza_exitPlaza: {
            expressway: "NLEX",
            entryPlaza: "Balintawak",
            exitPlaza: "San Fernando",
          },
        },
      });

      assert.ok(rate, "NLEX rate should exist in seed data");
      assert.strictEqual(rate.rfidProvider, "EASYTRIP");
      assert.strictEqual(Number(rate.class1Fee), 157.0);
      assert.strictEqual(Number(rate.class2Fee), 392.0);
      assert.strictEqual(Number(rate.class3Fee), 470.0);
    });

    it("should query TPLEX Tarlac Central to Rosario Class 1 fee", async () => {
      const rate = await prisma.expresswayTollRate.findUnique({
        where: {
          expressway_entryPlaza_exitPlaza: {
            expressway: "TPLEX",
            entryPlaza: "Tarlac Central",
            exitPlaza: "Rosario (La Union)",
          },
        },
      });

      assert.ok(rate, "TPLEX rate should exist in seed data");
      assert.strictEqual(rate.rfidProvider, "AUTOSWEEP");
      assert.strictEqual(Number(rate.class1Fee), 311.0);
    });
  });

  describe("Provincial Transit Hubs & Bus Routes", () => {
    it("should query Cubao terminal and verify Genesis JoyBus to La Union", async () => {
      const cubao = await prisma.provincialTransitHub.findFirst({
        where: { name: { contains: "Cubao" } },
        include: { routes: true },
      });

      assert.ok(cubao, "Cubao transit hub should exist");
      const joybus = cubao.routes.find((r) =>
        r.destination.includes("La Union"),
      );
      assert.ok(joybus, "Genesis JoyBus route to La Union should exist");
      assert.strictEqual(joybus.operatorName, "Genesis JoyBus");
      assert.strictEqual(Number(joybus.baseFare), 850.0);
    });
  });

  describe("Barkada Trip & Bayanihan Packing Models", () => {
    it("should query Elyu trip with members, gear, and weather alerts", async () => {
      const trip = await prisma.trip.findUnique({
        where: { inviteCode: "ELYU-2026" },
        include: {
          members: { include: { user: true } },
          packingItems: { include: { assignedTo: true } },
          weatherAlerts: true,
          itineraryItems: true,
        },
      });

      assert.ok(trip, "Demo trip should exist");
      assert.strictEqual(trip.members.length, 4);

      // Verify Non-drinker member
      const bea = trip.members.find((m) => m.user.name === "Bea Alonzo");
      assert.ok(bea);
      assert.strictEqual(bea.isNonDrinker, true);
      assert.ok(bea.dietaryNotes?.includes("Shellfish allergy"));

      // Verify Bayanihan Packing Item assignment
      const cooler = trip.packingItems.find((p) =>
        p.itemName.includes("Ice Cooler"),
      );
      assert.ok(cooler);
      assert.strictEqual(cooler.assignedTo?.name, "Juan Dela Cruz");
      assert.strictEqual(cooler.isPacked, true);

      // Verify PAGASA Weather Alert
      const alert = trip.weatherAlerts[0];
      assert.ok(alert);
      assert.strictEqual(alert.alertType, "GALE_WARNING");
      assert.strictEqual(alert.source, "DOST-PAGASA");
    });
  });

  describe("Granular KKB Ledger & Mathematical Conservation", () => {
    it("should verify mathematical conservation on the itemized dinner expense", async () => {
      const expense = await prisma.expense.findFirst({
        where: { title: { contains: "Tagpuan" } },
        include: {
          items: { include: { consumers: true } },
          splits: { include: { user: true } },
        },
      });

      assert.ok(expense, "Tagpuan dinner expense should exist");
      const totalAmount = Number(expense.totalAmount);
      assert.strictEqual(totalAmount, 2400.0);

      // Verify sum of all splits equals totalAmount exactly (Mathematical Conservation Invariant)
      const splitsSum = expense.splits.reduce(
        (acc, split) => acc + Number(split.amountOwed),
        0,
      );
      assert.ok(
        Math.abs(splitsSum - totalAmount) < 0.01,
        `Splits sum (${splitsSum}) must equal total amount (${totalAmount})`,
      );

      // Verify Non-Drinker / Allergy exclusion
      // Bea should only owe ₱191.49 (liempo + service charge share)
      const beaSplit = expense.splits.find((s) => s.user.name === "Bea Alonzo");
      assert.ok(beaSplit);
      assert.strictEqual(Number(beaSplit.amountOwed), 191.49);

      // Juan, Maria, Carlo each owe ₱736.17
      const drinkerSplits = expense.splits.filter(
        (s) => s.user.name !== "Bea Alonzo",
      );
      assert.strictEqual(drinkerSplits.length, 3);
      for (const ds of drinkerSplits) {
        assert.strictEqual(Number(ds.amountOwed), 736.17);
      }
    });
  });
});
