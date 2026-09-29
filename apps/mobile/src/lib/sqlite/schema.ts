/**
 * GalaPH Local SQLite Schema & DDL Migrations
 * Provides offline-first persistence for trips, itinerary, Bayanihan packing, and expenses.
 */

export const SQLITE_SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS local_trips (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  travel_mode TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  cover_image_url TEXT,
  is_offline_cached INTEGER NOT NULL DEFAULT 1,
  members_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_itinerary_items (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  time_slot TEXT NOT NULL,
  activity TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  estimated_cost_centavos INTEGER NOT NULL DEFAULT 0,
  is_synced INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (trip_id) REFERENCES local_trips (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS local_packing_items (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  assigned_to_id TEXT,
  assigned_to_name TEXT,
  is_packed INTEGER NOT NULL DEFAULT 0,
  packed_at TEXT,
  is_synced INTEGER NOT NULL DEFAULT 1,
  is_local_draft INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (trip_id) REFERENCES local_trips (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS local_expenses (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  paid_by_id TEXT NOT NULL,
  paid_by_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  total_centavos INTEGER NOT NULL,
  service_tax_centavos INTEGER NOT NULL DEFAULT 0,
  receipt_url TEXT,
  is_synced INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES local_trips (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS local_expense_items (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_centavos INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  consumer_ids_json TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (expense_id) REFERENCES local_expenses (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS local_expense_splits (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  amount_centavos INTEGER NOT NULL,
  is_settled INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (expense_id) REFERENCES local_expenses (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS outbox_mutations (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  mutation_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_itinerary_trip ON local_itinerary_items(trip_id, day_number);
CREATE INDEX IF NOT EXISTS idx_packing_trip ON local_packing_items(trip_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON local_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_mutations(status, created_at);
`;
