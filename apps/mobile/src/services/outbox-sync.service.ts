/**
 * GalaPH Mobile — Outbox Synchronization & Cache Hydration Engine
 * Implements offline-first reliability, idempotent writes, and local SQLite sync.
 */

import { tripRepository } from "../lib/sqlite/repositories/trip.repository";
import { itineraryRepository } from "../lib/sqlite/repositories/itinerary.repository";
import { packingRepository } from "../lib/sqlite/repositories/packing.repository";
import { expenseRepository } from "../lib/sqlite/repositories/expense.repository";
import { outboxRepository } from "../lib/sqlite/repositories/outbox.repository";
import {
  mobileApiClient,
  DEMO_MOBILE_TRIP,
  DEMO_MOBILE_ITINERARY,
  DEMO_MOBILE_PACKING,
  DEMO_MOBILE_EXPENSES,
} from "./api-client";
import type {
  OutboxMutation,
  OutboxMutationType,
  NetworkConnectionState,
  SyncResult,
  LocalPackingItem,
  LocalExpense,
  LocalItineraryItem,
} from "../types";

type StateListener = (state: NetworkConnectionState) => void;

class OutboxSyncService {
  private networkState: NetworkConnectionState = {
    isOnline: true,
    isInternetReachable: true,
    pendingOutboxCount: 0,
    lastSyncTimestamp: new Date().toISOString(),
  };

