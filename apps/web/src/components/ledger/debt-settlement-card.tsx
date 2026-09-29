"use client";

import React from "react";
import {
  ArrowRight,
  Sparkles,
  QrCode,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Check,
} from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import { MemberBalance, DebtSettlement } from "../../lib/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export interface DebtSettlementCardProps {
  balances: MemberBalance[];
  settlements: DebtSettlement[];
  onOpenQRModal: (settlement: DebtSettlement) => void;
  onMarkSettled: (settlementId: string) => void;
}

export function DebtSettlementCard({
  balances,
  settlements,
  onOpenQRModal,
  onMarkSettled,
}: DebtSettlementCardProps) {
  const totalTripOwed = balances
    .filter((b) => b.netBalance < 0)
    .reduce((sum, b) => sum + Math.abs(b.netBalance), 0);

  return (
    <div className="space-y-6">
      {/* Net Balances Overview Grid */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-ocean" />
              <span>Barkada Net Balances</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Total paid vs. owed per participant with strict conservation of
              money (Net sum = ₱0.00).
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground">
              Total Unsettled
            </span>
            <div className="text-base font-black text-foreground">
              {formatPHP(totalTripOwed, false)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {balances.map((mb) => {
            const isCreditor = mb.netBalance > 0.01;
            const isDebtor = mb.netBalance < -0.01;
            const isSettled = !isCreditor && !isDebtor;

            return (
              <div
                key={mb.userId}
                className={`rounded-2xl border p-4 space-y-2 transition-all ${
                  isCreditor
                    ? "border-nature-emerald/30 bg-nature-emerald/5"
                    : isDebtor
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-border bg-surface-secondary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                        isCreditor
                          ? "bg-nature-emerald/20 text-nature-emerald"
                          : isDebtor
                            ? "bg-rose-500/20 text-rose-500"
                            : "bg-surface-secondary text-muted-foreground"
                      }`}
                    >
                      {mb.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">
                      {mb.name}
                    </span>
                  </div>

                  {isCreditor && (
                    <Badge variant="settled" className="text-[10px]">
                      Gets Back
                    </Badge>
                  )}
                  {isDebtor && (
                    <Badge variant="unsettled" className="text-[10px]">
                      Owes
                    </Badge>
                  )}
                  {isSettled && (
                    <Badge variant="outline" className="text-[10px]">
                      Settled
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {isCreditor ? (
                        <TrendingUp className="h-3.5 w-3.5 text-nature-emerald" />
                      ) : isDebtor ? (
                        <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span>Net Balance:</span>
                    </span>
                    <span
                      className={`text-sm font-black ${
                        isCreditor
                          ? "text-nature-emerald"
                          : isDebtor
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {isCreditor ? "+" : ""}
                      {formatPHP(mb.netBalance, false)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span>Paid: {formatPHP(mb.totalPaid, false)}</span>
                    <span>Owed: {formatPHP(mb.totalOwed, false)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Greedy Bilateral Debt Simplification Solver Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <QrCode className="h-4 w-4 text-brand-ocean" />
              <span>Optimized Bilateral Debt Settlements</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Greedy graph solver collapsed tangled debts into{" "}
              {settlements.length} direct transfers.
            </p>
          </div>
          <Badge variant="convoy">Graph Solver: O(N²) → ≤ N-1</Badge>
        </div>

        {settlements.length > 0 ? (
          <div className="space-y-3">
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  settlement.isSettled
                    ? "border-nature-emerald/30 bg-nature-emerald/5 opacity-80"
                    : "border-border bg-surface-secondary/40 hover:border-brand-ocean/40"
                }`}
              >
                {/* Transfer Details */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-lg font-bold">
                    💸
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <span>{settlement.fromUserName}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-accent-sunset inline" />
                      <span className="text-brand-ocean">
                        {settlement.toUserName}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>Ref: {settlement.paymentRefCode}</span>
                      <span>•</span>
                      <span>GCash / Maya</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-semibold">
                      Settlement Amount
                    </div>
                    <div className="text-lg font-black text-foreground">
                      {formatPHP(settlement.amount, false)}
                    </div>
                  </div>

                  {settlement.isSettled ? (
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-nature-emerald/10 border border-nature-emerald/30 px-3 py-1.5 text-xs font-bold text-nature-emerald">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Settled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => onOpenQRModal(settlement)}
                        className="gap-1.5 rounded-xl text-xs"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Pay via QR</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onMarkSettled(settlement.id)}
                        className="gap-1.5 rounded-xl text-xs text-nature-emerald hover:bg-nature-emerald/10"
                        title="Mark as paid manually"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Done</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            All debts have been settled! Zero outstanding balances for this
            trip. 🎉
          </div>
        )}
      </div>
    </div>
  );
}
