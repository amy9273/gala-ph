"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Receipt, Wine, Car, Users } from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import {
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  TripDetail,
  calculateItemizedSplits,
} from "../../lib/api";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

export interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripMembers: TripDetail["members"];
  onSubmit: (expense: Expense) => void;
}

interface ItemRow {
  id: string;
  name: string;
  price: string;
  quantity: number;
  consumerIds: string[];
}

export function CreateExpenseModal({
  isOpen,
  onClose,
  tripMembers,
  onSubmit,
}: CreateExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD_AND_DINING");
  const [paidById, setPaidById] = useState<string>(
    tripMembers[0]?.userId || "u1",
  );
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const allMemberIds = tripMembers.map((m) => m.userId);
  const drinkerMemberIds = tripMembers
    .filter((m) => !m.isNonDrinker)
    .map((m) => m.userId);
  const passengerMemberIds = tripMembers
    .filter((m) => !m.isDriver)
    .map((m) => m.userId);

  const [items, setItems] = useState<ItemRow[]>([
    {
      id: "row-1",
      name: "",
      price: "",
      quantity: 1,
      consumerIds: allMemberIds,
    },
  ]);

  if (!isOpen) return null;

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        name: "",
        price: "",
        quantity: 1,
        consumerIds:
          category === "ALCOHOL_AND_BAR"
            ? drinkerMemberIds
            : category === "TOLL_HIGHWAY" || category === "FUEL_AND_GAS"
              ? passengerMemberIds
              : allMemberIds,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const updateItemRow = (id: string, updates: Partial<ItemRow>) => {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const toggleConsumer = (rowId: string, userId: string) => {
    setItems((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const exists = r.consumerIds.includes(userId);
        const newConsumers = exists
          ? r.consumerIds.filter((id) => id !== userId)
          : [...r.consumerIds, userId];
        return { ...r, consumerIds: newConsumers };
      }),
    );
  };

  const setRowPreset = (
    rowId: string,
    preset: "ALL" | "DRINKERS" | "PASSENGERS",
  ) => {
    const targetIds =
      preset === "DRINKERS"
        ? drinkerMemberIds
        : preset === "PASSENGERS"
          ? passengerMemberIds
          : allMemberIds;
    updateItemRow(rowId, { consumerIds: targetIds });
  };

  // Convert rows to parsed items for calculation
  const parsedItems = items.map((r) => ({
    name: r.name || "Untitled Item",
    price: parseFloat(r.price) || 0,
    quantity: r.quantity || 1,
    consumerIds: r.consumerIds,
  }));

  const calculation = calculateItemizedSplits(
    parsedItems,
    serviceChargePercent,
    taxPercent,
    tripMembers,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || calculation.totalAmount <= 0) return;

    const paidMember = tripMembers.find((m) => m.userId === paidById);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      tripId: "trip-elyu-01",
      title: title.trim(),
      category,
      totalAmount: calculation.totalAmount,
      totalAmountCentavos: Math.round(calculation.totalAmount * 100),
      serviceChargeAmount: calculation.serviceChargeAmount,
      taxAmount: calculation.taxAmount,
      serviceChargePercent,
      taxPercent,
      paidById,
      paidByName: paidMember?.user.name || "Trip Member",
      paidByAvatar: paidMember?.user.avatarUrl,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      items: items.map((r, idx) => {
        const unitPrice = parseFloat(r.price) || 0;
        const subtotal = unitPrice * (r.quantity || 1);
        return {
          id: `item-${Date.now()}-${idx}`,
          name: r.name.trim() || `Item ${idx + 1}`,
          price: unitPrice,
          priceCentavos: Math.round(unitPrice * 100),
          quantity: r.quantity || 1,
          subtotal,
          subtotalCentavos: Math.round(subtotal * 100),
          consumerIds: r.consumerIds,
        };
      }),
      splits: calculation.splits,
    };

    onSubmit(newExpense);
    toast({
      title: "KKB Expense Created",
      description: `"${newExpense.title}" (₱${newExpense.totalAmount.toFixed(2)}) split and added to ledger.`,
      variant: "success",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-nature-emerald/10 text-nature-emerald">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Itemize &amp; Split Barkada Bill (KKB)
              </h3>
              <p className="text-xs text-muted-foreground">
                Tag individual eaters, non-drinkers, and auto-apportion service
                charges.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Top Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Expense Title / Restaurant Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. San Fernando Dampa / Flotsam Sunset Tab"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-nature-emerald focus:outline-none focus:ring-2 focus:ring-nature-emerald/20"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Expense Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground focus:border-nature-emerald focus:outline-none focus:ring-2 focus:ring-nature-emerald/20"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(
                  ([catKey, meta]) => (
                    <option key={catKey} value={catKey}>
                      {meta.icon} {meta.label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Who Paid for the Bill?
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground focus:border-nature-emerald focus:outline-none focus:ring-2 focus:ring-nature-emerald/20"
              >
                {tripMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} {m.isDriver ? "(Driver)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Service Charge (SC %)
              </label>
              <select
                value={serviceChargePercent}
                onChange={(e) =>
                  setServiceChargePercent(Number(e.target.value))
                }
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground focus:border-nature-emerald focus:outline-none focus:ring-2 focus:ring-nature-emerald/20"
              >
                <option value={0}>0% (No Service Charge)</option>
                <option value={5}>5% Service Charge</option>
                <option value={8}>8% Service Charge</option>
                <option value={10}>10% Standard SC</option>
                <option value={12}>12% Service Charge</option>
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Local Tax / VAT (%)
              </label>
              <select
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground focus:border-nature-emerald focus:outline-none focus:ring-2 focus:ring-nature-emerald/20"
              >
                <option value={0}>0% (Tax Included / None)</option>
                <option value={5}>5% Local Tax</option>
                <option value={12}>12% Standard VAT</option>
              </select>
            </div>
          </div>

          {/* Line Items Builder Table */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-nature-emerald" />
                <span>Line Items &amp; Eater Tagging</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItemRow}
                className="gap-1.5 rounded-xl text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((row, idx) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-border bg-surface-secondary/40 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground w-6">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Dish / item name (e.g. Garlic Butter Prawns)"
                      value={row.name}
                      onChange={(e) =>
                        updateItemRow(row.id, { name: e.target.value })
                      }
                      className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-nature-emerald focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground font-bold text-xs">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        placeholder="Price"
                        value={row.price}
                        onChange={(e) =>
                          updateItemRow(row.id, { price: e.target.value })
                        }
                        className="w-24 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-nature-emerald focus:outline-none text-right"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-[11px]">
                        x
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          updateItemRow(row.id, {
                            quantity: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1,
                            ),
                          })
                        }
                        className="w-14 rounded-xl border border-border bg-surface px-2 py-2 text-xs font-bold text-foreground focus:border-nature-emerald focus:outline-none text-center"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(row.id)}
                        className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Eater / Consumer Chips */}
                  <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">
                        Tagged Eaters:
                      </span>
                      {tripMembers.map((member) => {
                        const isSelected = row.consumerIds.includes(
                          member.userId,
                        );
                        return (
                          <button
                            key={member.userId}
                            type="button"
                            onClick={() =>
                              toggleConsumer(row.id, member.userId)
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                              isSelected
                                ? "border-nature-emerald bg-nature-emerald/15 text-nature-emerald"
                                : "border-border bg-surface text-muted-foreground hover:bg-surface-secondary"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isSelected
                                  ? "bg-nature-emerald"
                                  : "bg-muted-foreground"
                              }`}
                            />
                            <span>{member.user.name.split(" ")[0]}</span>
                            {member.isNonDrinker && (
                              <span className="text-[9px] opacity-70">🌱</span>
                            )}
                            {member.isDriver && (
                              <span className="text-[9px] opacity-70">🚗</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Preset Split Quick Buttons */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setRowPreset(row.id, "ALL")}
                        className="rounded-lg px-2 py-0.5 bg-surface text-muted-foreground hover:text-foreground border border-border flex items-center gap-1"
                        title="Everyone shared this item"
                      >
                        <Users className="h-3 w-3" />
                        <span>All</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRowPreset(row.id, "DRINKERS")}
                        className="rounded-lg px-2 py-0.5 bg-surface text-muted-foreground hover:text-foreground border border-border flex items-center gap-1"
                        title="Drinkers only (excludes non-drinkers)"
                      >
                        <Wine className="h-3 w-3 text-amber-500" />
                        <span>Drinkers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRowPreset(row.id, "PASSENGERS")}
                        className="rounded-lg px-2 py-0.5 bg-surface text-muted-foreground hover:text-foreground border border-border flex items-center gap-1"
                        title="Passengers only (exempts carpool driver)"
                      >
                        <Car className="h-3 w-3 text-brand-ocean" />
                        <span>Passengers</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes field */}
          <div>
            <label className="font-bold uppercase tracking-wider text-muted-foreground">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Non-drinker Bea excluded from cocktails tab"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-nature-emerald focus:outline-none"
            />
          </div>

          {/* Realtime Live Split Preview Bento */}
          <div className="rounded-2xl border border-nature-emerald/30 bg-nature-emerald/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-nature-emerald">
                  Live Bill Calculation
                </span>
                <div className="text-xl font-black text-foreground">
                  {formatPHP(calculation.totalAmount, false)}
                </div>
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                <div>
                  Food Subtotal: {formatPHP(calculation.subtotal, false)}
                </div>
                {calculation.serviceChargeAmount > 0 && (
                  <div>
                    SC ({serviceChargePercent}%):{" "}
                    {formatPHP(calculation.serviceChargeAmount, false)}
                  </div>
                )}
                {calculation.taxAmount > 0 && (
                  <div>
                    Tax ({taxPercent}%):{" "}
                    {formatPHP(calculation.taxAmount, false)}
                  </div>
                )}
              </div>
            </div>

            {/* Per-member live share chips */}
            <div className="pt-2 border-t border-nature-emerald/20">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Calculated Share Per Barkada:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {calculation.splits.map((s) => (
                  <div
                    key={s.userId}
                    className="rounded-xl bg-surface p-2 border border-border/80 text-center"
                  >
                    <div className="text-[11px] font-semibold text-foreground truncate">
                      {s.userName.split(" ")[0]}
                    </div>
                    <div className="text-xs font-black text-nature-emerald">
                      {formatPHP(s.totalOwed, false)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="emerald"
              className="rounded-xl px-6"
              disabled={calculation.totalAmount <= 0}
            >
              Log Itemized Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
