"use client";

import { Receipt } from "lucide-react";
import { DEMO_TRIP } from "../../lib/api";
import { TripLedgerView } from "../../components/ledger/trip-ledger-view";

export default function LedgerPage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-nature-emerald/30 bg-nature-emerald/10 px-3 py-1 text-xs font-bold text-nature-emerald">
          <Receipt className="h-3.5 w-3.5" />
          <span>Kanya-Kanyang Bayad (KKB) Master Ledger</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Itemized Bill Splitter &amp; Debt Simplifier
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Itemize group restaurant dishes, protect non-drinkers from alcohol
          tabs, exempt carpool drivers from tolls, and collapse tangled debts
          into direct{" "}
          <strong className="text-foreground">GCash / Maya QR Ph</strong>{" "}
          transfers.
        </p>
      </div>

      {/* Main Trip Ledger View */}
      <TripLedgerView trip={DEMO_TRIP} />
    </main>
  );
}