  private listeners: Set<StateListener> = new Set();
  private isSyncing = false;

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.networkState);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) {
      l({ ...this.networkState });
    }
  }

  setOnlineStatus(isOnline: boolean) {
    this.networkState.isOnline = isOnline;
    this.networkState.isInternetReachable = isOnline;
    this.notify();
    if (isOnline) {
      void this.processOutboxQueue();
    }
  }

  getNetworkState(): NetworkConnectionState {
    return { ...this.networkState };
  }

  /**
   * Initializes local SQLite database with trip data if empty.
   */
  async hydrateInitialData(tripId = "trip-elyu-demo"): Promise<void> {
    const existing = await tripRepository.getById(tripId);
    if (!existing) {
      await tripRepository.upsert(DEMO_MOBILE_TRIP);
      await itineraryRepository.upsertBatch(DEMO_MOBILE_ITINERARY);
      await packingRepository.upsertBatch(DEMO_MOBILE_PACKING);
      for (const exp of DEMO_MOBILE_EXPENSES) {
        await expenseRepository.insert(exp);
      }
    }
    await this.updatePendingCount();
  }

  /**
   * Enqueues an offline mutation with an idempotency UUID and monotonic timestamp.
   */
  async enqueueMutation<T extends Record<string, unknown>>(
    tripId: string,
    mutationType: OutboxMutationType,
    payload: T,
  ): Promise<OutboxMutation<T>> {
    const mutation: OutboxMutation<T> = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tripId,
      mutationType,
      payload,
      status: "PENDING",
      retryCount: 0,
      createdAt: new Date().toISOString(),
      idempotencyKey: `idemp-${tripId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };

    await outboxRepository.enqueue(mutation as OutboxMutation);
    await this.updatePendingCount();

    // If online, trigger queue processing in background
    if (this.networkState.isOnline) {
      void this.processOutboxQueue();
    }

    return mutation;
  }

  /**
   * Processes all pending items in the outbox queue.
   */
  async processOutboxQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        successful: 0,
        failed: 0,
        remainingPending: this.networkState.pendingOutboxCount,
        errors: [],
      };
    }

    this.isSyncing = true;
    const pending = await outboxRepository.getPending();
    let successful = 0;
    let failed = 0;
    const errors: Array<{ mutationId: string; error: string }> = [];

    for (const mut of pending) {
      await outboxRepository.updateStatus(mut.id, "SYNCING");

      try {
        const res = await mobileApiClient.sendOutboxMutation(
          mut.mutationType,
          mut.payload,
          mut.idempotencyKey,
        );

        if (res.success) {
          await outboxRepository.updateStatus(mut.id, "SYNCED");
          successful++;

          // Mark specific local entity as synced
          if (
            mut.mutationType === "ADD_EXPENSE" &&
            typeof mut.payload["id"] === "string"
          ) {
            await expenseRepository.markSynced(mut.payload["id"]);
          }
        } else {
          await outboxRepository.updateStatus(
            mut.id,
            "FAILED",
            "Network rejected",
          );
          failed++;
          errors.push({ mutationId: mut.id, error: "Network rejected" });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Sync error";
        await outboxRepository.updateStatus(mut.id, "FAILED", errorMsg);
        failed++;
        errors.push({ mutationId: mut.id, error: errorMsg });
      }
    }

    this.isSyncing = false;
    this.networkState.lastSyncTimestamp = new Date().toISOString();
    await this.updatePendingCount();

    return {
      successful,
      failed,
      remainingPending: this.networkState.pendingOutboxCount,
      errors,
    };
  }

  // ==========================================
  // Optimistic Offline Actions
  // ==========================================

  /**
   * Optimistically toggles a Bayanihan packing item, updates SQLite, and enqueues outbox mutation.
   */
  async togglePackingItemOptimistic(
    item: LocalPackingItem,
  ): Promise<LocalPackingItem> {
    const nextPacked = !item.isPacked;
    const packedAt = nextPacked ? new Date().toISOString() : undefined;

    const updatedItem: LocalPackingItem = {
      ...item,
      isPacked: nextPacked,
      packedAt,
      isSynced: false,
    };

    // 1. Write to local SQLite immediately
    await packingRepository.togglePacked(item.id, nextPacked, packedAt);

    // 2. Queue outbox mutation
    await this.enqueueMutation(item.tripId, "TOGGLE_PACKING_ITEM", {
      itemId: item.id,
      isPacked: nextPacked,
      packedAt,
    });

    return updatedItem;
  }

  /**
   * Optimistically adds a new Bayanihan packing item.
   */
  async addPackingItemOptimistic(
    item: LocalPackingItem,
  ): Promise<LocalPackingItem> {
    await packingRepository.upsert(item);
    await this.enqueueMutation(item.tripId, "ADD_PACKING_ITEM", {
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      assignedToId: item.assignedToId,
      assignedToName: item.assignedToName,
      isPacked: item.isPacked,
    });
    return item;
  }

  /**
   * Optimistically adds a new KKB expense with line items and splits.
   */
  async addExpenseOptimistic(expense: LocalExpense): Promise<LocalExpense> {
    await expenseRepository.insert(expense);
    await this.enqueueMutation(expense.tripId, "ADD_EXPENSE", {
      id: expense.id,
      title: expense.title,
      category: expense.category,
      totalCentavos: expense.totalCentavos,
      serviceTaxCentavos: expense.serviceTaxCentavos,
      paidById: expense.paidById,
      paidByName: expense.paidByName,
      items: expense.items,
      splits: expense.splits,
      createdAt: expense.createdAt,
    });
    return expense;
  }

  /**
   * Optimistically adds an itinerary item.
   */
  async addItineraryItemOptimistic(
    item: LocalItineraryItem,
  ): Promise<LocalItineraryItem> {
    await itineraryRepository.upsert(item);
    await this.enqueueMutation(item.tripId, "ADD_ITINERARY_ITEM", {
      id: item.id,
      dayNumber: item.dayNumber,
      timeSlot: item.timeSlot,
      activity: item.activity,
      location: item.location,
      estimatedCostCentavos: item.estimatedCostCentavos,
    });
    return item;
  }

  private async updatePendingCount() {
    const count = await outboxRepository.getPendingCount();
    this.networkState.pendingOutboxCount = count;
    this.notify();
  }
}

export const outboxSyncService = new OutboxSyncService();
