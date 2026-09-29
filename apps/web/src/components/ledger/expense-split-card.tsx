"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Receipt,
  User,
  Trash2,
  Sparkles,
} from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import { Expense, EXPENSE_CATEGORY_LABELS, TripDetail } from "../../lib/api";
import { Badge } from "../ui/badge";

export interface ExpenseSplitCardProps {
  expense: Expense;
  tripMembers: TripDetail["members"];
  onDelete?: (expenseId: string) => void;
}

export function ExpenseSplitCard({
  expense,
  tripMembers,
  onDelete,
}: ExpenseSplitCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryMeta = EXPENSE_CATEGORY_LABELS[expense.category] || {
    label: expense.category,
    icon: "💸",
  };

  const formattedDate = new Date(expense.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-brand-ocean/40 space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-xl border border-border">
            {categoryMeta.icon}
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold">
                {categoryMeta.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formattedDate}
              </span>
            </div>
            <h4 className="text-base font-bold text-foreground">
              {expense.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5 text-brand-ocean" />
              <span>
                Paid by{" "}
                <strong className="text-foreground">
                  {expense.paidByName}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Total Bill</div>
            <div className="text-xl font-black text-foreground">
              {formatPHP(expense.totalAmount, false)}
            </div>
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(expense.id)}
              className="rounded-xl p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              title="Delete expense"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expense.notes && (
        <p className="text-xs text-muted-foreground italic bg-surface-secondary/50 rounded-xl p-2.5 border border-border/50">
          💬 {expense.notes}
        </p>
      )}

      {/* Member Splits Chips */}
      <div className="pt-2 border-t border-border/60">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          KKB Split Breakdown ({expense.splits.length} Members):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {expense.splits.map((split) => (
            <div
              key={split.userId}
              className="flex items-center justify-between rounded-xl bg-surface-secondary/70 p-2.5 text-xs border border-border/60"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-ocean/10 text-brand-ocean font-bold text-[10px]">
                  {split.userName.charAt(0)}
                </div>
                <span className="font-semibold text-foreground truncate">
                  {split.userName}
                </span>
              </div>
              <span className="font-extrabold text-foreground shrink-0 ml-1">
                {formatPHP(split.totalOwed, false)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Itemized Dish Accordion Toggle */}
      {expense.items.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-brand-ocean hover:text-brand-ocean/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              <span>
                {isExpanded ? "Hide" : "View"} {expense.items.length} Itemized
                Receipt Lines
              </span>
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-2 rounded-xl bg-surface-secondary/40 p-3 border border-border/60 animate-in fade-in duration-200">
              {expense.items.map((item) => {
                const itemConsumers = tripMembers.filter((m) =>
                  item.consumerIds.includes(m.userId),
                );

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground font-normal">
                            (x{item.quantity} @ {formatPHP(item.price, false)})
                          </span>
                        )}
                      </div>

                      {/* Consumer Avatars */}
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="text-[10px] uppercase font-bold">
                          Eaters:
                        </span>
                        {itemConsumers.map((c) => (
                          <span
                            key={c.userId}
                            className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border"
                          >
                            {c.user.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right font-extrabold text-foreground shrink-0">
                      {formatPHP(item.subtotal, false)}
                    </div>
                  </div>
                );
              })}

              {/* Service Charge & Tax Summary Footer */}
              {(expense.serviceChargeAmount > 0 || expense.taxAmount > 0) && (
                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
                  <div className="flex items-center gap-3">
                    {expense.serviceChargeAmount > 0 && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span>
                          Service Charge ({expense.serviceChargePercent}%):{" "}
                          <strong>
                            {formatPHP(expense.serviceChargeAmount, false)}
                          </strong>
                        </span>
                      </span>
                    )}
                    {expense.taxAmount > 0 && (
                      <span>
                        Tax ({expense.taxPercent}%):{" "}
                        <strong>{formatPHP(expense.taxAmount, false)}</strong>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] italic">
                    Proportionally apportioned based on consumption
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
