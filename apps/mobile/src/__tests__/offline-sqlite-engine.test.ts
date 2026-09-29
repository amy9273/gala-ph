import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sqliteClient } from "../lib/sqlite/db";
import { tripRepository } from "../lib/sqlite/repositories/trip.repository";
import { itineraryRepository } from "../lib/sqlite/repositories/itinerary.repository";
import { packingRepository } from "../lib/sqlite/repositories/packing.repository";
import { expenseRepository } from "../lib/sqlite/repositories/expense.repository";
import { outboxRepository } from "../lib/sqlite/repositories/outbox.repository";
import { outboxSyncService } from "../services/outbox-sync.service";
import type { LocalPackingItem, LocalExpense } from "../types";

describe("Unit 12: Mobile Scaffold & Offline SQLite Persistence Engine", () => {
  beforeEach(async () => {
    await sqliteClient.resetDatabase();
    outboxSyncService.setOnlineStatus(false); // Default to offline for discrete mutation testing
  });

  it("1. should initialize SQLite schema and hydrate initial demo trip", async () => {
    await outboxSyncService.hydrateInitialData("trip-elyu-demo");

    const trips = await tripRepository.getAll();
    assert.strictEqual(trips.length, 1);
    assert.strictEqual(trips[0]?.id, "trip-elyu-demo");
    assert.strictEqual(trips[0]?.destination, "San Juan, La Union");
    assert.strictEqual(trips[0]?.travelMode, "HYBRID");
    assert.strictEqual(trips[0]?.isOfflineCached, true);
    assert.strictEqual(trips[0]?.members.length, 4);

    const itinerary = await itineraryRepository.getByTripId("trip-elyu-demo");
    assert.strictEqual(itinerary.length, 6);
    assert.strictEqual(itinerary[0]?.dayNumber, 1);

    const packing = await packingRepository.getByTripId("trip-elyu-demo");
    assert.strictEqual(packing.length, 6);

    const expenses = await expenseRepository.getByTripId("trip-elyu-demo");
    assert.strictEqual(expenses.length, 2);
  });

  it("2. should perform optimistic Bayanihan packing toggle with SQLite update and outbox enqueue", async () => {
    await outboxSyncService.hydrateInitialData("trip-elyu-demo");

    const packingItems = await packingRepository.getByTripId("trip-elyu-demo");
    const targetItem = packingItems.find((it) => it.id === "pack-03"); // First Aid Kit (unpacked)
    assert.ok(targetItem, "Target packing item should exist");
    assert.strictEqual(targetItem.isPacked, false);

    // Toggle item to packed
    const updated =
      await outboxSyncService.togglePackingItemOptimistic(targetItem);
    assert.strictEqual(updated.isPacked, true);
    assert.strictEqual(updated.isSynced, false);

    // Verify written to SQLite
    const inDb = await packingRepository.getByTripId("trip-elyu-demo");
    const updatedInDb = inDb.find((it) => it.id === "pack-03");
    assert.strictEqual(updatedInDb?.isPacked, true);

    // Verify outbox mutation queued
    const pendingMutations = await outboxRepository.getPending();
    const toggleMutation = pendingMutations.find(
      (m) => m.mutationType === "TOGGLE_PACKING_ITEM",
    );
    assert.ok(toggleMutation, "Outbox mutation should be queued");
    assert.strictEqual(toggleMutation.status, "PENDING");
    assert.ok(toggleMutation.idempotencyKey.startsWith("idemp-trip-elyu-demo"));
  });

  it("3. should optimistically log an offline KKB expense with non-drinker exclusion and line items", async () => {
    await outboxSyncService.hydrateInitialData("trip-elyu-demo");

    const newExpense: LocalExpense = {
      id: "exp-test-01",
      tripId: "trip-elyu-demo",
      paidById: "user-miguel",
      paidByName: "Miguel Santos",
      title: "Kahuna Beachfront Cocktails & Pizza",
      category: "ALCOHOL_AND_BAR",
      totalCentavos: 150000,
      serviceTaxCentavos: 15000,
      isSynced: false,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: "item-cocktails",
          expenseId: "exp-test-01",
          name: "Mojito Pitcher & San Mig",
          priceCentavos: 150000,
          quantity: 1,
          consumerIds: ["user-miguel", "user-carlos", "user-denise"], // Bea excluded
        },
      ],
      splits: [
        {
          id: "split-m",
          expenseId: "exp-test-01",
          userId: "user-miguel",
          userName: "Miguel Santos",
          amountCentavos: 50000,
          isSettled: true,
        },
        {
          id: "split-c",
          expenseId: "exp-test-01",
          userId: "user-carlos",
          userName: "Carlos Mendoza",
          amountCentavos: 50000,
          isSettled: false,
        },
        {
          id: "split-d",
          expenseId: "exp-test-01",
          userId: "user-denise",
          userName: "Denise Laurel",
          amountCentavos: 50000,
          isSettled: false,
        },
      ],
    };

    const saved = await outboxSyncService.addExpenseOptimistic(newExpense);
    assert.strictEqual(saved.id, "exp-test-01");

    // Verify stored in SQLite
    const expensesInDb = await expenseRepository.getByTripId("trip-elyu-demo");
    const found = expensesInDb.find((e) => e.id === "exp-test-01");
    assert.ok(found, "Expense should be stored in SQLite");
    assert.strictEqual(found.totalCentavos, 150000);
    assert.strictEqual(found.items.length, 1);
    assert.strictEqual(found.splits.length, 3);

    // Verify outbox mutation queued
    const pending = await outboxRepository.getPending();
    const expMutation = pending.find((m) => m.mutationType === "ADD_EXPENSE");
    assert.ok(expMutation, "ADD_EXPENSE outbox mutation should be queued");
  });

  it("4. should process outbox queue and mark mutations as SYNCED without duplicates", async () => {
    await outboxSyncService.hydrateInitialData("trip-elyu-demo");

    const sampleItem: LocalPackingItem = {
      id: "pack-offline-01",
      tripId: "trip-elyu-demo",
      itemName: "Drone 4K Camera + Extra Batteries",
      category: "GEAR",
      quantity: 1,
      assignedToName: "Carlos Mendoza",
      isPacked: false,
      isSynced: false,
      isLocalDraft: true,
    };

    await outboxSyncService.addPackingItemOptimistic(sampleItem);

    const pendingBefore = await outboxRepository.getPending();
    assert.strictEqual(pendingBefore.length, 1);

    // Process outbox queue
    const syncResult = await outboxSyncService.processOutboxQueue();
    assert.strictEqual(syncResult.successful, 1);
    assert.strictEqual(syncResult.failed, 0);

    // Verify mutation status changed to SYNCED
    const allMutations = await outboxRepository.getAll();
    assert.strictEqual(allMutations[0]?.status, "SYNCED");

    // Verify pending queue is now empty
    const pendingAfter = await outboxRepository.getPending();
    assert.strictEqual(pendingAfter.length, 0);
  });
});
