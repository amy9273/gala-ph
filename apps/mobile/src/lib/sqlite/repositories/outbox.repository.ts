/**
 * Outbox Repository — Local SQLite Idempotent Mutation Queue
 * Guarantees zero duplicate operations during reconnect & retry.
 */

import { sqliteClient } from "../db";
import type { OutboxMutation, OutboxStatus } from "../../../types";

interface OutboxRow {
  id: string;
  trip_id: string;
  mutation_type: string;
  payload_json: string;
  status: string;
  retry_count: number;
  created_at: string;
  idempotency_key: string;
  last_error: string | null;
}

function mapRowToMutation(row: OutboxRow): OutboxMutation {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(row.payload_json || "{}");
  } catch {
    payload = {};
  }

  return {
    id: row.id,
    tripId: row.trip_id,
    mutationType: row.mutation_type as OutboxMutation["mutationType"],
    payload,
    status: row.status as OutboxStatus,
    retryCount: row.retry_count,
    createdAt: row.created_at,
    idempotencyKey: row.idempotency_key,
    lastError: row.last_error || undefined,
  };
}

export const outboxRepository = {
  async getPending(): Promise<OutboxMutation[]> {
    const db = await sqliteClient.getDb();
    const rows = await db.getAllAsync<OutboxRow>(
      "SELECT * FROM outbox_mutations WHERE status IN ('PENDING', 'FAILED') ORDER BY created_at ASC",
    );
    return rows.map((r) => mapRowToMutation(r));
  },

  async getAll(): Promise<OutboxMutation[]> {
    const db = await sqliteClient.getDb();
    const rows = await db.getAllAsync<OutboxRow>(
      "SELECT * FROM outbox_mutations ORDER BY created_at DESC",
    );
    return rows.map((r) => mapRowToMutation(r));
  },

  async getPendingCount(): Promise<number> {
    const db = await sqliteClient.getDb();
    const rows = await db.getAllAsync<OutboxRow>(
      "SELECT * FROM outbox_mutations WHERE status IN ('PENDING', 'FAILED', 'SYNCING')",
    );
    return rows.length;
  },

  async enqueue(mutation: OutboxMutation): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO outbox_mutations (
        id, trip_id, mutation_type, payload_json, status,
        retry_count, created_at, idempotency_key, last_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mutation.id,
        mutation.tripId,
        mutation.mutationType,
        JSON.stringify(mutation.payload || {}),
        mutation.status,
        mutation.retryCount,
        mutation.createdAt,
        mutation.idempotencyKey,
        mutation.lastError || null,
      ],
    );
  },

  async updateStatus(
    id: string,
    status: OutboxStatus,
    error?: string,
  ): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync(
      `UPDATE outbox_mutations
       SET status = ?, last_error = ?, retry_count = retry_count + 1
       WHERE id = ?`,
      [status, error || null, id],
    );
  },

  async delete(id: string): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync("DELETE FROM outbox_mutations WHERE id = ?", [id]);
  },

  async clearSynced(): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync("DELETE FROM outbox_mutations WHERE status = 'SYNCED'");
  },
};
