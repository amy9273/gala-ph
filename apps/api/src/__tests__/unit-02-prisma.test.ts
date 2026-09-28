import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { prisma, disconnectPrisma } from "../lib/prisma.js";

type HubWithRoutes = Prisma.ProvincialTransitHubGetPayload<{
  include: { routes: true };
}>;
type BusRoute = HubWithRoutes["routes"][number];

type TripWithDetails = Prisma.TripGetPayload<{
  include: {
    members: { include: { user: true } };
    packingItems: { include: { assignedTo: true } };
    weatherAlerts: true;
    itineraryItems: true;
  };
}>;
type TripMemberWithUser = TripWithDetails["members"][number];
type PackingItemWithUser = TripWithDetails["packingItems"][number];

type ExpenseWithDetails = Prisma.ExpenseGetPayload<{
  include: {
    items: { include: { consumers: true } };
    splits: { include: { user: true } };
  };
}>;
type ExpenseSplitWithUser = ExpenseWithDetails["splits"][number];

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
      if (!row) throw new Error("Expected ping result row");
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
      if (!rate) throw new Error("NLEX rate not found");
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
      if (!rate) throw new Error("TPLEX rate not found");
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
      if (!cubao) throw new Error("Cubao hub not found");

      let joybus: BusRoute | undefined;
      for (const route of cubao.routes) {
        if (route.destination.includes("La Union")) {
          joybus = route;
          break;
        }
      }

      assert.ok(joybus, "Genesis JoyBus route to La Union should exist");
      if (!joybus) throw new Error("Genesis JoyBus route not found");
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
      if (!trip) throw new Error("Demo trip not found");
      assert.strictEqual(trip.members.length, 4);

      // Verify Non-drinker member using for..of (no callbacks, no implicit any)
      let bea: TripMemberWithUser | undefined;
      for (const member of trip.members) {
        if (member.user.name === "Bea Alonzo") {
          bea = member;
          break;
        }
      }

      assert.ok(bea, "Bea Alonzo member should exist in trip");
      if (!bea) throw new Error("Bea Alonzo member not found");
      assert.strictEqual(bea.isNonDrinker, true);
      assert.ok(bea.dietaryNotes?.includes("Shellfish allergy"));

      // Verify Bayanihan Packing Item assignment using for..of
      let cooler: PackingItemWithUser | undefined;
      for (const item of trip.packingItems) {
        if (item.itemName.includes("Ice Cooler")) {
          cooler = item;
          break;
        }
      }

      assert.ok(cooler, "Cooler packing item should exist");
      if (!cooler) throw new Error("Cooler packing item not found");
      assert.strictEqual(cooler.assignedTo?.name, "Juan Dela Cruz");
      assert.strictEqual(cooler.isPacked, true);

      // Verify PAGASA Weather Alert
      const alert = trip.weatherAlerts[0];
      assert.ok(alert, "Weather alert should exist");
      if (!alert) throw new Error("Weather alert not found");
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
      if (!expense) throw new Error("Tagpuan expense not found");
      const totalAmount = Number(expense.totalAmount);
      assert.strictEqual(totalAmount, 2400.0);

      // Verify sum of all splits equals totalAmount exactly (Mathematical Conservation Invariant)
      let splitsSum = 0;
      for (const split of expense.splits) {
        splitsSum += Number(split.amountOwed);
      }

      assert.ok(
        Math.abs(splitsSum - totalAmount) < 0.01,
        `Splits sum (${splitsSum}) must equal total amount (${totalAmount})`,
      );

      // Verify Non-Drinker / Allergy exclusion using for..of
      let beaSplit: ExpenseSplitWithUser | undefined;
      const drinkerSplits: ExpenseSplitWithUser[] = [];

      for (const split of expense.splits) {
        if (split.user.name === "Bea Alonzo") {
          beaSplit = split;
        } else {
          drinkerSplits.push(split);
        }
      }

      assert.ok(beaSplit, "Bea split should exist");
      if (!beaSplit) throw new Error("Bea split not found");
      assert.strictEqual(Number(beaSplit.amountOwed), 191.49);

      // Juan, Maria, Carlo each owe ₱736.17
      assert.strictEqual(drinkerSplits.length, 3);
      for (const ds of drinkerSplits) {
        assert.strictEqual(Number(ds.amountOwed), 736.17);
      }
    });
  });
});
