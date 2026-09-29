import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sqliteClient } from "../lib/sqlite/db";
import { expenseRepository } from "../lib/sqlite/repositories/expense.repository";
import { outboxRepository } from "../lib/sqlite/repositories/outbox.repository";
import { outboxSyncService } from "../services/outbox-sync.service";
import {
  ReceiptOcrService,
  SAMPLE_RECEIPT_TEXTS,
} from "../services/receipt-ocr.service";
import { DEMO_MOBILE_TRIP } from "../services/api-client";
import type { LocalExpense } from "../types";

describe("Unit 13: Mobile Camera Receipt Scanner & OCR Line-Item Splitter", () => {
  const members = DEMO_MOBILE_TRIP.members; // Miguel (Driver), Bea (Non-drinker), Carlos (Driver), Denise (Commuter)

  beforeEach(async () => {
    await sqliteClient.resetDatabase();
    outboxSyncService.setOnlineStatus(false);
  });

  it("1. should parse Philippine dining receipt text into line items, SC, and grand total", () => {
    const rawText = SAMPLE_RECEIPT_TEXTS.tagpuanSanJuan;
    const parsed = ReceiptOcrService.parseReceiptText(rawText, members);

    assert.strictEqual(parsed.establishmentName, "TAGPUAN SA SAN JUAN");
    assert.strictEqual(parsed.items.length, 5);

    // Verify items
    const shrimp = parsed.items.find((i) =>
      i.name.includes("Garlic Butter Shrimp"),
    );
    assert.ok(shrimp, "Garlic butter shrimp should be extracted");
    assert.strictEqual(shrimp.priceCentavos, 85000);
    assert.strictEqual(shrimp.isAlcohol, false);

    const beer = parsed.items.find((i) =>
      i.name.includes("San Mig Light Bucket"),
    );
    assert.ok(beer, "Beer bucket should be extracted");
    assert.strictEqual(beer.priceCentavos, 55000);
    assert.strictEqual(beer.isAlcohol, true);

    // Financial totals
    assert.strictEqual(parsed.subtotalCentavos, 276000);
    assert.strictEqual(parsed.serviceChargeCentavos, 27600);
    assert.strictEqual(parsed.totalCentavos, 303600);
  });

  it("2. should detect alcoholic items and apply non-drinker exemption heuristic", () => {
    const rawText = SAMPLE_RECEIPT_TEXTS.tagpuanSanJuan;
    const parsed = ReceiptOcrService.parseReceiptText(rawText, members);

    const beerItem = parsed.items.find((i) => i.isAlcohol);
    assert.ok(beerItem, "Beer item should be marked as alcohol");

    // Bea Alonzo is marked as isNonDrinker: true, so she should NOT be assigned
    assert.ok(
      !beerItem.assignedUserIds.includes("user-bea"),
      "Non-drinker Bea Alonzo must be excluded from beer assignment",
    );
    assert.ok(beerItem.assignedUserIds.includes("user-miguel"));
    assert.ok(beerItem.assignedUserIds.includes("user-carlos"));
    assert.ok(beerItem.assignedUserIds.includes("user-denise"));

    // Food item should assign all 4 members
    const foodItem = parsed.items.find((i) => !i.isAlcohol);
    assert.ok(foodItem, "Food item should exist");
    assert.strictEqual(foodItem.assignedUserIds.length, 4);
    assert.ok(foodItem.assignedUserIds.includes("user-bea"));
  });

  it("3. should calculate exact proportional SC/Tax splits with 100% centavo conservation", () => {
    const rawText = SAMPLE_RECEIPT_TEXTS.tagpuanSanJuan;
    const parsed = ReceiptOcrService.parseReceiptText(rawText, members);

    const calculation = ReceiptOcrService.calculateSplits(
      parsed.items,
      members,
      parsed.serviceChargeCentavos,
      parsed.taxCentavos,
    );

    assert.strictEqual(calculation.totalCentavos, 303600);
    assert.strictEqual(calculation.isConservationExact, true);

    // Bea (non-drinker) owes less because she consumed no alcohol and no alcohol SC
    const beaSplit = calculation.memberSplits.find(
      (m) => m.userId === "user-bea",
    );
    const miguelSplit = calculation.memberSplits.find(
      (m) => m.userId === "user-miguel",
    );

    assert.ok(beaSplit, "Bea split should exist");
    assert.ok(miguelSplit, "Miguel split should exist");

    assert.ok(
      beaSplit.totalOwedCentavos < miguelSplit.totalOwedCentavos,
      "Non-drinker share should be strictly less than drinker share",
    );

    // Sum of all splits must equal total
    const splitSum = calculation.memberSplits.reduce(
      (sum, m) => sum + m.totalOwedCentavos,
      0,
    );
    assert.strictEqual(splitSum, 303600);
  });

  it("4. should save scanned receipt expense into SQLite and enqueue outbox mutation", async () => {
    await outboxSyncService.hydrateInitialData("trip-elyu-demo");

    const rawText = SAMPLE_RECEIPT_TEXTS.balerSurfside;
    const parsed = ReceiptOcrService.parseReceiptText(rawText, members);
    const calculation = ReceiptOcrService.calculateSplits(
      parsed.items,
      members,
      parsed.serviceChargeCentavos,
      parsed.taxCentavos,
    );

    const expenseId = "exp-ocr-baler-01";
    const newExpense: LocalExpense = {
      id: expenseId,
      tripId: "trip-elyu-demo",
      paidById: "user-carlos",
      paidByName: "Carlos Mendoza",
      title: "Baler Surfside Grill Dinner",
      category: "FOOD_AND_DINING",
      totalCentavos: calculation.totalCentavos,
      serviceTaxCentavos: parsed.serviceChargeCentavos + parsed.taxCentavos,
      isSynced: false,
      createdAt: new Date().toISOString(),
      items: parsed.items.map((it) => ({
        id: `item-${it.id}`,
        expenseId,
        name: it.name,
        priceCentavos: it.priceCentavos,
        quantity: it.quantity,
        consumerIds: it.assignedUserIds,
      })),
      splits: calculation.memberSplits.map((ms, idx) => ({
        id: `split-${expenseId}-${idx}`,
        expenseId,
        userId: ms.userId,
        userName: ms.userName,
        amountCentavos: ms.totalOwedCentavos,
        isSettled: ms.userId === "user-carlos",
      })),
    };

    const saved = await outboxSyncService.addExpenseOptimistic(newExpense);
    assert.strictEqual(saved.id, expenseId);

    // Check in SQLite database
    const inDb = await expenseRepository.getByTripId("trip-elyu-demo");
    const foundInDb = inDb.find((e) => e.id === expenseId);
    assert.ok(foundInDb, "Receipt expense must be persisted in SQLite");
    assert.strictEqual(foundInDb.totalCentavos, 154000);
    assert.strictEqual(foundInDb.items.length, 4);

    // Check outbox queue
    const pending = await outboxRepository.getPending();
    const queuedMutation = pending.find(
      (m) => m.mutationType === "ADD_EXPENSE",
    );
    assert.ok(queuedMutation, "ADD_EXPENSE mutation must be queued");
  });
});
