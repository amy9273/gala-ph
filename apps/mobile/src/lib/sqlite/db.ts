/**
 * GalaPH Mobile — SQLite Client Wrapper
 * Manages database lifecycle, migrations, and typed query execution.
 * Supports native expo-sqlite on device/simulator and memory fallback in Node test runners.
 */

import { CREATE_TABLES_SQL } from "./schema";

export interface DatabaseAdapter {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    params?: (string | number | null | undefined)[],
  ): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T>(
    sql: string,
    params?: (string | number | null | undefined)[],
  ): Promise<T[]>;
  getFirstAsync<T>(
    sql: string,
    params?: (string | number | null | undefined)[],
  ): Promise<T | null>;
}

class InMemStorage {
  private tables: Map<string, Map<string, Record<string, unknown>>> = new Map();

  constructor() {
    this.tables.set("local_trips", new Map());
    this.tables.set("local_itinerary_items", new Map());
    this.tables.set("local_packing_items", new Map());
    this.tables.set("local_expenses", new Map());
    this.tables.set("local_expense_items", new Map());
    this.tables.set("local_expense_splits", new Map());
    this.tables.set("outbox_mutations", new Map());
  }

  getTable(name: string) {
    let tbl = this.tables.get(name);
    if (!tbl) {
      tbl = new Map();
      this.tables.set(name, tbl);
    }
    return tbl;
  }

  clear() {
    for (const tbl of this.tables.values()) {
      tbl.clear();
    }
  }
}

class MemoryDatabaseAdapter implements DatabaseAdapter {
  private mem = new InMemStorage();

  async execAsync(_sql: string): Promise<void> {
    return Promise.resolve();
  }

  async runAsync(
    sql: string,
    params: (string | number | null | undefined)[] = [],
  ): Promise<{ changes: number; lastInsertRowId: number }> {
    const trimmed = sql.trim();

    // INSERT OR REPLACE / INSERT INTO
    if (trimmed.startsWith("INSERT")) {
      const match = trimmed.match(
        /INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i,
      );
      if (match && match[1] && match[2]) {
        const tableName = match[1];
        const cols = match[2].split(",").map((c) => c.trim());
        const table = this.mem.getTable(tableName);
        const record: Record<string, unknown> = {};
        for (let i = 0; i < cols.length; i++) {
          const colName = cols[i];
          if (colName) {
            record[colName] = params[i] ?? null;
          }
        }
        const id = String(record["id"] || `gen-${Date.now()}-${Math.random()}`);
        table.set(id, record);
        return { changes: 1, lastInsertRowId: 1 };
      }
    }

    // UPDATE
    if (trimmed.startsWith("UPDATE")) {
      const match = trimmed.match(
        /UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+)\s+WHERE\s+id\s*=\s*\?/i,
      );
      if (match && match[1] && match[2]) {
        const tableName = match[1];
        const table = this.mem.getTable(tableName);
        const whereId = params[params.length - 1];
        if (whereId !== undefined) {
          const id = String(whereId);
          const existing = table.get(id);
          if (existing) {
            const setClauses = match[2].split(",").map((s) => s.trim());
            let paramIdx = 0;
            for (const clause of setClauses) {
              const [colName, valExpr] = clause.split("=").map((s) => s.trim());
              if (colName) {
                if (valExpr === "?") {
                  existing[colName] = params[paramIdx++] ?? null;
                } else if (valExpr && valExpr.includes("+")) {
                  // e.g. retry_count = retry_count + 1
                  const currentVal = Number(existing[colName] || 0);
                  existing[colName] = currentVal + 1;
                }
              }
            }
            table.set(id, existing);
            return { changes: 1, lastInsertRowId: 0 };
          }
        }
      }
    }

    // DELETE
    if (trimmed.startsWith("DELETE")) {
      const match = trimmed.match(
        /FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?/i,
      );
      if (match && match[1]) {
        const tableName = match[1];
        const table = this.mem.getTable(tableName);
        const whereClause = match[2];
        if (!whereClause) {
          table.clear();
          return { changes: 1, lastInsertRowId: 0 };
        }
        if (whereClause.includes("status = 'SYNCED'")) {
          for (const [id, rec] of Array.from(table.entries())) {
            if (rec["status"] === "SYNCED") {
              table.delete(id);
            }
          }
          return { changes: 1, lastInsertRowId: 0 };
        }
        if (params[0] !== undefined) {
          const deleted = table.delete(String(params[0]));
          return { changes: deleted ? 1 : 0, lastInsertRowId: 0 };
        }
      }
    }

