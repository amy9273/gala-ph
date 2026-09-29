"use client";

import React, { useState } from "react";
import { Compass, PlusCircle, KeyRound } from "lucide-react";
import { DEMO_TRIP, TripDetail } from "../../lib/api";
import { TripCard } from "../../components/trips/trip-card";
import { CreateTripModal } from "../../components/trips/create-trip-modal";
import { Button } from "../../components/ui/button";

export default function TripsPage() {
  const [trips, setTrips] = useState<TripDetail[]>([
    DEMO_TRIP,
    {
      id: "trip-baguio-02",
      title: "Baguio City Food Crawl & Camp John Hay 🌲",
      destination: "Baguio City, Benguet",
      startDate: "2026-11-27T00:00:00.000Z",
      endDate: "2026-11-29T23:59:59.000Z",
      travelMode: "PRIVATE_CAR",
      inviteCode: "BAGUIO-4K9P",
      members: [
        {
          id: "mb-1",
          userId: "u1",
          role: "TRIP_LEAD",
          isDriver: true,
          isNonDrinker: false,
          user: { id: "u1", name: "Juan Dela Cruz", email: "juan@gala-ph.dev" },
        },
        {
          id: "mb-2",
          userId: "u2",
          role: "MEMBER",
          isDriver: false,
          isNonDrinker: false,
          user: { id: "u2", name: "Maria Santos", email: "maria@gala-ph.dev" },
        },
      ],
      itineraryItems: [],
      weatherAlerts: [],
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  const handleCreateTrip = (data: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelMode: string;
    inviteCode?: string;
  }) => {
    const newTrip: TripDetail = {
      id: `trip-${Date.now()}`,
      title: data.title,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      travelMode: data.travelMode,
      inviteCode:
        data.inviteCode ||
        `GALA-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      members: [
        {
          id: `m-${Date.now()}`,
          userId: "u1",
          role: "TRIP_LEAD",
          isDriver: true,
          isNonDrinker: false,
          user: {
            id: "u1",
            name: "You (Organizer)",
            email: "organizer@gala-ph.dev",
          },
        },
      ],
      itineraryItems: [],
      weatherAlerts: [],
    };

    setTrips((prev) => [newTrip, ...prev]);
  };

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setJoinMessage(
      `🎉 Joined trip with code "${joinCodeInput.toUpperCase()}"!`,
    );
    setJoinCodeInput("");
    setTimeout(() => setJoinMessage(null), 3500);
  };

  return (
    <main className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-ocean">
            <Compass className="h-4 w-4" />
            <span>Barkada Trips Dashboard</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            My Road Trips &amp; Getaways
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage itineraries, live convoy beacons, and itemized KKB splits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="default"
            className="gap-2 rounded-xl"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Plan New Trip</span>
          </Button>
        </div>
      </div>

      {/* Join Barkada Code Bar */}
      <div className="rounded-2xl border border-accent-sunset/30 bg-accent-sunset/5 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-sunset/15 text-accent-sunset">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Have a Barkada Invite Code?
            </h4>
            <p className="text-xs text-muted-foreground">
              Enter the 6-character code (e.g.{" "}
              <span className="font-mono font-bold text-foreground">
                ELYU-9X2Y
              </span>
              ) to join an existing group.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleJoinTrip}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            maxLength={12}
            className="h-10 w-full sm:w-44 rounded-xl border border-border bg-surface px-3 text-xs font-bold uppercase tracking-wider text-foreground placeholder:normal-case placeholder:text-muted-foreground focus:border-accent-sunset focus:outline-none focus:ring-2 focus:ring-accent-sunset/20"
          />
          <Button
            type="submit"
            variant="sunset"
            size="sm"
            className="rounded-xl px-4 shrink-0"
          >
            Join
          </Button>
        </form>
      </div>

      {joinMessage && (
        <div className="rounded-xl bg-nature-emerald/10 border border-nature-emerald/30 p-3 text-xs font-bold text-nature-emerald animate-in fade-in">
          {joinMessage}
        </div>
      )}

      {/* Trips Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Active &amp; Upcoming Trips
        </h2>

        {trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary text-2xl">
              🗺️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                No trips planned yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Ready for a weekend in Elyu, Baguio, or Baler? Create a trip or
                ask your friends for their barkada invite code.
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="default"
              size="sm"
              className="rounded-xl"
            >
              Plan Your First Trip
            </Button>
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTrip}
      />
    </main>
  );
}
