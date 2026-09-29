/**
 * Expense Repository — Local SQLite KKB Expenses & Line Items
 */

import { sqliteClient } from "../db";
import type {
  LocalExpense,
  LocalExpenseItem,
  LocalExpenseSplit,
} from "../../../types";

interface ExpenseRow {
  id: string;
  trip_id: string;
  paid_by_id: string;
  paid_by_name: string;
  title: string;
  category: string;
  total_centavos: number;
  service_tax_centavos: number;
  receipt_url: string | null;
  is_synced: number;
  created_at: string;
}

interface ExpenseItemRow {
  id: string;
  expense_id: string;
  name: string;
  price_centavos: number;
  quantity: number;
  consumer_ids_json: string;
}

interface ExpenseSplitRow {
  id: string;
  expense_id: string;
  user_id: string;
  user_name: string;
  amount_centavos: number;
  is_settled: number;
}

export const expenseRepository = {
  async getByTripId(tripId: string): Promise<LocalExpense[]> {
    const db = await sqliteClient.getDb();
    const expenseRows = await db.getAllAsync<ExpenseRow>(
      "SELECT * FROM local_expenses WHERE trip_id = ? ORDER BY created_at DESC",
      [tripId],
    );

    const expenses: LocalExpense[] = [];

    for (const expRow of expenseRows) {
      const itemRows = await db.getAllAsync<ExpenseItemRow>(
        "SELECT * FROM local_expense_items WHERE expense_id = ?",
        [expRow.id],
      );

      const items: LocalExpenseItem[] = itemRows.map((it) => {
        let consumerIds: string[] = [];
        try {
          consumerIds = JSON.parse(it.consumer_ids_json || "[]");
        } catch {
          consumerIds = [];
        }
        return {
          id: it.id,
          expenseId: it.expense_id,
          name: it.name,
          priceCentavos: it.price_centavos,
          quantity: it.quantity,
          consumerIds,
        };
      });

      const splitRows = await db.getAllAsync<ExpenseSplitRow>(
        "SELECT * FROM local_expense_splits WHERE expense_id = ?",
        [expRow.id],
      );

      const splits: LocalExpenseSplit[] = splitRows.map((s) => ({
        id: s.id,
        expenseId: s.expense_id,
        userId: s.user_id,
        userName: s.user_name,
        amountCentavos: s.amount_centavos,
        isSettled: Boolean(s.is_settled),
      }));

      expenses.push({
        id: expRow.id,
        tripId: expRow.trip_id,
        paidById: expRow.paid_by_id,
        paidByName: expRow.paid_by_name,
        title: expRow.title,
        category: expRow.category as LocalExpense["category"],
        totalCentavos: expRow.total_centavos,
        serviceTaxCentavos: expRow.service_tax_centavos,
        receiptUrl: expRow.receipt_url || undefined,
        items,
        splits,
        isSynced: Boolean(expRow.is_synced),
        createdAt: expRow.created_at,
      });
    }

    return expenses;
  },

  async insert(expense: LocalExpense): Promise<void> {
    const db = await sqliteClient.getDb();

    // 1. Insert main expense record
    await db.runAsync(
      `INSERT OR REPLACE INTO local_expenses (
        id, trip_id, paid_by_id, paid_by_name, title, category,
        total_centavos, service_tax_centavos, receipt_url, is_synced, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.id,
        expense.tripId,
        expense.paidById,
        expense.paidByName,
        expense.title,
        expense.category,
        expense.totalCentavos,
        expense.serviceTaxCentavos,
        expense.receiptUrl || null,
        expense.isSynced ? 1 : 0,
        expense.createdAt,
      ],
    );

    // 2. Insert items
    for (const item of expense.items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO local_expense_items (
          id, expense_id, name, price_centavos, quantity, consumer_ids_json
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          expense.id,
          item.name,
          item.priceCentavos,
          item.quantity,
          JSON.stringify(item.consumerIds || []),
        ],
      );
    }

    // 3. Insert splits
    for (const split of expense.splits) {
      await db.runAsync(
        `INSERT OR REPLACE INTO local_expense_splits (
          id, expense_id, user_id, user_name, amount_centavos, is_settled
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          split.id,
          expense.id,
          split.userId,
          split.userName,
          split.amountCentavos,
          split.isSettled ? 1 : 0,
        ],
      );
    }
  },

  async markSynced(id: string): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync("UPDATE local_expenses SET is_synced = 1 WHERE id = ?", [
      id,
    ]);
  },

  async delete(id: string): Promise<void> {
    const db = await sqliteClient.getDb();
    await db.runAsync("DELETE FROM local_expense_splits WHERE expense_id = ?", [
      id,
    ]);
    await db.runAsync("DELETE FROM local_expense_items WHERE expense_id = ?", [
      id,
    ]);
    await db.runAsync("DELETE FROM local_expenses WHERE id = ?", [id]);
  },
};
