/**
 * Trip Repository — Local SQLite CRUD operations
 */

import { sqliteClient } from "../db";
import type { LocalTrip, LocalTripMember } from "../../../types";

interface TripRow {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  travel_mode: string;
  invite_code: string;
  cover_image_url: string | null;
  is_offline_cached: number;
  members_json: string;
  updated_at: string;
}

function mapRowToTrip(row: TripRow): LocalTrip {
  let members: LocalTripMember[] = [];
  try {
    members = JSON.parse(row.members_json || "[]");
  } catch {
    members = [];
  }

  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    travelMode: row.travel_mode as LocalTrip["travelMode"],
    inviteCode: row.invite_code,
    coverImageUrl: row.cover_image_url || undefined,
    isOfflineCached: Boolean(row.is_offline_cached),
    members,
    updatedAt: row.updated_at,
  };
}

export const tripRepository = {
  async getAll(): Promise<LocalTrip[]> {
    const db = await sqliteClient.getDb();
    const rows = await db.getAllAsync<TripRow>(
      "SELECT * FROM local_trips ORDER BY start_date ASC",
    );
    return rows.map((r) => mapRowToTrip(r));
  },

  async getById(id: string): Promise<LocalTrip | null> {
    const db = await sqliteClient.getDb();
    const row = await db.getFirstAsync<TripRow>(
      "SELECT * FROM local_trips WHERE id = ?",
      [id],
    );
    return row ? mapRowToTrip(row) : null;
  },

  async upsert(trip: LocalTrip): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO local_trips (
        id, title, destination, start_date, end_date, travel_mode,
        invite_code, cover_image_url, is_offline_cached, members_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trip.id,
        trip.title,
        trip.destination,
        trip.startDate,
        trip.endDate,
        trip.travelMode,
        trip.inviteCode,
        trip.coverImageUrl || null,
        trip.isOfflineCached ? 1 : 0,
        JSON.stringify(trip.members || []),
        trip.updatedAt || new Date().toISOString(),
      ],
    );
  },

  async delete(id: string): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync("DELETE FROM local_trips WHERE id = ?", [id]);
  },
};
