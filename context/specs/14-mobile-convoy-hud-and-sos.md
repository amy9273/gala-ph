# Unit 14: Mobile Convoy HUD & SOS — GalaPH

This specification details the Mobile Driver HUD Mode, live GPS convoy radar, straggler proximity detection, and 1-tap roadside emergency SOS beacon for Philippine barkada road trips.

---

## 1. Scope & Objectives

### A. One-Handed Driver HUD Mode (`ConvoyHudScreen.tsx`)

1. **High-Glare Outdoor & Dashboard Ergonomics**:
   - High-contrast HUD interface designed for dashboard phone mounts under direct Philippine sunlight and night drives.
   - Giant numeric speedometer ($64\text{dp}+$ typography) with live km/h readout, color-coded velocity states (Green cruising $\le 80\text{km/h}$, Amber expressway $80-100\text{km/h}$, Coral overspeed $> 100\text{km/h}$).
   - Compass heading badge (0–360° with cardinal headings: N, NE, E, SE, S, SW, W, NW).

2. **Convoy Telemetry & Spread Status**:
   - Total convoy spread calculation ($\Delta\text{distance}$ between lead and trailing vehicles in km).
   - Distance to vehicle ahead and distance to vehicle behind using `@gala-ph/shared` Haversine distance calculators.
   - Automated straggler proximity warning banner triggered when any convoy vehicle lags $> 5.0\text{km}$ behind the pack.

3. **One-Handed Thumb Action Dock**:
   - Ergonomic $56\text{dp}$ touch targets anchored at the bottom for safe, one-handed driver interaction:
     - ⛽ **Gas / Pitstop** status ping
     - 🚻 **Restroom** status ping
     - 🛑 **Pulled Over / Stopping** status ping
     - 🚨 **Roadside SOS** (Prominent high-urgency emergency trigger)

---

### B. Live Convoy Radar & Vehicle Roster (`ConvoyRadarView.tsx`)

1. **Top-Down Relative Spatial Radar**:
   - Visual relative position layout depicting Lead Vehicle, Current Vehicle, and Trailing/Straggler Vehicles.
   - Distance indicators (e.g. `+1.2 km ahead`, `-4.8 km behind`).
   - Active status badges (Moving, Stopped, Refueling, Lagging Behind).

2. **Vehicle Telemetry Cards**:
   - Driver profile, vehicle name/model, battery level percentage, speed, and time since last beacon.

---

### C. 1-Tap Roadside Emergency SOS Beacon (`RoadsideSosModal.tsx` / `ActiveSosEmergencyBanner.tsx`)

1. **Philippine Roadside Emergency Categories**:
   - `FLAT_TIRE` (Flat tire / vulcanizing needed)
   - `OVERHEAT` (Engine overheat / radiator)
   - `ACCIDENT` (Vehicular collision)
   - `POLICE_CHECKPOINT` (Checkpoint / citation)
   - `MEDICAL_EMERGENCY` (Health crisis)
   - `LOST_ROUTE` (Out of signal / wrong turn)
   - `OTHER` (General breakdown)

2. **Safety Countdown & Offline Resilience**:
   - 3-second safety countdown with instant dispatch bypass.
   - Broadcasts GPS coordinates, timestamp, emergency reason, and driver contact phone.
   - Optimistically saves emergency state into local SQLite database and queues `TRIGGER_SOS` / `RESOLVE_SOS` into `outbox_mutations`.

---

## 2. Invariants & Guardrails

1. **Exact Mathematical Distance**:
   - Use `calculateHaversineDistanceKm` and `calculateHaversineDistanceMeters` from `@gala-ph/shared` with zero floating point drift.
2. **Offline Outbox Persistence**:
   - When offline or during weak provincial cellular signal, SOS events and status pings must be persisted in SQLite with unique idempotency keys (`idemp-sos-...`) and synced when connection resumes.
3. **Ergonomic Safety Standard**:
   - In HUD Mode, all primary touch targets must measure $\ge 56\text{dp}$ with high contrast ($> 7:1$ WCAG AAA) and minimal visual distractions.
