"use client";

import React from "react";
import { CreditCard } from "lucide-react";
import { TollBreakdownCard } from "../../components/toll/toll-breakdown-card";
import { RouteMap } from "../../components/map/route-map";

export default function TollCalculatorPage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
          <CreditCard className="h-3.5 w-3.5" />
          <span>Philippine Dual-RFID Highway Calculator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Expressway Toll &amp; Fuel Estimator
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Isolate and calculate exact toll fees across{" "}
          <strong className="text-foreground">Autosweep</strong> (TPLEX, Skyway
          3, SLEX) and <strong className="text-foreground">Easytrip</strong>{" "}
          (NLEX, SCTEX, CALAX). Includes recommended top-up buffers and engine
          fuel consumption math.
        </p>
      </div>

      {/* Interactive Expressway Vector Map Corridor */}
      <RouteMap
        routeTitle="Active Expressway Corridor (NLEX, SCTEX, TPLEX)"
        destinationName="San Juan, La Union"
      />

      {/* Main Toll Calculator & Breakdown */}
      <TollBreakdownCard showRouteSelector={true} />
    </main>
  );
}
