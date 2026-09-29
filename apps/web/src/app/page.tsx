"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Bus,
  Receipt,
  Radio,
  Sparkles,
  ShieldCheck,
  Car,
  Fuel,
  QrCode,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function HomePage() {
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  return (
    <main className="min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Background Glow Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-ocean/15 dark:bg-brand-ocean/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-accent-sunset/15 dark:bg-accent-sunset/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            {/* Top Pill Chip */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur-md shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-nature-emerald animate-pulse" />
              <span>Tailored for Philippine Road Trips &amp; Commutes</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-brand-ocean font-semibold">v1.0 Ready</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              The Operating System for{" "}
              <span className="bg-gradient-to-r from-brand-ocean via-sky-500 to-accent-sunset bg-clip-text text-transparent">
                Philippine Barkada Travel
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              No more{" "}
              <span className="font-semibold text-foreground">
                &quot;drawing&quot;
              </span>{" "}
              or awkward inuman singilan. Calculate dual-RFID expressway toll
              loads (Autosweep vs. Easytrip), plan provincial bus &amp; TODA
              routes, and split bills item by item with zero floating-point
              errors.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
              <Link href="/trips" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="default"
                  className="w-full sm:w-auto gap-2 text-base px-6"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Plan a Barkada Trip</span>
                </Button>
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) =>
                      setInviteCodeInput(e.target.value.toUpperCase())
                    }
                    placeholder="ENTER CODE"
                    maxLength={10}
                    className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm font-bold uppercase tracking-wider text-foreground placeholder:text-muted-foreground placeholder:normal-case focus:border-accent-sunset focus:outline-none focus:ring-2 focus:ring-accent-sunset/20"
                  />
                </div>
                <Link href={`/trips?code=${inviteCodeInput}`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl text-accent-sunset border-accent-sunset/30 hover:bg-accent-sunset/10"
                  >
                    <span>Join</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 text-xs text-muted-foreground border-t border-border/60 w-full max-w-4xl">
              <div className="flex items-center justify-center gap-1.5 font-medium">
                <CreditCard className="h-4 w-4 text-amber-500" />
                <span>Autosweep &amp; Easytrip</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 font-medium">
                <Receipt className="h-4 w-4 text-nature-emerald" />
                <span>Non-Drinker KKB Math</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 font-medium">
                <Radio className="h-4 w-4 text-blue-500" />
                <span>Live GPS Convoy Radar</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-brand-ocean" />
                <span>DOST-PAGASA Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Bento Grid OS Showcase */}
      <section className="py-12 bg-surface-secondary/40 border-y border-border/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built for Philippine Travel Dynamics
            </h2>
            <p className="text-sm text-muted-foreground">
              Six synchronized engines purpose-built to eliminate group friction
              on the road.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {/* Bento 1: Dual-RFID Toll Optimizer (Span 4) */}
            <div className="md:col-span-3 lg:col-span-4 rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Dual-RFID Toll Calculator
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Route: Balintawak $\to$ San Juan, La Union (Class 1)
                    </p>
                  </div>
                </div>
                <Badge variant="autosweep">Autosweep + Easytrip</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {/* Autosweep Card */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-400">
                    <span>AUTOSWEEP RFID</span>
                    <span>TPLEX Segment</span>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    ₱346.00
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended Top-up:{" "}
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      ₱350.00
                    </span>{" "}
                    (nearest ₱50 buffer)
                  </p>
                </div>

                {/* Easytrip Card */}
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-sky-800 dark:text-sky-400">
                    <span>EASYTRIP RFID</span>
                    <span>NLEX + SCTEX</span>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    ₱482.00
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended Top-up:{" "}
                    <span className="font-bold text-sky-700 dark:text-sky-400">
                      ₱500.00
                    </span>{" "}
                    (nearest ₱50 buffer)
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Fuel className="h-3.5 w-3.5 text-nature-emerald" />
                  Estimated Fuel (1.5L Sedan @ ₱62/L): ₱1,178.00
                </span>
                <span className="font-bold text-foreground">
                  Total Road Cost: ₱2,006.00
                </span>
              </div>
            </div>

            {/* Bento 2: Live Convoy Radar (Span 2) */}
            <div className="md:col-span-3 lg:col-span-2 rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <Radio className="h-4 w-4" />
                  </div>
                  <Badge variant="convoy">CONVOY LIVE</Badge>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Convoy &amp; Straggler Radar
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Multi-car GPS telemetry with 5km straggler advisory threshold.
                </p>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-surface-secondary/80 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Car className="h-3.5 w-3.5 text-brand-ocean" />
                      <span className="font-semibold text-foreground">
                        Car 1 (Lead Juan)
                      </span>
                    </div>
                    <span className="font-bold text-nature-emerald">
                      82 km/h
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface-secondary/80 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Car className="h-3.5 w-3.5 text-accent-sunset" />
                      <span className="font-semibold text-foreground">
                        Car 2 (Maria)
                      </span>
                    </div>
                    <span className="font-bold text-blue-500">76 km/h</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Convoy Gap:</span>
                <span className="font-bold text-nature-emerald">
                  1.8 km (In Range)
                </span>
              </div>
            </div>

            {/* Bento 3: Itemized KKB Ledger with Non-Drinker Protection (Span 3) */}
            <div className="md:col-span-3 lg:col-span-3 rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nature-emerald/10 text-nature-emerald">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Itemized KKB Consumption
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Dampa Seafood &amp; Inuman Dinner
                    </p>
                  </div>
                </div>
                <Badge variant="settled">Fair Split</Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary/60">
                  <span className="font-medium text-foreground">
                    Inihaw na Liempo (4 Eaters)
                  </span>
                  <span className="font-bold">₱800.00</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary/60">
                  <span className="font-medium text-foreground">
                    Garlic Butter Shrimp (3 Eaters - Bea Allergic)
                  </span>
                  <span className="font-bold">₱700.00</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">
                      San Mig Pilsen Bucket (3 Drinkers)
                    </span>
                    <Badge variant="sunset" className="text-[10px] py-0 px-1.5">
                      ALCOHOL
                    </Badge>
                  </div>
                  <span className="font-bold">₱500.00</span>
                </div>
              </div>

              {/* Non-Drinker Protection Comparison Card */}
              <div className="mt-4 rounded-xl border border-nature-emerald/30 bg-nature-emerald/5 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-nature-emerald">
                  <span>Bea&apos;s Protected Share (Non-Drinker):</span>
                  <span className="text-sm">₱220.00</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Saved{" "}
                  <span className="font-bold text-foreground">₱330.00</span> vs.
                  naive equal split (₱550.00). Only pays for Liempo +
                  proportional 10% Service Charge.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <QrCode className="h-3.5 w-3.5 text-brand-ocean" />
                  <span>1-Tap GCash / Maya QR Settlement</span>
                </div>
                <Badge variant="outline">0 Floating Drift</Badge>
              </div>
            </div>

            {/* Bento 4: Commuter Transit & TODA Tariff Directory (Span 3) */}
            <div className="md:col-span-3 lg:col-span-3 rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Bus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Transit &amp; TODA Tariff Directory
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Metro Hubs $\to$ Provincial Buses $\to$ Tricycles
                    </p>
                  </div>
                </div>
                <Badge variant="commute">Verified Tariff</Badge>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-surface-secondary/40">
                  <div>
                    <div className="font-semibold text-foreground">
                      PITX $\to$ San Juan, La Union
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      JoyBus Executive Coach • 5.0 hrs
                    </div>
                  </div>
                  <span className="font-bold text-foreground">
                    ₱750.00/head
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-surface-secondary/40">
                  <div>
                    <div className="font-semibold text-foreground">
                      San Juan TODA (Urbiztondo $\to$ Tangadan Falls)
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      Special Chartered Rate • Curfew: 9:00 PM
                    </div>
                  </div>
                  <span className="font-bold text-accent-sunset">
                    ₱250.00/group
                  </span>
                </div>
              </div>

              {/* Local Dialect Tip */}
              <div className="mt-3.5 rounded-xl bg-surface-secondary/80 p-3 text-xs space-y-1">
                <span className="font-bold text-brand-ocean">
                  💡 Local Ilocano Dialect Tip:
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Say:{" "}
                  <span className="font-mono text-foreground font-semibold">
                    &quot;Mano po ti plete idiay San Juan Beach?&quot;
                  </span>{" "}
                  to avoid tourist markup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Call-To-Action Banner */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-ocean via-sky-600 to-accent-sunset p-8 sm:p-12 text-white shadow-xl">
            <div className="max-w-xl space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Ready to plan your next barkada getaway?
              </h2>
              <p className="text-sky-100 text-sm sm:text-base leading-relaxed">
                Invite your friends with a 6-character barkada code. Everything
                from expressway tolls to dinner splits is synchronized in
                real-time.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link href="/trips" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-slate-900 hover:bg-white/90 font-bold"
                  >
                    Create a Trip Now
                  </Button>
                </Link>
                <Link href="/toll-calculator" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full sm:w-auto text-white border border-white/30 hover:bg-white/10"
                  >
                    Try Toll Calculator
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
