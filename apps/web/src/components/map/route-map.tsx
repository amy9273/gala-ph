"use client";

import React, { useState } from "react";
import { MapPin, Navigation, CreditCard } from "lucide-react";
import { Badge } from "../ui/badge";
import { formatPHP } from "@gala-ph/shared";

export interface Waypoint {
  id: string;
  name: string;
  expressway: string;
  provider: "AUTOSWEEP" | "EASYTRIP" | "DESTINATION" | "ORIGIN";
  fee?: number;
  km: number;
  lat: number;
  lng: number;
  notes?: string;
}

const ELYU_ROUTE_WAYPOINTS: Waypoint[] = [
  {
    id: "wp-1",
    name: "Balintawak Toll Plaza (NLEX)",
    expressway: "NLEX",
    provider: "ORIGIN",
    km: 0,
    lat: 14.6575,
    lng: 120.9986,
    notes: "NLEX Barrier Entry. Easytrip RFID scan.",
  },
  {
    id: "wp-2",
    name: "Mabalacat SCTEX Interchange",
    expressway: "NLEX $\\to$ SCTEX",
    provider: "EASYTRIP",
    fee: 331.0,
    km: 84,
    lat: 15.2215,
    lng: 120.5786,
    notes: "NLEX Exit & SCTEX Entry. 100% Easytrip.",
  },
  {
    id: "wp-3",
    name: "Tarlac Central Interchange",
    expressway: "SCTEX $\\to$ TPLEX",
    provider: "EASYTRIP",
    fee: 151.0,
    km: 125,
    lat: 15.4865,
    lng: 120.6125,
    notes: "Switch from Easytrip to Autosweep RFID at TPLEX Entry.",
  },
  {
    id: "wp-4",
    name: "Rosario Main Toll Plaza",
    expressway: "TPLEX",
    provider: "AUTOSWEEP",
    fee: 346.0,
    km: 214,
    lat: 16.2305,
    lng: 120.4855,
    notes: "TPLEX Exit Barrier. Autosweep RFID deducted.",
  },
  {
    id: "wp-5",
    name: "San Juan, La Union (Urbiztondo Beach)",
    expressway: "MacArthur Highway",
    provider: "DESTINATION",
    km: 245,
    lat: 16.6744,
    lng: 120.3341,
    notes: "Surf point break destination arrived.",
  },
];

export interface RouteMapProps {
  routeTitle?: string;
  destinationName?: string;
}

export function RouteMap({
  routeTitle = "Manila to San Juan, La Union Expressway Corridor",
  destinationName = "San Juan, La Union",
}: RouteMapProps) {
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint>(
    ELYU_ROUTE_WAYPOINTS[0]!,
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Navigation className="h-4 w-4 text-brand-ocean" />
            <span>{routeTitle}</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Destination: {destinationName} • 245 km total distance • 3
            Expressways (NLEX, SCTEX, TPLEX)
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="easytrip">Easytrip Corridor</Badge>
          <Badge variant="autosweep">Autosweep Corridor</Badge>
        </div>
      </div>

      {/* Interactive Vector Route Diagram */}
      <div className="relative rounded-2xl bg-surface-secondary/60 p-6 overflow-hidden border border-border/60">
        {/* Highway Trace Vector */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 z-10">
          {ELYU_ROUTE_WAYPOINTS.map((wp, idx) => {
            const isSelected = selectedWaypoint.id === wp.id;
            const isAutosweep = wp.provider === "AUTOSWEEP";
            const isEasytrip = wp.provider === "EASYTRIP";
            const isDest = wp.provider === "DESTINATION";

            return (
              <button
                key={wp.id}
                type="button"
                onClick={() => setSelectedWaypoint(wp)}
                className={`flex-1 flex flex-col items-center text-center p-3 rounded-xl transition-all duration-200 focus:outline-none ${
                  isSelected
                    ? "bg-surface shadow-md border-2 border-brand-ocean scale-105"
                    : "hover:bg-surface/60 border border-transparent"
                }`}
              >
                {/* Milestone Node */}
                <div
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-xs shadow-sm mb-2 ${
                    isDest
                      ? "bg-accent-sunset ring-4 ring-accent-sunset/20"
                      : isAutosweep
                        ? "bg-amber-600"
                        : isEasytrip
                          ? "bg-sky-600"
                          : "bg-slate-700"
                  }`}
                >
                  {isDest ? (
                    <MapPin className="h-4 w-4" />
                  ) : isAutosweep || isEasytrip ? (
                    <CreditCard className="h-4 w-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}

                  {/* Pulsing beacon on current location / lead car */}
                  {idx === 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 max-w-[140px]">
                  <span className="text-xs font-bold text-foreground line-clamp-1">
                    {wp.name}
                  </span>
                  <div className="text-[10px] text-muted-foreground">
                    Km {wp.km} • {wp.expressway}
                  </div>
                  {wp.fee && (
                    <span className="inline-block text-[11px] font-extrabold text-brand-ocean">
                      {formatPHP(wp.fee, false)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Highway Legend bar */}
        <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
              <span>NLEX / SCTEX (Easytrip)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
              <span>TPLEX (Autosweep)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-sunset" />
              <span>Beach Destination</span>
            </span>
          </div>

          <span className="font-semibold text-foreground">
            Approx Drive Time: 3h 45m
          </span>
        </div>
      </div>

      {/* Selected Waypoint Detail Card */}
      {selectedWaypoint && (
        <div className="rounded-xl border border-border bg-surface-secondary/40 p-3.5 flex items-start justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                {selectedWaypoint.name}
              </span>
              <Badge
                variant={
                  selectedWaypoint.provider === "AUTOSWEEP"
                    ? "autosweep"
                    : selectedWaypoint.provider === "EASYTRIP"
                      ? "easytrip"
                      : "default"
                }
              >
                {selectedWaypoint.provider}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {selectedWaypoint.notes ||
                "Official expressway toll plaza checkpoint."}
            </p>
          </div>

          {selectedWaypoint.fee && (
            <div className="text-right shrink-0">
              <span className="text-[11px] text-muted-foreground">
                Toll Fee
              </span>
              <div className="text-base font-black text-brand-ocean">
                {formatPHP(selectedWaypoint.fee, false)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
