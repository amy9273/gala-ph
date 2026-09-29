import React from "react";
import Link from "next/link";
import { Heart, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌴</span>
              <span className="text-xl font-black tracking-tight text-foreground font-sans">
                Gala<span className="text-brand-ocean">PH</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              The all-in-one travel operating system built specifically for the
              Philippine context. Solving dual-RFID toll calculations, commuter
              transit, transparent itemized KKB splits, and live convoy
              navigation.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-nature-emerald" />
                DOST-PAGASA Real-Time Sync
              </span>
              <span>•</span>
              <span>Autosweep &amp; Easytrip Ready</span>
            </div>
          </div>

          {/* Quick Modules */}
          <div>
            <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">
              Philippine Travel OS
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/toll-calculator"
                  className="hover:text-brand-ocean transition-colors"
                >
                  Dual-RFID Toll Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/transit"
                  className="hover:text-brand-ocean transition-colors"
                >
                  Commuter Bus &amp; TODA Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/ledger"
                  className="hover:text-brand-ocean transition-colors"
                >
                  Granular KKB Bill Splitter
                </Link>
              </li>
              <li>
                <Link
                  href="/convoy"
                  className="hover:text-brand-ocean transition-colors"
                >
                  Live Convoy &amp; Straggler Radar
                </Link>
              </li>
            </ul>
          </div>

          {/* Philippine Barkada Destinations */}
          <div>
            <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">
              Top Road Trips
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>San Juan, La Union (Elyu)</li>
              <li>Baguio &amp; Kennon Road</li>
              <li>Baler &amp; Aurora Surfing</li>
              <li>Batangas Wawa Port &amp; Laiya</li>
              <li>Zambales Anawangin &amp; Liwliwa</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            Built with{" "}
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> for
            the Filipino traveler &amp; barkada adventures.
          </p>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} GalaPH</span>
            <span>•</span>
            <span className="text-brand-ocean font-medium">
              Exact Centavo Math Engine
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
