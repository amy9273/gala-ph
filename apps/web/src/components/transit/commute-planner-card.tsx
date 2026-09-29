"use client";

import React, { useState } from "react";
import {
  Navigation,
  Bus,
  Clock,
  ShieldAlert,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import {
  DEMO_BUS_ROUTES,
  DEMO_TODA_TARIFFS,
  DEMO_ENVIRONMENTAL_FEES,
} from "../../lib/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export interface CommutePlannerCardProps {
  onAttachToTrip?: (planSummary: {
    destination: string;
    totalPerHead: number;
    totalGroup: number;
  }) => void;
}

const DESTINATION_OPTIONS = [
  {
    id: "elyu",
    name: "San Juan, La Union (Urbiztondo Beach)",
    busRouteId: "bus-01",
    todaId: "toda-elyu-01",
    feeId: "fee-elyu-01",
  },
  {
    id: "baguio",
    name: "Baguio City (Gov. Pack / Session Rd)",
    busRouteId: "bus-02",
    todaId: "toda-elyu-01", // baguio trike
  },
  {
    id: "nasugbu",
    name: "Nasugbu / Fortune Island, Batangas",
    busRouteId: "bus-03",
    todaId: "toda-btg-01",
    feeId: "fee-btg-01",
  },
  {
    id: "baler",
    name: "Baler, Aurora (Sabang Beach)",
    busRouteId: "bus-04",
    todaId: "toda-aur-01",
  },
  {
    id: "moalboal",
    name: "Moalboal, Cebu (Panagsama Beach)",
    busRouteId: "bus-05",
    todaId: "toda-ceb-01",
    feeId: "fee-ceb-01",
  },
];

