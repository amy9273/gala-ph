"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Copy,
  Check,
  Receipt,
  Radio,
  Navigation,
  ArrowLeft,
} from "lucide-react";
import { DEMO_TRIP, TripDetail, TollBreakdown } from "../../../lib/api";
import { RouteMap } from "../../../components/map/route-map";
import { TollBreakdownCard } from "../../../components/toll/toll-breakdown-card";
import { WeatherAlertBanner } from "../../../components/weather/weather-alert-banner";
import { ItineraryTimeline } from "../../../components/trips/itinerary-timeline";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export default function TripDetailPage() {
  const [trip] = useState<TripDetail>(DEMO_TRIP);
  const [activeTab, setActiveTab] = useState<"route" | "itinerary" | "weather">(
    "route",
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const copyCode = () => {
    navigator.clipboard.writeText(trip.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAttachTolls = (breakdown: TollBreakdown) => {
    setToastMessage(
      `✅ Expressway toll load of ₱${breakdown.combinedTollTotal.toFixed(2)} attached to trip expenses!`,
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const startDate = new Date(trip.startDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const endDate = new Date(trip.endDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back Link */}
      <Link
        href="/trips"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-brand-ocean transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to all trips</span>
      </Link>

      {/* Hero Trip Header */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold">
                {trip.travelMode}
              </Badge>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent-sunset/30 bg-accent-sunset/10 px-3 py-1 text-xs font-bold text-accent-sunset hover:bg-accent-sunset/20 transition-colors"
              >
                <span>Barkada Code: {trip.inviteCode}</span>
                {copiedCode ? (
                  <Check className="h-3.5 w-3.5 text-nature-emerald" />
                ) : (
                  <Copy className="h-3.5 w-3.5 opacity-75" />
                )}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-accent-sunset" />
                <span className="text-foreground">{trip.destination}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-brand-ocean" />
                <span>
                  {startDate} – {endDate}
                </span>
              </span>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
            <Link href="/ledger">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 rounded-xl text-xs"
              >
                <Receipt className="h-4 w-4 text-nature-emerald" />
                <span>KKB Ledger</span>
              </Button>
            </Link>

            <Link href="/convoy">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 rounded-xl text-xs"
              >
                <Radio className="h-4 w-4 text-blue-500" />
                <span>Live Convoy</span>
              </Button>
            </Link>

            <Link href="/transit">
              <Button
                variant="outline"
                size="sm"
                className="w-full col-span-2 sm:col-span-1 gap-1.5 rounded-xl text-xs"
              >
                <Navigation className="h-4 w-4 text-amber-500" />
                <span>Transit Guide</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Barkada Members Bar */}
        <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
              Trip Barkada ({trip.members.length}):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {trip.members.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-foreground border border-border"
                >
                  <span className="h-2 w-2 rounded-full bg-brand-ocean" />
                  <span>{m.user.name}</span>
                  {m.isDriver && (
                    <span className="text-[10px] text-accent-sunset font-bold">
                      [Driver]
                    </span>
                  )}
                  {m.isNonDrinker && (
                    <span className="text-[10px] text-nature-emerald font-bold">
                      [Non-Drinker]
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="rounded-2xl bg-nature-emerald/10 border border-nature-emerald/30 p-4 text-xs font-bold text-nature-emerald animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* DOST-PAGASA Weather Alert Banner */}
      <WeatherAlertBanner
        alerts={trip.weatherAlerts}
        destination={trip.destination}
      />

      {/* Tabs Control */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 overflow-x-auto">
        {[
          { id: "route", label: "🗺️ Route & Expressway Tolls" },
          { id: "itinerary", label: "📅 Itinerary Schedule" },
          { id: "weather", label: "🌦️ PAGASA Weather Advisory" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveTab(tab.id as "route" | "itinerary" | "weather")
            }
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-brand-ocean text-white shadow-sm shadow-brand-ocean/20"
                : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Views */}
      {activeTab === "route" && (
        <div className="space-y-6">
          <RouteMap
            routeTitle={`Expressway Route to ${trip.destination}`}
            destinationName={trip.destination}
          />
          <TollBreakdownCard
            initialRouteId="MANILA_TO_LA_UNION"
            onSaveToTrip={handleAttachTolls}
          />
        </div>
      )}

      {activeTab === "itinerary" && (
        <ItineraryTimeline items={trip.itineraryItems} />
      )}

      {activeTab === "weather" && (
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-foreground">
            DOST-PAGASA Real-Time Tropical Cyclone &amp; Gale Advisory
          </h3>
          <p className="text-xs text-muted-foreground">
            Automatic hazard warnings for Philippine mountainous highways and
            maritime ferry routes.
          </p>
          <WeatherAlertBanner
            alerts={trip.weatherAlerts}
            destination={trip.destination}
          />
        </Card>
      )}
    </main>
  );
}
