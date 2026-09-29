"use client";

import React, { useState } from "react";
import { Bus, PlusCircle, Search, Clock, ArrowRight } from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import { TodaTariff, DEMO_TODA_TARIFFS, DEMO_BUS_ROUTES } from "../../lib/api";
import { TodaTariffCard } from "../../components/transit/toda-tariff-card";
import { CommutePlannerCard } from "../../components/transit/commute-planner-card";
import { SubmitTariffModal } from "../../components/transit/submit-tariff-modal";
import { DialectCheatSheet } from "../../components/transit/dialect-cheat-sheet";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

export default function TransitPage() {
  const [tariffs, setTariffs] = useState<TodaTariff[]>(DEMO_TODA_TARIFFS);
  const [activeTab, setActiveTab] = useState<
    "PLANNER" | "TODA" | "BUSES" | "DIALECT"
  >("PLANNER");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmitNewTariff = (newTariff: TodaTariff) => {
    setTariffs((prev) => [newTariff, ...prev]);
    setToastMessage(
      `🎉 Crowdsourced tariff for ${newTariff.municipality} submitted and published!`,
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAttachPlan = (planSummary: {
    destination: string;
    totalPerHead: number;
    totalGroup: number;
  }) => {
    setToastMessage(
      `✅ Commuter plan to ${planSummary.destination} (${formatPHP(planSummary.totalPerHead, false)}/pax) attached to trip!`,
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter tariffs
  const filteredTariffs = tariffs.filter((t) => {
    const matchesSearch =
      t.municipality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.originTerminal.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion =
      selectedRegion === "ALL" || t.region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  return (
    <main className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-400">
            <Bus className="h-3.5 w-3.5" />
            <span>Philippine Commuter Transit &amp; TODA Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Provincial Commuter &amp; TODA Wiki
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            First-mile / last-mile commuter routes, official municipal tricycle
            tariffs, last-trip curfews, and local dialect bargaining cheat
            sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="sunset"
            onClick={() => setIsSubmitModalOpen(true)}
            className="gap-2 rounded-xl"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit TODA Tariff</span>
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="rounded-2xl bg-nature-emerald/10 border border-nature-emerald/30 p-4 text-xs font-bold text-nature-emerald animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 overflow-x-auto">
        {[
          { id: "PLANNER", label: "🗺️ Multi-Leg Commute Planner" },
          {
            id: "TODA",
            label: `🛺 TODA Tariffs Directory (${tariffs.length})`,
          },
          {
            id: "BUSES",
            label: `🚌 Provincial Bus Schedules (${DEMO_BUS_ROUTES.length})`,
          },
          { id: "DIALECT", label: "🗣️ Dialect Bargaining Guide" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveTab(tab.id as "PLANNER" | "TODA" | "BUSES" | "DIALECT")
            }
            className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-brand-ocean text-white shadow-sm shadow-brand-ocean/20"
                : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Views */}
      {activeTab === "PLANNER" && (
        <CommutePlannerCard onAttachToTrip={handleAttachPlan} />
      )}

      {activeTab === "TODA" && (
        <div className="space-y-6">
          {/* Search & Region Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search municipality, beach, town..."
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: "ALL", label: "All Regions" },
                { id: "NORTH_LUZON", label: "North Luzon" },
                { id: "SOUTH_LUZON", label: "South Luzon" },
                { id: "VISAYAS", label: "Visayas" },
              ].map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setSelectedRegion(reg.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                    selectedRegion === reg.id
                      ? "bg-brand-ocean text-white font-bold"
                      : "bg-surface-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tariffs List */}
          {filteredTariffs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTariffs.map((t) => (
                <TodaTariffCard key={t.id} tariff={t} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-xl">
                🛺
              </div>
              <h4 className="text-sm font-bold text-foreground">
                No TODA tariffs found for this search
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Be the first to crowdsource the verified tricycle fare for this
                route.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsSubmitModalOpen(true)}
                className="rounded-xl"
              >
                Submit New Tariff
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "BUSES" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-1 shadow-sm">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bus className="h-4 w-4 text-brand-ocean" />
              <span>Provincial Bus Terminals &amp; Schedules</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Direct routes from Metro Manila major transit hubs (PITX, Cubao,
              Pasay, Buendia).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_BUS_ROUTES.map((bus) => (
              <div
                key={bus.id}
                className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm hover:border-brand-ocean/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold"
                      >
                        {bus.serviceType}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">
                        {bus.operator}
                      </span>
                    </div>
                    <div className="text-sm font-black text-foreground flex items-center gap-1.5 pt-1">
                      <span>{bus.originHub}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-accent-sunset" />
                      <span>{bus.destination}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">
                      Fare / Pax
                    </span>
                    <div className="text-lg font-black text-brand-ocean">
                      {formatPHP(bus.farePerHead, false)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-brand-ocean" />
                    <span>Duration: ~{bus.durationHours} hrs</span>
                  </div>
                  <div className="text-muted-foreground text-right">
                    First: {bus.firstTripTime} / Last: {bus.lastTripTime}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground bg-surface-secondary/70 p-2.5 rounded-xl border border-border/50">
                  📍 <strong>Terminal Address:</strong> {bus.terminalAddress}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "DIALECT" && <DialectCheatSheet />}

      {/* Submit Tariff Modal */}
      <SubmitTariffModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitNewTariff}
      />
    </main>
  );
}
