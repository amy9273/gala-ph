/**
 * Packing Repository — Local SQLite Bayanihan Packing Checklist
 */

import { sqliteClient } from "../db";
import type { LocalPackingItem } from "../../../types";

interface PackingRow {
  id: string;
  trip_id: string;
  item_name: string;
  category: string;
  quantity: number;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  is_packed: number;
  packed_at: string | null;
  is_synced: number;
  is_local_draft: number;
}

function mapRowToPacking(row: PackingRow): LocalPackingItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    itemName: row.item_name,
    category: row.category as LocalPackingItem["category"],
    quantity: row.quantity,
    assignedToId: row.assigned_to_id || undefined,
    assignedToName: row.assigned_to_name || undefined,
    isPacked: Boolean(row.is_packed),
    packedAt: row.packed_at || undefined,
    isSynced: Boolean(row.is_synced),
    isLocalDraft: Boolean(row.is_local_draft),
  };
}

export const packingRepository = {
  async getByTripId(tripId: string): Promise<LocalPackingItem[]> {
    const db = await sqliteClient.getDb();
    const rows = await db.getAllAsync<PackingRow>(
      "SELECT * FROM local_packing_items WHERE trip_id = ? ORDER BY is_packed ASC, item_name ASC",
      [tripId],
    );
    return rows.map((r) => mapRowToPacking(r));
  },

  async upsert(item: LocalPackingItem): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO local_packing_items (
        id, trip_id, item_name, category, quantity, assigned_to_id,
        assigned_to_name, is_packed, packed_at, is_synced, is_local_draft
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.tripId,
        item.itemName,
        item.category,
        item.quantity,
        item.assignedToId || null,
        item.assignedToName || null,
        item.isPacked ? 1 : 0,
        item.packedAt || null,
        item.isSynced ? 1 : 0,
        item.isLocalDraft ? 1 : 0,
      ],
    );
  },

  async upsertBatch(items: LocalPackingItem[]): Promise<void> {
    for (const item of items) {
      await this.upsert(item);
    }
  },

  async togglePacked(
    id: string,
    isPacked: boolean,
    packedAt?: string,
  ): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync(
      `UPDATE local_packing_items
       SET is_packed = ?, packed_at = ?, is_synced = 0
       WHERE id = ?`,
      [
        isPacked ? 1 : 0,
        isPacked ? packedAt || new Date().toISOString() : null,
        id,
      ],
    );
  },

  async delete(id: string): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync("DELETE FROM local_packing_items WHERE id = ?", [id]);
  },
};
