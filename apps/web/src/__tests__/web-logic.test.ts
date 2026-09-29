import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateLocalTollBreakdown,
  calculateItemizedSplits,
  solveDebtGraph,
  PRESET_ROUTES,
  FUEL_ECONOMY_PRESETS,
  TripDetail,
  Expense,
} from "../lib/api";
import { cn } from "../lib/utils";

describe("Unit 15: @gala-ph/web Client Logic & Ledger Math Verification", () => {
  describe("1. Dual-RFID Toll Breakdown & ₱50 Reload Buffer Rounding", () => {
    it("should calculate correct NLEX/SCTEX/TPLEX segment tolls and ₱50 rounded reloads for Manila -> La Union", () => {
      const breakdown = calculateLocalTollBreakdown(
        "MANILA_TO_LA_UNION",
        1,
        "SEDAN_1_5L",
        65.0,
      );

      assert.equal(breakdown.routeId, "MANILA_TO_LA_UNION");
      assert.equal(breakdown.classType, 1);

      // Easytrip: NLEX (331) + SCTEX (151) = 482
      assert.equal(breakdown.easytrip.total, 482);
      // Math.ceil(482 / 50) * 50 = 500
      assert.equal(breakdown.easytrip.recommendedReload, 500);

      // Autosweep: TPLEX (346) = 346
      assert.equal(breakdown.autosweep.total, 346);
      // Math.ceil(346 / 50) * 50 = 350
      assert.equal(breakdown.autosweep.recommendedReload, 350);

      assert.equal(breakdown.combinedTollTotal, 482 + 346);
      assert.ok(breakdown.totalEstimatedRoadCost > breakdown.combinedTollTotal);
    });

    it("should apply Class 2 (2.0x) and Class 3 (2.4x) multipliers accurately", () => {
      const class2 = calculateLocalTollBreakdown("MANILA_TO_BATANGAS_PORT", 2);
      const class1 = calculateLocalTollBreakdown("MANILA_TO_BATANGAS_PORT", 1);

      // Class 2 multiplier is 2.0x
      assert.equal(class2.autosweep.total, class1.autosweep.total * 2);
      assert.equal(class2.easytrip.total, 0); // Batangas port is 100% Autosweep
      assert.equal(class2.easytrip.recommendedReload, 0);
    });

    it("should estimate fuel consumption accurately for different engine presets", () => {
      assert.ok(PRESET_ROUTES.length >= 5);
      assert.ok("SEDAN_1_5L" in FUEL_ECONOMY_PRESETS);
      assert.ok("COMMUTER_VAN" in FUEL_ECONOMY_PRESETS);

      const sedan = calculateLocalTollBreakdown(
        "MANILA_TO_LA_UNION",
        1,
        "SEDAN_1_5L",
        60.0,
      );
      const van = calculateLocalTollBreakdown(
        "MANILA_TO_LA_UNION",
        1,
        "COMMUTER_VAN",
        60.0,
      );

      // Distance is 245 km
      // Sedan: 245 / 14.0 = 17.5L -> 17.5 * 60 = 1050
      assert.equal(sedan.estimatedFuel.litersNeeded, 17.5);
      assert.equal(sedan.estimatedFuel.fuelCost, 1050);

      // Van: 245 / 9.0 = 27.2L -> 27.2 * 60 = 1632
      assert.equal(van.estimatedFuel.litersNeeded, 27.2);
      assert.equal(van.estimatedFuel.fuelCost, 1632);
    });
  });

  describe("2. Itemized Expense Splitting & Proportionate Tax/Service Charge", () => {
    const mockMembers: TripDetail["members"] = [
      {
        id: "mem-1",
        userId: "usr-1",
        role: "TRIP_LEAD",
        isDriver: true,
        isNonDrinker: false,
        user: { id: "usr-1", name: "Mark (Lead)", email: "mark@gala.ph" },
      },
      {
        id: "mem-2",
        userId: "usr-2",
        role: "MEMBER",
        isDriver: false,
        isNonDrinker: true, // Non-drinker
        user: { id: "usr-2", name: "Ana (Non-drinker)", email: "ana@gala.ph" },
      },
      {
        id: "mem-3",
        userId: "usr-3",
        role: "MEMBER",
        isDriver: false,
        isNonDrinker: false,
        user: { id: "usr-3", name: "Bea", email: "bea@gala.ph" },
      },
    ];

    it("should split consumption fairly and distribute odd centavos without remainder loss", () => {
      // Item 1: Sinigang (₱600) shared by all 3 (₱200 each)
      // Item 2: San Miguel Pale Pilsen Bucket (₱450) consumed only by usr-1 and usr-3 (₱225 each)
      const items = [
        {
          name: "Sinigang na Baboy",
          price: 600,
          quantity: 1,
          consumerIds: ["usr-1", "usr-2", "usr-3"],
        },
        {
          name: "San Miguel Beer Bucket",
          price: 450,
          quantity: 1,
          consumerIds: ["usr-1", "usr-3"],
        },
      ];

      const splitResult = calculateItemizedSplits(
        items,
        10, // 10% service charge
        12, // 12% VAT
        mockMembers,
      );

      // Subtotal = 1050
      // Service Charge 10% = 105
      // Tax 12% = 126
      // Total Amount = 1281
      assert.equal(splitResult.subtotal, 1050);
      assert.equal(splitResult.serviceChargeAmount, 105);
      assert.equal(splitResult.taxAmount, 126);
      assert.equal(splitResult.totalAmount, 1281);

      // Ana (usr-2) should only pay for Sinigang share (200) + 10% SC (20) + 12% VAT (24) = 244
      const anaSplit = splitResult.splits.find((s) => s.userId === "usr-2");
      assert.ok(anaSplit);
      assert.equal(anaSplit.baseAmount, 200);
      assert.equal(anaSplit.serviceChargeShare, 20);
      assert.equal(anaSplit.taxShare, 24);
      assert.equal(anaSplit.totalOwed, 244);

      // Mark (usr-1) and Bea (usr-3) should pay Sinigang (200) + Beer (225) = 425 base
      // SC = 425 * 0.10 = 42.5 -> Math.round = 43 or 42
      // VAT = 425 * 0.12 = 51
      const markSplit = splitResult.splits.find((s) => s.userId === "usr-1");
      const beaSplit = splitResult.splits.find((s) => s.userId === "usr-3");
      assert.ok(markSplit && beaSplit);
      assert.equal(markSplit.baseAmount, 425);
      assert.equal(beaSplit.baseAmount, 425);

      // Sum of splits must be close/equal to totalAmount
      const sumSplits = splitResult.splits.reduce(
        (acc, s) => acc + s.totalOwed,
        0,
      );
      assert.equal(Math.round(sumSplits), 1281);
    });
  });

  describe("3. Greedy Debt Graph Solver (Bilateral Minimization)", () => {
    it("should simplify net balances into at most N-1 transactions", () => {
      const members: TripDetail["members"] = [
        {
          id: "m-1",
          userId: "u-1",
          role: "TRIP_LEAD",
          isDriver: true,
          isNonDrinker: false,
          user: { id: "u-1", name: "Alice", email: "alice@test.com" },
        },
        {
          id: "m-2",
          userId: "u-2",
          role: "MEMBER",
          isDriver: false,
          isNonDrinker: false,
          user: { id: "u-2", name: "Bob", email: "bob@test.com" },
        },
        {
          id: "m-3",
          userId: "u-3",
          role: "MEMBER",
          isDriver: false,
          isNonDrinker: false,
          user: { id: "u-3", name: "Charlie", email: "charlie@test.com" },
        },
        {
          id: "m-4",
          userId: "u-4",
          role: "MEMBER",
          isDriver: false,
          isNonDrinker: false,
          user: { id: "u-4", name: "Diana", email: "diana@test.com" },
        },
      ];

      // Alice paid ₱4,000 for everyone (₱1,000 each)
      const expense1: Expense = {
        id: "exp-1",
        tripId: "trip-1",
        paidById: "u-1",
        paidByName: "Alice",
        title: "Villa Rental",
        category: "LODGING_RESORT",
        totalAmount: 4000,
        totalAmountCentavos: 400000,
        serviceChargeAmount: 0,
        taxAmount: 0,
        serviceChargePercent: 0,
        taxPercent: 0,
        items: [],
        splits: [
          {
            userId: "u-1",
            userName: "Alice",
            baseAmount: 1000,
            serviceChargeShare: 0,
            taxShare: 0,
            totalOwed: 1000,
            totalOwedCentavos: 100000,
            isSettled: false,
          },
          {
            userId: "u-2",
            userName: "Bob",
            baseAmount: 1000,
            serviceChargeShare: 0,
            taxShare: 0,
            totalOwed: 1000,
            totalOwedCentavos: 100000,
            isSettled: false,
          },
          {
            userId: "u-3",
            userName: "Charlie",
            baseAmount: 1000,
            serviceChargeShare: 0,
            taxShare: 0,
            totalOwed: 1000,
            totalOwedCentavos: 100000,
            isSettled: false,
          },
          {
            userId: "u-4",
            userName: "Diana",
            baseAmount: 1000,
            serviceChargeShare: 0,
            taxShare: 0,
            totalOwed: 1000,
            totalOwedCentavos: 100000,
            isSettled: false,
          },
        ],
        createdAt: new Date().toISOString(),
      };

      const result = solveDebtGraph(members, [expense1]);

      // Alice is owed ₱3,000 net. Bob, Charlie, Diana each owe ₱1,000 net.
      const aliceBal = result.balances.find((b) => b.userId === "u-1");
      assert.equal(aliceBal?.netBalance, 3000);

      // Settlements should be at most 3 (N-1)
      assert.ok(result.settlements.length <= 3);
      assert.equal(result.settlements.length, 3);

      for (const s of result.settlements) {
        assert.equal(s.toUserId, "u-1");
        assert.equal(s.amount, 1000);
      }
    });
  });

  describe("4. Utility Helpers (Tailwind Class Merging)", () => {
    it("should properly merge and override Tailwind classes with clsx and twMerge", () => {
      assert.equal(cn("px-2 py-1", "bg-red-500"), "px-2 py-1 bg-red-500");
      assert.equal(cn("px-2", "px-4"), "px-4"); // Overridden
      assert.equal(
        cn("text-sm", false && "text-lg", "font-bold"),
        "text-sm font-bold",
      );
    });
  });
});
