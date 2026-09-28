import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../app.js";
import { disconnectPrisma } from "../lib/prisma.js";
import { getRedisClient } from "../lib/redis.js";

describe("Unit 06: Itemized KKB Consumption Ledger & Debt Graph Solver", () => {
  let juanToken = "";
  let juanId = "";
  let mariaToken = "";
  let mariaId = "";
  let carloToken = "";
  let carloId = "";
  let beaToken = "";
  let beaId = "";
  let outsiderToken = "";

  let tripId = "";
  let inviteCode = "";
  let createdExpenseId = "";

  before(async () => {
    const timestamp = Date.now();

    // 1. Register Juan (Trip Lead, Driver with CAR-01, GCash)
    const resJuan = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `juan_kkb_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Juan Dela Cruz",
        phone: "09171234567",
        gcashNumber: "09171234567",
      });
    assert.strictEqual(resJuan.status, 201);
    juanToken = resJuan.body.token;
    juanId = resJuan.body.user.id;

    // 2. Register Maria (Drinker, Passenger in CAR-01, GCash)
    const resMaria = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `maria_kkb_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Maria Santos",
        phone: "09189876543",
        gcashNumber: "09189876543",
      });
    assert.strictEqual(resMaria.status, 201);
    mariaToken = resMaria.body.token;
    mariaId = resMaria.body.user.id;

    // 3. Register Carlo (Drinker, Passenger in CAR-01, Maya)
    const resCarlo = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `carlo_kkb_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Carlo Reyes",
        phone: "09195554321",
        mayaNumber: "09195554321",
      });
    assert.strictEqual(resCarlo.status, 201);
    carloToken = resCarlo.body.token;
    carloId = resCarlo.body.user.id;

    // 4. Register Bea (Non-drinker, Seafood allergy)
    const resBea = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `bea_kkb_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Bea Alonzo",
        phone: "09201112233",
        gcashNumber: "09201112233",
      });
    assert.strictEqual(resBea.status, 201);
    beaToken = resBea.body.token;
    beaId = resBea.body.user.id;

    // 5. Register Outsider
    const resOutsider = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `outsider_kkb_${timestamp}@gala-ph.dev`,
        password: "Password123!",
        name: "Outsider Sam",
        phone: "09229998877",
      });
    assert.strictEqual(resOutsider.status, 201);
    outsiderToken = resOutsider.body.token;

    // 6. Juan creates Trip
    const resTrip = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${juanToken}`)
      .send({
        title: "Elyu KKB Barkada Getaway",
        destination: "San Juan, La Union",
        startDate: "2026-10-23T00:00:00.000Z",
        endDate: "2026-10-25T23:59:59.000Z",
        travelMode: "PRIVATE_CAR",
      });
    assert.strictEqual(resTrip.status, 201);
    tripId = resTrip.body.trip.id;
    inviteCode = resTrip.body.trip.inviteCode;

    // Juan sets vehicle and driver flags
    await request(app)
      .patch(`/api/v1/trips/${tripId}/members/${juanId}`)
      .set("Authorization", `Bearer ${juanToken}`)
      .send({ isDriver: true, vehicleId: "CAR-01" });

    // Maria joins and configures vehicle CAR-01
    await request(app)
      .post("/api/v1/trips/join")
      .set("Authorization", `Bearer ${mariaToken}`)
      .send({ inviteCode });
    await request(app)
      .patch(`/api/v1/trips/${tripId}/members/${mariaId}`)
      .set("Authorization", `Bearer ${mariaToken}`)
      .send({ vehicleId: "CAR-01" });

    // Carlo joins and configures vehicle CAR-01
    await request(app)
      .post("/api/v1/trips/join")
      .set("Authorization", `Bearer ${carloToken}`)
      .send({ inviteCode });
    await request(app)
      .patch(`/api/v1/trips/${tripId}/members/${carloId}`)
      .set("Authorization", `Bearer ${carloToken}`)
      .send({ vehicleId: "CAR-01" });

    // Bea joins and sets isNonDrinker: true, allergy notes
    await request(app)
      .post("/api/v1/trips/join")
      .set("Authorization", `Bearer ${beaToken}`)
      .send({ inviteCode });
    await request(app)
      .patch(`/api/v1/trips/${tripId}/members/${beaId}`)
      .set("Authorization", `Bearer ${beaToken}`)
      .send({ isNonDrinker: true, dietaryNotes: "Seafood allergy" });
  });

  after(async () => {
    const redis = getRedisClient();
    if (redis) {
      redis.disconnect();
    }
    await disconnectPrisma();
  });

  describe("1. Multi-Tenant Authorization & Boundary Isolation", () => {
    it("should reject unauthenticated request to log expense", async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .send({
          title: "Unauthorized Lunch",
          category: "FOOD_AND_DINING",
          totalAmount: 500,
        });

      assert.strictEqual(res.status, 401);
    });

    it("should reject non-trip-member from recording an expense", async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({
          title: "Outsider Coffee",
          category: "FOOD_AND_DINING",
          totalAmount: 180,
        });

      assert.strictEqual(res.status, 403);
    });

    it("should reject non-trip-member from viewing ledger balances", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/ledger/balances`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      assert.strictEqual(res.status, 403);
    });
  });

  describe("2. Itemized Expense with Non-Drinker & Dietary Exclusions", () => {
    it("should record dinner with dish-level consumer mapping and proportional service charge", async () => {
      // Dinner Breakdown:
      // Item 1: Inihaw na Liempo ₱800.00 (All 4 eat: Juan, Maria, Carlo, Bea) -> ₱200.00 each
      // Item 2: Garlic Butter Shrimp ₱700.00 (Bea allergic: Juan, Maria, Carlo) -> ₱233.33 / 233.34 each
      // Item 3: San Miguel Pale Pilsen Bucket ₱500.00 (isAlcohol: true auto-excludes Bea) -> ₱166.66 / 166.67 each
      // Total Food Subtotal = ₱2,000.00
      // Service Charge & Local Tax = ₱200.00 (10%)
      // Total Bill = ₱2,200.00 paid by Juan
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .set("Authorization", `Bearer ${juanToken}`)
        .send({
          title: "Dampa Seafood & Grill Dinner",
          category: "FOOD_AND_DINING",
          paidById: juanId,
          serviceAndTaxFee: 200.0,
          items: [
            {
              name: "Inihaw na Liempo Platter",
              price: 800.0,
              quantity: 1,
              // All 4 eat
            },
            {
              name: "Garlic Butter Shrimp (1kg)",
              price: 700.0,
              quantity: 1,
              consumerUserIds: [juanId, mariaId, carloId], // Bea excluded (allergy)
            },
            {
              name: "San Miguel Pale Pilsen Bucket",
              price: 500.0,
              quantity: 1,
              isAlcohol: true, // Bea excluded (isNonDrinker)
            },
          ],
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.expense);
      createdExpenseId = res.body.expense.id;

      const exp = res.body.expense;
      assert.strictEqual(exp.totalAmount, 2200.0);
      assert.strictEqual(exp.totalCentavos, 220000);
      assert.strictEqual(exp.serviceAndTaxFee, 200.0);
      assert.strictEqual(exp.splits.length, 4);

      // Verify mathematical conservation: sum(splits) === 2200.00
      const totalSplitsCentavos = exp.splits.reduce(
        (sum: number, s: { amountCentavos: number }) => sum + s.amountCentavos,
        0,
      );
      assert.strictEqual(totalSplitsCentavos, 220000);

      // Verify Bea's split (only Liempo share ₱200 + proportional 10% SC ₱20 = ₱220.00)
      const beaSplit = exp.splits.find(
        (s: { userId: string }) => s.userId === beaId,
      );
      assert.ok(beaSplit, "Bea split must exist");
      assert.strictEqual(beaSplit.amountCentavos, 22000); // ₱220.00
      assert.strictEqual(beaSplit.amountOwed, 220.0);
      assert.strictEqual(beaSplit.isSettled, false);

      // Verify Juan (payer) has isSettled: true
      const juanSplit = exp.splits.find(
        (s: { userId: string }) => s.userId === juanId,
      );
      assert.ok(juanSplit);
      assert.strictEqual(juanSplit.isSettled, true);
    });

    it("should retrieve single expense breakdown by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/expenses/${createdExpenseId}`)
        .set("Authorization", `Bearer ${mariaToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.expense.id, createdExpenseId);
      assert.strictEqual(res.body.expense.items.length, 3);
      assert.strictEqual(res.body.expense.splits.length, 4);
    });
  });

  describe("3. Transit Expense Isolation (Carpool Fuel with Driver Exemption)", () => {
    it("should split fuel only among carpool passengers, exempting the driver", async () => {
      // Fuel expense: ₱1,500.00 paid by Juan
      // vehicleIdOnly: "CAR-01", excludeDriver: true
      // Passengers in CAR-01: Maria, Carlo (Juan isDriver: true, so excluded)
      // Maria and Carlo pay ₱750.00 each
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .set("Authorization", `Bearer ${juanToken}`)
        .send({
          title: "NLEX Shell Gas Refill",
          category: "FUEL_AND_GAS",
          paidById: juanId,
          totalAmount: 1500.0,
          vehicleIdOnly: "CAR-01",
          excludeDriver: true,
        });

      assert.strictEqual(res.status, 201);
      const exp = res.body.expense;
      assert.strictEqual(exp.totalAmount, 1500.0);
      assert.strictEqual(exp.splits.length, 2);

      const mariaSplit = exp.splits.find(
        (s: { userId: string }) => s.userId === mariaId,
      );
      const carloSplit = exp.splits.find(
        (s: { userId: string }) => s.userId === carloId,
      );
      const juanSplit = exp.splits.find(
        (s: { userId: string }) => s.userId === juanId,
      );

      assert.ok(mariaSplit);
      assert.ok(carloSplit);
      assert.strictEqual(juanSplit, undefined, "Driver Juan must be excluded");
      assert.strictEqual(mariaSplit.amountCentavos, 75000);
      assert.strictEqual(carloSplit.amountCentavos, 75000);
    });
  });

  describe("4. Trip Ledger Net Balances & Conservation Invariant", () => {
    it("should compute exact net balances with sum === 0", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/ledger/balances`)
        .set("Authorization", `Bearer ${carloToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.balances));
      assert.strictEqual(res.body.balances.length, 4);

      // Verify Conservation of Money: sum(netBalanceCentavos) === 0
      const sumNetCentavos = res.body.balances.reduce(
        (acc: number, b: { netBalanceCentavos: number }) =>
          acc + b.netBalanceCentavos,
        0,
      );
      assert.strictEqual(
        sumNetCentavos,
        0,
        "Net balance across all participants must sum to 0",
      );

      // Juan paid ₱2,200 (dinner) + ₱1,500 (gas) = ₱3,700.00
      const juanBal = res.body.balances.find(
        (b: { userId: string }) => b.userId === juanId,
      );
      assert.ok(juanBal);
      assert.strictEqual(juanBal.status, "CREDITOR");
      assert.strictEqual(juanBal.totalPaidPesos, 3700.0);
      assert.ok(juanBal.netBalanceCentavos > 0);

      // Maria is a debtor
      const mariaBal = res.body.balances.find(
        (b: { userId: string }) => b.userId === mariaId,
      );
      assert.ok(mariaBal);
      assert.strictEqual(mariaBal.status, "DEBTOR");
      assert.ok(mariaBal.netBalanceCentavos < 0);

      // Bea owes ₱220.00 for liempo + tax
      const beaBal = res.body.balances.find(
        (b: { userId: string }) => b.userId === beaId,
      );
      assert.ok(beaBal);
      assert.strictEqual(beaBal.status, "DEBTOR");
      assert.strictEqual(beaBal.netBalanceCentavos, -22000);
      assert.strictEqual(beaBal.netBalancePesos, -220.0);
    });
  });

  describe("5. Greedy Debt Simplification Graph Solver", () => {
    it("should collapse bilateral debts into minimal direct settlement transfers with GCash/Maya info", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/ledger/settlements`)
        .set("Authorization", `Bearer ${juanToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.transactions));

      // With 4 participants (1 creditor, 3 debtors), maximum transactions is 3 (<= N - 1)
      assert.ok(res.body.transactions.length <= 3);

      for (const tx of res.body.transactions) {
        assert.ok(tx.fromUser.id);
        assert.ok(tx.toUser.id);
        assert.ok(tx.amountCentavos > 0);
        assert.ok(tx.amountPesos > 0);
        assert.ok(tx.formattedAmount.includes("₱"));
        assert.ok(
          ["GCASH", "MAYA", "CASH"].includes(tx.suggestedPaymentMethod),
        );

        // Creditor Juan has GCash configured
        if (tx.toUser.id === juanId) {
          assert.strictEqual(tx.suggestedPaymentMethod, "GCASH");
          assert.strictEqual(tx.qrPayload.recipientMobile, "+639171234567");
        }
      }

      // Sum of all settlements must equal total debt owed to Juan
      const totalSettlementsCentavos = res.body.transactions.reduce(
        (sum: number, tx: { amountCentavos: number }) =>
          sum + tx.amountCentavos,
        0,
      );

      const balancesRes = await request(app)
        .get(`/api/v1/trips/${tripId}/ledger/balances`)
        .set("Authorization", `Bearer ${juanToken}`);

      const juanCredit = balancesRes.body.balances.find(
        (b: { userId: string }) => b.userId === juanId,
      ).netBalanceCentavos;

      assert.strictEqual(totalSettlementsCentavos, juanCredit);
    });
  });

  describe("6. Peer-to-Peer Debt Settlement", () => {
    it("should record Bea settling her ₱220.00 debt to Juan via GCash", async () => {
      const settleRes = await request(app)
        .post(`/api/v1/trips/${tripId}/ledger/settle`)
        .set("Authorization", `Bearer ${beaToken}`)
        .send({
          fromUserId: beaId,
          toUserId: juanId,
          amount: 220.0,
          paymentMethod: "GCASH",
          notes: "Bayad sa liempo dinner via GCash ref #987654321",
        });

      assert.strictEqual(settleRes.status, 201);
      assert.strictEqual(settleRes.body.settlement.amount, 220.0);
      assert.strictEqual(settleRes.body.settlement.paymentMethod, "GCASH");

      // Verify Bea's balance is now completely settled (0 net balance)
      const balancesRes = await request(app)
        .get(`/api/v1/trips/${tripId}/ledger/balances`)
        .set("Authorization", `Bearer ${beaToken}`);

      const beaBal = balancesRes.body.balances.find(
        (b: { userId: string }) => b.userId === beaId,
      );
      assert.strictEqual(beaBal.status, "SETTLED");
      assert.strictEqual(beaBal.netBalanceCentavos, 0);

      // Verify overall conservation still holds
      const sumNetCentavos = balancesRes.body.balances.reduce(
        (acc: number, b: { netBalanceCentavos: number }) =>
          acc + b.netBalanceCentavos,
        0,
      );
      assert.strictEqual(sumNetCentavos, 0);
    });
  });
});
