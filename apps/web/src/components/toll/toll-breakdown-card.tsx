"use client";

import React, { useState } from "react";
import { CreditCard, Fuel, Sparkles, ArrowRight, Zap } from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import {
  TollBreakdown,
  FUEL_ECONOMY_PRESETS,
  calculateLocalTollBreakdown,
  PRESET_ROUTES,
} from "../../lib/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export interface TollBreakdownCardProps {
  initialRouteId?: string;
  initialClassType?: number;
  onSaveToTrip?: (breakdown: TollBreakdown) => void;
  showRouteSelector?: boolean;
}

export function TollBreakdownCard({
  initialRouteId = "MANILA_TO_LA_UNION",
  initialClassType = 1,
  onSaveToTrip,
  showRouteSelector = true,
}: TollBreakdownCardProps) {
  const [selectedRouteId, setSelectedRouteId] = useState(initialRouteId);
  const [classType, setClassType] = useState(initialClassType);
  const [engineType, setEngineType] =
    useState<keyof typeof FUEL_ECONOMY_PRESETS>("SEDAN_1_5L");
  const [fuelPrice] = useState(62.0);

  const breakdown = calculateLocalTollBreakdown(
    selectedRouteId,
    classType,
    engineType,
    fuelPrice,
  );

  return (
    <div className="space-y-6">
      {/* Route & Vehicle Class Controls */}
      {showRouteSelector && (
        <Card>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Philippine Road Trip Route
              </label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
              >
                {PRESET_ROUTES.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.distanceKm} km)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Vehicle Class Toggle */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicle Class
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    { type: 1, label: "Class 1", desc: "Sedan/SUV" },
                    { type: 2, label: "Class 2", desc: "Van/Bus" },
                    { type: 3, label: "Class 3", desc: "Heavy" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setClassType(item.type)}
                      className={`flex flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold border transition-all ${
                        classType === item.type
                          ? "border-brand-ocean bg-brand-ocean/10 text-brand-ocean shadow-sm"
                          : "border-border bg-surface-secondary text-muted-foreground hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] font-normal opacity-80">
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fuel Economy Presets */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicle Engine Type (Fuel Estimator)
                </label>
                <select
                  value={engineType}
                  onChange={(e) =>
                    setEngineType(
                      e.target.value as keyof typeof FUEL_ECONOMY_PRESETS,
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
                >
                  {Object.entries(FUEL_ECONOMY_PRESETS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.name} ({val.kmPerLiter} km/L)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dual-RFID Breakdown Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Autosweep Card */}
        <div className="rounded-2xl border border-amber-500/30 bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Autosweep RFID
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  TPLEX, Skyway 3, SLEX, STAR
                </p>
              </div>
            </div>
            <Badge variant="autosweep">Autosweep</Badge>
          </div>

          {/* Plaza Segments Table */}
          {breakdown.autosweep.segments.length > 0 ? (
            <div className="space-y-2">
              {breakdown.autosweep.segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-surface-secondary/70 p-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">
                      {seg.expressway}
                    </span>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>{seg.entryPlaza}</span>
                      <ArrowRight className="h-3 w-3 inline" />
                      <span>{seg.exitPlaza}</span>
                    </div>
                  </div>
                  <span className="font-bold text-foreground text-sm">
                    {formatPHP(seg.amount, false)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No Autosweep segments required for this route.
            </div>
          )}

          {/* Autosweep Reload Recommendation */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Toll Subtotal</div>
              <div className="text-lg font-black text-foreground">
                {formatPHP(breakdown.autosweep.total, false)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                Recommended Reload
              </div>
              <div className="text-sm font-extrabold text-amber-700 dark:text-amber-400">
                {formatPHP(breakdown.autosweep.recommendedReload, false)}
              </div>
            </div>
          </div>
        </div>

        {/* Easytrip Card */}
        <div className="rounded-2xl border border-sky-500/30 bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Easytrip RFID
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  NLEX, SCTEX, CALAX, CAVITEX
                </p>
              </div>
            </div>
            <Badge variant="easytrip">Easytrip</Badge>
          </div>

          {/* Plaza Segments Table */}
          {breakdown.easytrip.segments.length > 0 ? (
            <div className="space-y-2">
              {breakdown.easytrip.segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-surface-secondary/70 p-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">
                      {seg.expressway}
                    </span>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>{seg.entryPlaza}</span>
                      <ArrowRight className="h-3 w-3 inline" />
                      <span>{seg.exitPlaza}</span>
                    </div>
                  </div>
                  <span className="font-bold text-foreground text-sm">
                    {formatPHP(seg.amount, false)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No Easytrip segments required for this route.
            </div>
          )}

          {/* Easytrip Reload Recommendation */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Toll Subtotal</div>
              <div className="text-lg font-black text-foreground">
                {formatPHP(breakdown.easytrip.total, false)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-sky-800 dark:text-sky-400 font-medium">
                Recommended Reload
              </div>
              <div className="text-sm font-extrabold text-sky-700 dark:text-sky-400">
                {formatPHP(breakdown.easytrip.recommendedReload, false)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fuel & Total Road Cost Summary Bento */}
      <Card className="bg-gradient-to-br from-surface to-surface-secondary/70">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Fuel className="h-4 w-4 text-nature-emerald" />
              <span>Fuel Cost Estimate</span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {formatPHP(breakdown.estimatedFuel.fuelCost, false)}
            </div>
            <p className="text-xs text-muted-foreground">
              {breakdown.estimatedFuel.distanceKm} km •{" "}
              {breakdown.estimatedFuel.litersNeeded} L @ ₱{fuelPrice}/L
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <CreditCard className="h-4 w-4 text-brand-ocean" />
              <span>Combined Highway Tolls</span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {formatPHP(breakdown.combinedTollTotal, false)}
            </div>
            <p className="text-xs text-muted-foreground">
              Autosweep ({formatPHP(breakdown.autosweep.total, false)}) +
              Easytrip ({formatPHP(breakdown.easytrip.total, false)})
            </p>
          </div>

          <div className="rounded-2xl border border-brand-ocean/30 bg-brand-ocean/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-brand-ocean">
              <span>ESTIMATED TOTAL ROAD TRIP</span>
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="text-3xl font-black text-foreground mt-1">
              {formatPHP(breakdown.totalEstimatedRoadCost, false)}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Tolls + Gas for 1 vehicle
            </div>
          </div>
        </div>

        {onSaveToTrip && (
          <div className="mt-6 pt-4 border-t border-border flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={() => onSaveToTrip(breakdown)}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              <span>Attach Tolls to Trip Expense</span>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
