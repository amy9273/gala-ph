import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Copy, Check, ArrowRight } from "lucide-react";
import { TripDetail } from "../../lib/api";
import { Badge } from "../ui/badge";

export interface TripCardProps {
  trip: TripDetail;
}

export function TripCard({ trip }: TripCardProps) {
  const [copied, setCopied] = React.useState(false);

  const copyInviteCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(trip.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startDate = new Date(trip.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endDate = new Date(trip.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:border-brand-ocean/50 hover:shadow-lg dark:bg-surface/70 space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[11px] font-semibold">
            {trip.travelMode}
          </Badge>

          {/* Barkada Code Chip */}
          <button
            type="button"
            onClick={copyInviteCode}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent-sunset/30 bg-accent-sunset/10 px-2.5 py-0.5 text-xs font-bold text-accent-sunset hover:bg-accent-sunset/20 transition-colors"
          >
            <span>{trip.inviteCode}</span>
            {copied ? (
              <Check className="h-3 w-3 text-nature-emerald" />
            ) : (
              <Copy className="h-3 w-3 opacity-70" />
            )}
          </button>
        </div>

        {/* Title & Destination */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-brand-ocean transition-colors">
            {trip.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <MapPin className="h-3.5 w-3.5 text-accent-sunset shrink-0" />
            <span>{trip.destination}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-brand-ocean shrink-0" />
          <span>
            {startDate} – {endDate}
          </span>
        </div>

        {/* Member Avatars & Progress Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {trip.members.slice(0, 3).map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-brand-ocean to-accent-sunset text-[10px] font-bold text-white border-2 border-surface"
                  title={m.user.name}
                >
                  {m.user.name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {trip.members.length} barkada
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-brand-ocean group-hover:translate-x-0.5 transition-transform">
            <span>View Itinerary</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
