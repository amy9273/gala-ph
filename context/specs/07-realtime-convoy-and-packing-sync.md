# Unit 07: Realtime Convoy & Packing Sync — GalaPH

This specification details the real-time WebSocket architecture, live GPS convoy telemetry, geofencing and straggler proximity alerts, emergency roadside SOS beacons, and synchronized Bayanihan shared packing checklist management for Philippine barkada trips.

---

## 1. Scope & Objectives

### A. Bayanihan Shared Packing Checklist Engine (`PackingService`)

1. **Item Lifecycle & Assignments**:
   - Trip members can view, add, update, assign, and delete shared gear and essentials (`PackingItem`).
   - Standard categories: `GEAR`, `FOOD_DRINKS`, `MEDICAL`, `COMFORT`, `DOCUMENTS`, `MISCELLANEOUS`.
   - Assign items to specific trip members (`assignedToId`) or leave unassigned for open claiming.
   - Quantity tracking (e.g. 2 coolers, 4 water gallons) to prevent duplication or shortages.

2. **Packing Status & Timestamping**:
   - 1-tap toggling of packed status (`isPacked: boolean`).
   - Automatically records `packedAt: DateTime` when checked off, or nullifies when unchecked.

3. **REST Endpoints (`/api/v1/trips/:id/packing`)**:
   - `GET /api/v1/trips/:id/packing`: Retrieve all packing items for the trip, sorted by category and completion status, with assignee profiles.
   - `POST /api/v1/trips/:id/packing`: Create a new packing item with optional assignee.
   - `PATCH /api/v1/trips/:id/packing/:itemId`: Update packing item details (itemName, category, quantity, assignedToId).
   - `PATCH /api/v1/trips/:id/packing/:itemId/toggle`: Toggle packing completion status.
   - `DELETE /api/v1/trips/:id/packing/:itemId`: Delete a packing item.

---

### B. Live GPS Convoy Telemetry & Catch-Up Beacon (`ConvoyService`)

1. **High-Frequency GPS Beaconing**:
   - Drivers and carpool passengers stream current geolocation:
     - `latitude`: number (-90 to 90)
     - `longitude`: number (-180 to 180)
     - `speedKmh`: number (optional, >= 0)
     - `heading`: number (optional, 0 to 360 degrees)
     - `vehicleId`: string (optional, e.g. "car-1", "van-2")
     - `batteryLevel`: number (optional, 0 to 100)
     - `updatedAt`: ISO timestamp

2. **Redis Ephemeral Telemetry Storage (`galaph:convoy:beacon:`)**:
   - Store real-time coordinate beacons in Redis with key format:
     `galaph:convoy:beacon:<tripId>:<userId>`
   - Set a strict TTL of **60 seconds** to automatically prune offline/inactive vehicles.
   - Support querying all active convoy beacons in a trip with a single scan/mget.

3. **Geofencing & Straggler Distance Calculations**:
   - Compute Haversine distances between all active convoy vehicles in the trip.
   - If distance between any convoy vehicle and the lead vehicle exceeds the straggler threshold (e.g. 5,000 meters / 5 km), generate a `CONVOY_STRAGGLER_ALERT`.

4. **Emergency Roadside SOS Beacon**:
   - Drivers or passengers can trigger an immediate SOS alert (`FLAT_TIRE`, `OVERHEAT`, `ACCIDENT`, `POLICE_CHECKPOINT`, `MEDICAL_EMERGENCY`, `LOST_ROUTE`).
   - Instant high-priority broadcast to all convoy and trip members with the exact GPS coordinates and contact phone number.
   - Ability to resolve/cancel an active SOS alert.

5. **REST Endpoints (`/api/v1/trips/:id/convoy`)**:
   - `GET /api/v1/trips/:id/convoy/locations`: Retrieve snapshot of all currently active vehicle beacons.
   - `POST /api/v1/trips/:id/convoy/ping`: HTTP fallback for sending a GPS beacon.
   - `POST /api/v1/trips/:id/convoy/sos`: HTTP fallback for broadcasting an SOS emergency.
   - `POST /api/v1/trips/:id/convoy/sos/resolve`: Resolve an active SOS alert.

---

### C. Real-Time WebSocket Hub (`SocketServer` / `ws`)

1. **Authentication & Connection Lifecycle**:
   - Standard WebSocket server attached to HTTP server.
   - Authenticate connections using JWT Bearer token in query string (`ws://.../?token=<jwt>`) or auth headers.
   - Associate socket with authenticated `userId` and allow subscribing to trip channels (`trip:<tripId>`).
   - Validate that the connecting user is an active member of the trip before admitting to room.

2. **Event Topics & Payloads**:
   - `JOIN_TRIP`: `{ tripId }` $\to$ Subscribes client socket to `trip:<tripId>`.
   - `LEAVE_TRIP`: `{ tripId }` $\to$ Unsubscribes client socket.
   - `PACKING_SYNC`: Broadcasts `{ type: "ITEM_ADDED" | "ITEM_UPDATED" | "ITEM_TOGGLED" | "ITEM_DELETED", item, actorId }`.
   - `CONVOY_BEACON`: Receives GPS ping, updates Redis, broadcasts `{ userId, vehicleId, latitude, longitude, speedKmh, heading, updatedAt }`.
   - `CONVOY_STRAGGLER_ALERT`: Broadcasts `{ laggingUserId, distanceKm, leadUserId }`.
   - `CONVOY_SOS`: Broadcasts `{ alertId, userId, reason, latitude, longitude, details, issuedAt }`.
   - `CONVOY_SOS_RESOLVED`: Broadcasts `{ alertId, resolvedBy, resolvedAt }`.

---

## 2. Invariants & Guardrails

1. **Redis Namespace Invariant**:
   All convoy keys and SOS alerts written to Redis must use the `galaph:` prefix:
   - `galaph:convoy:beacon:<tripId>:<userId>` (TTL: 60s)
   - `galaph:convoy:sos:<tripId>:<alertId>` (TTL: 24h)
2. **Multi-Tenant Trip Isolation**:
   Only verified members of `TripMember` for `tripId` can subscribe to real-time events or access packing and convoy endpoints.
3. **Graceful Teardown & Reconnection**:
   WebSocket clients and server must handle disconnects gracefully with zero memory leaks, ping/pong heartbeats, and clean socket teardowns in tests.
4. **Offline Resiliency**:
   Packing list mutations via REST work identically whether WebSocket is connected or temporarily offline.
