/**
 * Itinerary Repository — Local SQLite CRUD operations
 */

import { sqliteClient } from "../db";
import type { LocalItineraryItem } from "../../../types";

interface ItineraryRow {
  id: string;
  trip_id: string;
  day_number: number;
  time_slot: string;
  activity: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  estimated_cost_centavos: number;
  is_synced: number;
}

function mapRowToItinerary(row: ItineraryRow): LocalItineraryItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayNumber: row.day_number,
    timeSlot: row.time_slot,
    activity: row.activity,
    location: row.location,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    estimatedCostCentavos: row.estimated_cost_centavos,
    isSynced: Boolean(row.is_synced),
  };
}

export const itineraryRepository = {
  async getByTripId(tripId: string): Promise<LocalItineraryItem[]> {
    const db = await sqliteClient.getDb();
    const rows = await db.getAllAsync<ItineraryRow>(
      "SELECT * FROM local_itinerary_items WHERE trip_id = ? ORDER BY day_number ASC, time_slot ASC",
      [tripId],
    );
    return rows.map((r) => mapRowToItinerary(r));
  },

  async upsert(item: LocalItineraryItem): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO local_itinerary_items (
        id, trip_id, day_number, time_slot, activity, location,
        latitude, longitude, estimated_cost_centavos, is_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.tripId,
        item.dayNumber,
        item.timeSlot,
        item.activity,
        item.location,
        item.latitude ?? null,
        item.longitude ?? null,
        item.estimatedCostCentavos,
        item.isSynced ? 1 : 0,
      ],
    );
  },

  async upsertBatch(items: LocalItineraryItem[]): Promise<void> {
    for (const it of items) {
      await this.upsert(it);
    }
  },

  async delete(id: string): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync("DELETE FROM local_itinerary_items WHERE id = ?", [id]);
  },
};
