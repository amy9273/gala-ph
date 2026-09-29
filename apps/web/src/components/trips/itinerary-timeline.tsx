import React, { useState } from "react";
import { Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { formatPHP } from "@gala-ph/shared";
import { ItineraryItem } from "../../lib/api";

export interface ItineraryTimelineProps {
  items: ItineraryItem[];
}

export function ItineraryTimeline({ items }: ItineraryTimelineProps) {
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>(
    {},
  );

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center text-xs text-muted-foreground">
        No itinerary items scheduled yet. Add stops to organize your road trip
        timeline.
      </div>
    );
  }

  // Group items by dayNumber
  const grouped = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    const day = item.dayNumber || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const toggleDay = (day: number) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dayStr, dayItems]) => {
        const dayNumber = parseInt(dayStr, 10);
        const isCollapsed = collapsedDays[dayNumber];

        const dayTotalCost = dayItems.reduce(
          (sum, it) => sum + (it.estimatedCost || 0),
          0,
        );

        return (
          <div
            key={dayNumber}
            className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden"
          >
            {/* Day Header Accordion */}
            <button
              type="button"
              onClick={() => toggleDay(dayNumber)}
              className="w-full flex items-center justify-between p-4 sm:p-5 bg-surface-secondary/50 hover:bg-surface-secondary transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-ocean/10 text-brand-ocean font-bold text-xs">
                  D{dayNumber}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Day {dayNumber} Schedule
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {dayItems.length} stops planned
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {dayTotalCost > 0 && (
                  <span className="text-xs font-bold text-nature-emerald bg-nature-emerald/10 px-2.5 py-1 rounded-full border border-nature-emerald/30">
                    Est. {formatPHP(dayTotalCost, false)}
                  </span>
                )}
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Itinerary Items Timeline */}
            {!isCollapsed && (
              <div className="p-4 sm:p-5 space-y-4">
                {dayItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="relative flex items-start gap-3.5 pl-2 pb-2 last:pb-0"
                  >
                    {/* Time Slot Badge */}
                    <div className="shrink-0 w-20 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground bg-surface-secondary px-2 py-0.5 rounded-md border border-border">
                        <Clock className="h-3 w-3 text-brand-ocean" />
                        {item.timeSlot}
                      </span>
                    </div>

                    {/* Content Bento Block */}
                    <div className="flex-1 rounded-xl border border-border/80 bg-surface-secondary/40 p-3.5 space-y-1.5 hover:border-brand-ocean/40 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-foreground">
                          {item.activity}
                        </h5>
                        {item.estimatedCost && (
                          <span className="text-xs font-extrabold text-foreground">
                            {formatPHP(item.estimatedCost, false)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-accent-sunset shrink-0" />
                        <span>{item.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
