"use client";

import React, { useState } from "react";
import { X, PlusCircle, ShieldCheck } from "lucide-react";
import { TodaTariff } from "../../lib/api";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

export interface SubmitTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTariff: TodaTariff) => void;
}

export function SubmitTariffModal({
  isOpen,
  onClose,
  onSubmit,
}: SubmitTariffModalProps) {
  const [municipality, setMunicipality] = useState("");
  const [province, setProvince] = useState("");
  const [region, setRegion] = useState<TodaTariff["region"]>("NORTH_LUZON");
  const [originTerminal, setOriginTerminal] = useState("");
  const [destination, setDestination] = useState("");
  const [regularFare, setRegularFare] = useState("");
  const [specialFare, setSpecialFare] = useState("");
  const [nightFare, setNightFare] = useState("");
  const [curfew, setCurfew] = useState("09:30 PM");
  const [dialectName, setDialectName] = useState("Ilocano");
  const [dialectPhrase, setDialectPhrase] = useState("");
  const [dialectMeaning, setDialectMeaning] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!municipality.trim() || !destination.trim() || !specialFare) return;

    const tariff: TodaTariff = {
      id: `toda-user-${Date.now()}`,
      municipality: municipality.trim(),
      province: province.trim() || "Philippines",
      region,
      originTerminal: originTerminal.trim() || `${municipality} Town Terminal`,
      destination: destination.trim(),
      regularFarePerHead: parseFloat(regularFare) || 15.0,
      specialTripFare: parseFloat(specialFare) || 50.0,
      nightDiffFare: nightFare ? parseFloat(nightFare) : undefined,
      nightDiffStartTime: "08:30 PM",
      lastTripCurfew: curfew.trim() || "10:00 PM",
      estimatedMins: 15,
      dialectCode: "TAG",
      dialectName: dialectName.trim() || "Tagalog",
      dialectPhrases: dialectPhrase.trim()
        ? [
            {
              phrase: dialectPhrase.trim(),
              meaning: dialectMeaning.trim() || "Local travel phrase",
              phonetic: dialectPhrase.trim(),
              context: "Community submitted negotiation phrase",
            },
          ]
        : [],
      upvotes: 1,
      verifiedByLGU: false,
      notes: notes.trim() || "Community verified fare submission.",
    };

    onSubmit(tariff);
    toast({
      title: "TODA Tariff Submitted",
      description: `₱${tariff.specialTripFare} special fare for ${tariff.municipality} → ${tariff.destination} submitted to community wiki.`,
      variant: "success",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-sunset/10 text-accent-sunset">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Crowdsource Official TODA Tariff
              </h3>
              <p className="text-xs text-muted-foreground">
                Help Philippine commuters avoid tourist price gouging by sharing
                verified rates.
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Municipality / Town
              </label>
              <input
                type="text"
                required
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                placeholder="e.g. San Juan"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Province
              </label>
              <input
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="e.g. La Union"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Island Region
              </label>
              <select
                value={region}
                onChange={(e) =>
                  setRegion(e.target.value as TodaTariff["region"])
                }
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-2 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none"
              >
                <option value="NORTH_LUZON">North Luzon</option>
                <option value="SOUTH_LUZON">South Luzon</option>
                <option value="VISAYAS">Visayas</option>
                <option value="MINDANAO">Mindanao</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Origin TODA Terminal
              </label>
              <input
                type="text"
                required
                value={originTerminal}
                onChange={(e) => setOriginTerminal(e.target.value)}
                placeholder="e.g. San Juan Town Plaza"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Destination Beach / Resort
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Urbiztondo Point / Panagsama"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Regular Fare (₱/Head)
              </label>
              <input
                type="number"
                step="any"
                required
                value={regularFare}
                onChange={(e) => setRegularFare(e.target.value)}
                placeholder="15"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Special Trip (₱/Trike)
              </label>
              <input
                type="number"
                step="any"
                required
                value={specialFare}
                onChange={(e) => setSpecialFare(e.target.value)}
                placeholder="50"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-brand-ocean focus:border-brand-ocean focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Night Diff (₱/Trike)
              </label>
              <input
                type="number"
                step="any"
                value={nightFare}
                onChange={(e) => setNightFare(e.target.value)}
                placeholder="70"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-amber-600 focus:border-brand-ocean focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Last Trip Curfew Time
              </label>
              <input
                type="text"
                value={curfew}
                onChange={(e) => setCurfew(e.target.value)}
                placeholder="e.g. 09:30 PM"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Regional Dialect Name
              </label>
              <input
                type="text"
                value={dialectName}
                onChange={(e) => setDialectName(e.target.value)}
                placeholder="e.g. Ilocano / Batangueño / Cebuano"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>
          </div>

          {/* Dialect Bargaining Phrase */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <span>🗣️ Local Bargaining Phrase (Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={dialectPhrase}
                onChange={(e) => setDialectPhrase(e.target.value)}
                placeholder="Local phrase (e.g. Mano ti plete?)"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none"
              />
              <input
                type="text"
                value={dialectMeaning}
                onChange={(e) => setDialectMeaning(e.target.value)}
                placeholder="English meaning (e.g. How much fare?)"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:border-brand-ocean focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-muted-foreground">
              Notes &amp; Luggage Capacity Advice
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Accommodates 3 pax with surfboards on top rack."
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:border-brand-ocean focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-nature-emerald/5 border border-nature-emerald/30 p-3 text-[11px] text-nature-emerald flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              All submissions are verified by the GalaPH community and local
              tourism coordinators.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" variant="sunset" className="rounded-xl px-6">
              Submit Tariff
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
