"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import { DebtSettlement } from "../../lib/api";
import { Button } from "../ui/button";

export interface QRPaymentModalProps {
  settlement: DebtSettlement | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSettlement: (settlementId: string) => void;
}

export function QRPaymentModal({
  settlement,
  isOpen,
  onClose,
  onConfirmSettlement,
}: QRPaymentModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<"GCASH" | "MAYA">("GCASH");

  if (!isOpen || !settlement) return null;

  const mobileNumber =
    walletType === "GCASH"
      ? settlement.recipientGcash || "0917-123-4567"
      : settlement.recipientMaya || "0918-987-6543";

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSettle = () => {
    onConfirmSettlement(settlement.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Settle Peer-to-Peer Debt
              </h3>
              <p className="text-xs text-muted-foreground">
                QR Ph, GCash &amp; Maya Direct Transfer
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

        {/* E-Wallet Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-secondary/70 border border-border/60">
          <button
            type="button"
            onClick={() => setWalletType("GCASH")}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              walletType === "GCASH"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>GCash</span>
          </button>
          <button
            type="button"
            onClick={() => setWalletType("MAYA")}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              walletType === "MAYA"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Maya</span>
          </button>
        </div>

        {/* QR Code Card Display */}
        <div className="rounded-3xl border-2 border-border bg-gradient-to-b from-surface-secondary/40 to-surface p-6 text-center space-y-4 shadow-inner">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold">
              Transfer to Recipient
            </span>
            <div className="text-lg font-black text-foreground">
              {settlement.toUserName}
            </div>
            <div className="text-3xl font-black text-brand-ocean">
              {formatPHP(settlement.amount, false)}
            </div>
          </div>

          {/* Simulated QR Ph Vector */}
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-white p-3 shadow-md border-4 border-slate-900 relative">
            <svg
              className="h-full w-full text-slate-900"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Corner position markers */}
              <rect x="5" y="5" width="25" height="25" fill="black" />
              <rect x="9" y="9" width="17" height="17" fill="white" />
              <rect x="13" y="13" width="9" height="9" fill="black" />

              <rect x="70" y="5" width="25" height="25" fill="black" />
              <rect x="74" y="9" width="17" height="17" fill="white" />
              <rect x="78" y="13" width="9" height="9" fill="black" />

              <rect x="5" y="70" width="25" height="25" fill="black" />
              <rect x="9" y="74" width="17" height="17" fill="white" />
              <rect x="13" y="78" width="9" height="9" fill="black" />

              {/* Data pattern matrices */}
              <rect x="35" y="10" width="5" height="5" />
              <rect x="45" y="15" width="10" height="5" />
              <rect x="35" y="25" width="5" height="10" />
              <rect x="55" y="20" width="5" height="5" />

              <rect x="10" y="40" width="5" height="15" />
              <rect x="25" y="45" width="10" height="5" />
              <rect x="40" y="40" width="20" height="20" />
              <rect x="65" y="45" width="15" height="5" />
              <rect x="85" y="40" width="5" height="15" />

              <rect x="35" y="70" width="10" height="5" />
              <rect x="50" y="75" width="5" height="15" />
              <rect x="65" y="70" width="15" height="10" />
              <rect x="85" y="80" width="5" height="10" />
            </svg>

            {/* QR Ph Center Badge */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg bg-white p-1 shadow-sm border border-slate-200 text-[10px] font-black text-slate-900">
                QR Ph
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-nature-emerald" />
            <span>National QR Ph &amp; BSP Interoperable</span>
          </div>
        </div>

        {/* Copyable Mobile Number & Reference */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-surface-secondary/70 p-3 border border-border/60">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">
                {walletType} Mobile Number
              </div>
              <div className="font-mono font-bold text-foreground text-sm">
                {mobileNumber}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyText(mobileNumber, "phone")}
              className="gap-1.5 rounded-xl text-xs h-8"
            >
              {copiedField === "phone" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-nature-emerald" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-secondary/70 p-3 border border-border/60">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">
                Payment Reference Note
              </div>
              <div className="font-mono font-bold text-foreground">
                {settlement.paymentRefCode}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyText(settlement.paymentRefCode, "ref")}
              className="gap-1.5 rounded-xl text-xs h-8"
            >
              {copiedField === "ref" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-nature-emerald" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Confirmation Footer */}
        <div className="pt-2 flex flex-col gap-2">
          <Button
            type="button"
            variant="emerald"
            onClick={handleSettle}
            className="w-full gap-2 rounded-xl py-2.5 text-xs font-bold"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Mark as Paid &amp; Settled</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-xl text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
