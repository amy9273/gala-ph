"use client";

import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "../ui/button";

export interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelMode: string;
    inviteCode?: string;
  }) => void;
}

export function CreateTripModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTripModalProps) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("San Juan, La Union");
  const [startDate, setStartDate] = useState("2026-10-30");
  const [endDate, setEndDate] = useState("2026-11-01");
  const [travelMode, setTravelMode] = useState("HYBRID");
  const [customInviteCode, setCustomInviteCode] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) return;

    onSubmit({
      title: title.trim(),
      destination: destination.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      travelMode,
      inviteCode: customInviteCode.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-ocean/10 text-brand-ocean">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Plan a Barkada Trip
              </h3>
              <p className="text-xs text-muted-foreground">
                Set destination, travel mode, and road trip dates.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold uppercase tracking-wider text-muted-foreground">
              Trip Title / Barkada Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Elyu Surf & Chill Weekend"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
            />
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-muted-foreground">
              Destination
            </label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. San Juan, La Union / Baguio / Baler"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
              />
            </div>
            <div>
              <label className="font-bold uppercase tracking-wider text-muted-foreground">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
              />
            </div>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-muted-foreground">
              Primary Travel Mode
            </label>
            <select
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
            >
              <option value="HYBRID">
                Hybrid (Convoy Cars + Commuter Buses)
              </option>
              <option value="PRIVATE_CAR">Private Car / SUV Convoy Only</option>
              <option value="COMMUTE_BUS">Provincial Bus Commuter</option>
              <option value="COMMUTE_VAN">UV Express / Commuter Van</option>
              <option value="MOTORCYCLE">Motorcycle Ride</option>
            </select>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-muted-foreground">
              Custom Barkada Invite Code (Optional)
            </label>
            <input
              type="text"
              value={customInviteCode}
              onChange={(e) =>
                setCustomInviteCode(e.target.value.toUpperCase())
              }
              placeholder="e.g. ELYU-2026"
              maxLength={10}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground placeholder:text-muted-foreground placeholder:normal-case focus:border-brand-ocean focus:outline-none focus:ring-2 focus:ring-brand-ocean/20"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" className="rounded-xl px-6">
              Create Trip
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