    return { changes: 1, lastInsertRowId: 0 };
  }

  async getAllAsync<T>(
    sql: string,
    params: (string | number | null | undefined)[] = [],
  ): Promise<T[]> {
    const trimmed = sql.trim();
    const match = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!match || !match[1]) return [];
    const tableName = match[1];
    const table = this.mem.getTable(tableName);
    let items = Array.from(table.values());

    // Filter by trip_id if queried
    if (trimmed.includes("trip_id = ?") && params.length > 0) {
      const tripId = params[0];
      items = items.filter((it) => it["trip_id"] === tripId);
    }
    // Filter by expense_id if queried
    if (trimmed.includes("expense_id = ?") && params.length > 0) {
      const expenseId = params[0];
      items = items.filter((it) => it["expense_id"] === expenseId);
    }
    // Filter by status if queried
    if (trimmed.includes("status IN ('PENDING', 'FAILED')")) {
      items = items.filter(
        (it) => it["status"] === "PENDING" || it["status"] === "FAILED",
      );
    } else if (trimmed.includes("status IN ('PENDING', 'FAILED', 'SYNCING')")) {
      items = items.filter(
        (it) =>
          it["status"] === "PENDING" ||
          it["status"] === "FAILED" ||
          it["status"] === "SYNCING",
      );
    } else if (trimmed.includes("status = ?") && params.length > 0) {
      const status = params[0];
      items = items.filter((it) => it["status"] === status);
    }

    return items as unknown as T[];
  }

  async getFirstAsync<T>(
    sql: string,
    params: (string | number | null | undefined)[] = [],
  ): Promise<T | null> {
    const results = await this.getAllAsync<T>(sql, params);
    return results[0] ?? null;
  }
}

class SQLiteClient {
  private db: DatabaseAdapter | null = null;
  private isInitialized = false;

  async getDb(): Promise<DatabaseAdapter> {
    if (this.db) return this.db;

    try {
      // Dynamic import of expo-sqlite for React Native environment
      interface ExpoSQLiteModule {
        openDatabaseAsync?: (name: string) => Promise<unknown>;
        openDatabaseSync?: (name: string) => unknown;
      }
      const sqliteModule = (await import("expo-sqlite").catch(
        () => null,
      )) as ExpoSQLiteModule | null;

      if (
        sqliteModule &&
        typeof sqliteModule.openDatabaseAsync === "function"
      ) {
        const nativeDb = await sqliteModule.openDatabaseAsync("galaph.db");
        this.db = nativeDb as unknown as DatabaseAdapter;
      } else if (
        sqliteModule &&
        typeof sqliteModule.openDatabaseSync === "function"
      ) {
        const nativeDb = sqliteModule.openDatabaseSync("galaph.db");
        this.db = nativeDb as unknown as DatabaseAdapter;
      } else {
        this.db = new MemoryDatabaseAdapter();
      }
    } catch {
      this.db = new MemoryDatabaseAdapter();
    }

    if (!this.isInitialized) {
      await this.initSchema();
      this.isInitialized = true;
    }

    return this.db;
  }

  private async initSchema(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.execAsync(CREATE_TABLES_SQL);
    } catch {
      const statements = CREATE_TABLES_SQL.split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        try {
          await this.db.execAsync(stmt);
        } catch {
          // Ignored for existing tables
        }
      }
    }
  }

  async resetDatabase(): Promise<void> {
    const db = await this.getDb();
    const tables = [
      "outbox_mutations",
      "local_expense_splits",
      "local_expense_items",
      "local_expenses",
      "local_packing_items",
      "local_itinerary_items",
      "local_trips",
    ];
    for (const tbl of tables) {
      try {
        await db.runAsync(`DELETE FROM ${tbl}`);
      } catch {
        // Ignored
      }
    }
  }
}

export const sqliteClient = new SQLiteClient();