export function CommutePlannerCard({
  onAttachToTrip,
}: CommutePlannerCardProps) {
  const [selectedDestId, setSelectedDestId] = useState("elyu");
  const [paxCount, setPaxCount] = useState(4);
  const [isNightTrip, setIsNightTrip] = useState(false);
  const [attached, setAttached] = useState(false);

  const destOption =
    DESTINATION_OPTIONS.find((d) => d.id === selectedDestId) ||
    DESTINATION_OPTIONS[0]!;

  const busRoute =
    DEMO_BUS_ROUTES.find((b) => b.id === destOption.busRouteId) ||
    DEMO_BUS_ROUTES[0]!;

  const todaTariff =
    DEMO_TODA_TARIFFS.find((t) => t.id === destOption.todaId) ||
    DEMO_TODA_TARIFFS[0]!;

  const envFee = destOption.feeId
    ? DEMO_ENVIRONMENTAL_FEES.find((f) => f.id === destOption.feeId)
    : null;

  // Commute Math
  const busTotal = busRoute.farePerHead * paxCount;

  // TODA math: 3 pax max per regular tricycle
  const trikesNeeded = Math.ceil(paxCount / 3);
  const todaRatePerTrike =
    isNightTrip && todaTariff.nightDiffFare
      ? todaTariff.nightDiffFare
      : todaTariff.specialTripFare;
  const todaTotal = todaRatePerTrike * trikesNeeded;

  const envTotal = (envFee ? envFee.amountPerHead : 0) * paxCount;

  const grandTotalGroup = busTotal + todaTotal + envTotal;
  const totalPerHead = grandTotalGroup / paxCount;

  const handleAttach = () => {
    setAttached(true);
    if (onAttachToTrip) {
      onAttachToTrip({
        destination: destOption.name,
        totalPerHead,
        totalGroup: grandTotalGroup,
      });
    }
    setTimeout(() => setAttached(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Selector Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bus className="h-5 w-5 text-brand-ocean" />
              <span>Multi-Modal Commuter Route Planner</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Calculate combined aircon bus fares, provincial TODA tricycles,
              and municipal tourism fees.
            </p>
          </div>
          <Badge variant="commute">First-Mile to Last-Mile</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Philippine Destination
            </label>
            <select
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
            >
              {DESTINATION_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Commuter Barkada (Pax)
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaxCount((p) => Math.max(1, p - 1))}
                className="h-10 w-10 rounded-xl border border-border bg-surface-secondary text-foreground font-bold hover:bg-surface"
              >
                -
              </button>
              <div className="flex-1 text-center font-bold text-base text-foreground bg-surface py-2 rounded-xl border border-border">
                {paxCount} {paxCount === 1 ? "Person" : "Persons"}
              </div>
              <button
                type="button"
                onClick={() => setPaxCount((p) => Math.min(10, p + 1))}
                className="h-10 w-10 rounded-xl border border-border bg-surface-secondary text-foreground font-bold hover:bg-surface"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Night Trip Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>
              Arriving late at night? (Applies TODA night differential
              surcharge)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsNightTrip(!isNightTrip)}
            className={`px-3 py-1 rounded-full font-bold text-xs border transition-all ${
              isNightTrip
                ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "border-border bg-surface-secondary text-muted-foreground"
            }`}
          >
            {isNightTrip ? "🌙 Night Trip Active" : "☀️ Daytime Rate"}
          </button>
        </div>
      </Card>

      {/* Step-by-Step Multi-Modal Itinerary */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Step-by-Step Commuter Leg Breakdown:
        </h4>

        {/* Leg 1: Provincial Bus */}
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-ocean/10 text-brand-ocean font-bold text-sm">
              Leg 1
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold">
                  {busRoute.serviceType} BUS
                </Badge>
                <span className="text-xs font-bold text-foreground">
                  {busRoute.operator}
                </span>
              </div>
              <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                <span>{busRoute.originHub}</span>
                <ArrowRight className="h-3 w-3 text-accent-sunset" />
                <span>{busRoute.destination}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Est. Duration: {busRoute.durationHours} hrs • First:{" "}
                {busRoute.firstTripTime} / Last: {busRoute.lastTripTime}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">
              {formatPHP(busRoute.farePerHead, false)} x {paxCount} pax
            </div>
            <div className="text-base font-black text-foreground">
              {formatPHP(busTotal, false)}
            </div>
          </div>
        </div>

        {/* Leg 2: Local TODA Tricycle */}
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-sunset/10 text-accent-sunset font-bold text-sm">
              Leg 2
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge variant="sunset" className="text-[10px] font-bold">
                  LOCAL TODA TRICYCLE
                </Badge>
                <span className="text-xs font-bold text-foreground">
                  {todaTariff.municipality} TODA Terminal
                </span>
              </div>
              <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                <span>{todaTariff.originTerminal}</span>
                <ArrowRight className="h-3 w-3 text-accent-sunset" />
                <span>{todaTariff.destination}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {trikesNeeded} {trikesNeeded === 1 ? "Tricycle" : "Tricycles"}{" "}
                needed (max 3 pax/trike) • Est. {todaTariff.estimatedMins} mins
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">
              {formatPHP(todaRatePerTrike, false)} / trike
            </div>
            <div className="text-base font-black text-foreground">
              {formatPHP(todaTotal, false)}
            </div>
          </div>
        </div>

        {/* Leg 3: Environmental Fee */}
        {envFee && (
          <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nature-emerald/10 text-nature-emerald font-bold text-sm">
                Leg 3
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="commute" className="text-[10px] font-bold">
                    LGU TOURISM FEE
                  </Badge>
                  <span className="text-xs font-bold text-foreground">
                    {envFee.feeName}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Checkpoint: {envFee.checkpointLocation}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">
                {formatPHP(envFee.amountPerHead, false)} x {paxCount} pax
              </div>
              <div className="text-base font-black text-foreground">
                {formatPHP(envTotal, false)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Curfew Advisory Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs flex items-start gap-3 text-amber-900 dark:text-amber-200">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Last-Trip Curfew Notice: </span>
          <span>
            {todaTariff.municipality} TODA regular services end at{" "}
            <strong>{todaTariff.lastTripCurfew}</strong>. Ensure your provincial
            bus arrives before curfew to avoid overnight terminal stranding.
          </span>
        </div>
      </div>

      {/* Grand Total Summary Bento */}
      <Card className="bg-gradient-to-br from-surface to-surface-secondary/70">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Per Head Commute
            </span>
            <div className="text-3xl font-black text-brand-ocean">
              {formatPHP(totalPerHead, false)}
            </div>
            <p className="text-xs text-muted-foreground">
              All buses + tricycles + fees included
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Barkada Cost ({paxCount} Pax)
            </span>
            <div className="text-3xl font-black text-foreground">
              {formatPHP(grandTotalGroup, false)}
            </div>
            <p className="text-xs text-muted-foreground">
              Bus ({formatPHP(busTotal, false)}) + Trikes (
              {formatPHP(todaTotal, false)})
            </p>
          </div>

          <div className="rounded-2xl border border-nature-emerald/30 bg-nature-emerald/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-nature-emerald">
              <span>COMMUTER SAVINGS</span>
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="text-sm font-bold text-foreground mt-1">
              ~60% cheaper than private expressway tolls + fuel for solo/duo
              commuters.
            </div>
          </div>
        </div>

        {onAttachToTrip && (
          <div className="mt-6 pt-4 border-t border-border flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={handleAttach}
              className="gap-2 rounded-xl"
            >
              {attached ? (
                <>
                  <Check className="h-4 w-4 text-nature-emerald" />
                  <span>Commute Plan Attached!</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span>Attach Commute to Trip</span>
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
