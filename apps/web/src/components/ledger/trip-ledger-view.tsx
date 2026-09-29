"use client";

import React, { useState } from "react";
import { PlusCircle, Receipt, QrCode, TrendingUp } from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import {
  TripDetail,
  Expense,
  DEMO_EXPENSES,
  solveDebtGraph,
  DebtSettlement,
} from "../../lib/api";
import { ExpenseSplitCard } from "./expense-split-card";
import { CreateExpenseModal } from "./create-expense-modal";
import { DebtSettlementCard } from "./debt-settlement-card";
import { QRPaymentModal } from "./qr-payment-modal";
import { Button } from "../ui/button";

export interface TripLedgerViewProps {
  trip: TripDetail;
  initialExpenses?: Expense[];
}

export function TripLedgerView({
  trip,
  initialExpenses = DEMO_EXPENSES,
}: TripLedgerViewProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"FEED" | "SETTLEMENTS">("FEED");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeQRModalSettlement, setActiveQRModalSettlement] =
    useState<DebtSettlement | null>(null);
  const [settlementsState, setSettlementsState] = useState<DebtSettlement[]>(
    [],
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute solver balances and settlements
  const { balances, settlements: computedSettlements } = solveDebtGraph(
    trip.members,
    expenses,
  );

  // Sync computed settlements with local state if empty or changed
  const activeSettlements =
    settlementsState.length > 0 ? settlementsState : computedSettlements;

  const handleCreateExpense = (newExpense: Expense) => {
    setExpenses((prev) => [newExpense, ...prev]);
    // Reset local settlements so solver recomputes
    setSettlementsState([]);
    setToastMessage(
      `✅ Logged expense "${newExpense.title}" for ${formatPHP(newExpense.totalAmount, false)}!`,
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    setSettlementsState([]);
    setToastMessage("🗑️ Expense deleted and debts recalculated.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkSettled = (settlementId: string) => {
    setSettlementsState((prev) => {
      const current = prev.length > 0 ? prev : computedSettlements;
      return current.map((s) =>
        s.id === settlementId ? { ...s, isSettled: true } : s,
      );
    });
    setToastMessage("🎉 Settlement marked as paid and completed!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const totalTripSpend = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const avgPerPerson =
    trip.members.length > 0 ? totalTripSpend / trip.members.length : 0;

  // Filtered expenses
  const filteredExpenses =
    selectedCategory === "ALL"
      ? expenses
      : expenses.filter((e) => e.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="rounded-2xl bg-nature-emerald/10 border border-nature-emerald/30 p-4 text-xs font-bold text-nature-emerald animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Spend Summary Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Total Group Spend</span>
            <Receipt className="h-4 w-4 text-nature-emerald" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatPHP(totalTripSpend, false)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {expenses.length} itemized receipts logged
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Average Per Head</span>
            <TrendingUp className="h-4 w-4 text-brand-ocean" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatPHP(avgPerPerson, false)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Split across {trip.members.length} barkada
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Active Bilateral Debts</span>
            <QrCode className="h-4 w-4 text-accent-sunset" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {activeSettlements.filter((s) => !s.isSettled).length}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Simplified from tangled splits
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-nature-emerald/10 to-brand-ocean/10 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span>Non-Drinker Shield</span>
            <span className="text-base">🌱</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Automated bar tab exclusion active for{" "}
            {trip.members.filter((m) => m.isNonDrinker).length} non-drinker
            members.
          </div>
        </div>
      </div>

      {/* Main Controls & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        {/* Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-surface-secondary/70 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("FEED")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "FEED"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="h-4 w-4 text-nature-emerald" />
            <span>Expense Feed ({expenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SETTLEMENTS")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "SETTLEMENTS"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-4 w-4 text-brand-ocean" />
            <span>Debt Settlement Hub</span>
          </button>
        </div>

        {/* Action Button */}
        <Button
          type="button"
          variant="emerald"
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 rounded-xl"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Log KKB Expense</span>
        </Button>
      </div>

      {/* Expense Feed View */}
      {activeTab === "FEED" && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "ALL", label: "All Expenses" },
              { id: "FOOD_AND_DINING", label: "🍽️ Dining" },
              { id: "ALCOHOL_AND_BAR", label: "🍻 Bar Tab" },
              { id: "TOLL_HIGHWAY", label: "🛣️ Tolls & Gas" },
              { id: "LODGING_RESORT", label: "🏨 Lodging" },
              { id: "LOCAL_TOUR_GUIDE", label: "🛺 Trike / Tour" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedCategory(pill.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === pill.id
                    ? "bg-brand-ocean text-white shadow-xs"
                    : "bg-surface-secondary text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Expenses List */}
          {filteredExpenses.length > 0 ? (
            <div className="space-y-4">
              {filteredExpenses.map((exp) => (
                <ExpenseSplitCard
                  key={exp.id}
                  expense={exp}
                  tripMembers={trip.members}
                  onDelete={handleDeleteExpense}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-xl">
                🧾
              </div>
              <h4 className="text-sm font-bold text-foreground">
                No expenses found in this category
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Log a group meal, bar bill, or expressway toll to see it
                itemized here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Debt Settlements View */}
      {activeTab === "SETTLEMENTS" && (
        <DebtSettlementCard
          balances={balances}
          settlements={activeSettlements}
          onOpenQRModal={(s) => setActiveQRModalSettlement(s)}
          onMarkSettled={handleMarkSettled}
        />
      )}

      {/* Create Expense Modal */}
      <CreateExpenseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        tripMembers={trip.members}
        onSubmit={handleCreateExpense}
      />

      {/* QR Settlement Modal */}
      <QRPaymentModal
        settlement={activeQRModalSettlement}
        isOpen={!!activeQRModalSettlement}
        onClose={() => setActiveQRModalSettlement(null)}
        onConfirmSettlement={handleMarkSettled}
      />
    </div>
  );
}
