import React from "react";
import {
  AlertTriangle,
  CloudRain,
  Wind,
  ShieldCheck,
  Info,
} from "lucide-react";
import { WeatherAlert } from "../../lib/api";

export interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
  destination?: string;
}

export function WeatherAlertBanner({
  alerts,
  destination,
}: WeatherAlertBannerProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-nature-emerald/30 bg-nature-emerald/5 p-4 text-xs text-nature-emerald">
        <ShieldCheck className="h-4 w-4 shrink-0 text-nature-emerald" />
        <div className="flex-1">
          <span className="font-bold">DOST-PAGASA Travel Advisory: </span>
          <span className="text-foreground/90">
            No active Tropical Cyclone Wind Signals or Gale Warnings for{" "}
            {destination || "this route"}. Weather conditions clear for road
            trips.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "CRITICAL";
        const isModerate = alert.severity === "MODERATE";

        const borderClass = isCritical
          ? "border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-200"
          : isModerate
            ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200"
            : "border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-200";

        const Icon = isCritical ? Wind : isModerate ? AlertTriangle : CloudRain;

        return (
          <div
            key={alert.id}
            className={`rounded-2xl border p-4 transition-all shadow-sm ${borderClass}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  isCritical
                    ? "bg-rose-500 text-white"
                    : isModerate
                      ? "bg-amber-500 text-white"
                      : "bg-sky-500 text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold tracking-tight text-foreground">
                    {alert.headline}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-current">
                      {alert.source}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface text-foreground shadow-xs">
                      {alert.severity} SEVERITY
                    </span>
                  </div>
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed">
                  {alert.advisory}
                </p>

                {destination && (
                  <div className="pt-2 text-[11px] font-medium text-foreground/70 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    <span>
                      Route Hazard Monitor active for destination:{" "}
                      <span className="font-bold text-foreground">
                        {destination}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
