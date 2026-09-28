# Unit 05: Commuter Transit & TODA Tariff Engine — GalaPH

This specification details the multi-modal provincial commuter transit routing engine, GTFS-style bus terminal schedules, official TODA (Tricycle Operators and Drivers Association) tariffs, last-trip curfew warnings, and Philippine dialect negotiation tips.

---

## 1. Scope & Objectives

1. **Provincial Transit Hubs & Bus Router (`TransitService`)**:
   - Query major provincial bus terminals:
     - **PITX** (Parañaque Integrated Terminal Exchange - South/North Luzon, Visayas, Bicol).
     - **Cubao Terminals** (Genesis, Victory Liner, Partas, Five Star - Central & Northern Luzon).
     - **Buendia / Pasay Terminals** (JAM Liner, DLTB, JAC Liner, Philtranco - Batangas, Laguna, Quezon, Bicol).
   - Search bus schedules by origin, destination, operator, and service type (`REGULAR`, `AIRCON`, `FIRST_CLASS`, `SLEEPER`).
   - Retrieve estimated travel duration, base fares in integer centavos, and first/last trip departure curfews.

2. **Official TODA Tariff Directory & Dialect Tips**:
   - Database model `TodaTariff` with:
     - `regularFarePerHead` vs `specialTripFare` rates.
     - `nightDiffFare` (night surcharge after 8 PM / 9 PM).
     - `lastTripCurfew` time to prevent stranded commuters.
     - `dialectTips`: Authentic local phrases (Ilocano, Batangueño Tagalog, Cebuano, Bicolano) to negotiate fair rates and avoid tourist markups.
   - Initial seed coverage:
     - **San Juan, La Union** (Urbiztondo beachfront, Tangadan Falls jump-off).
     - **Nasugbu / Calatagan, Batangas** (Wawa Port, Fortune Island jump-off, Matabungkay).
     - **Baler, Aurora** (Sabang Beach, Dicasalarin Cove).
     - **Moalboal, Cebu** (Panagsama Beach, White Beach).
     - **Panglao, Bohol** (Alona Beach, Dumaluan Beach).

3. **Multi-Leg Commuter Itinerary Planner**:
   - Generates end-to-end multi-modal commuter directions:
     - **Leg 1**: Metro Manila Hub $\to$ Provincial Drop-off (Aircon/Sleeper Bus).
     - **Leg 2**: Provincial Highway / Terminal $\to$ Destination Beachfront / Resort (Local TODA Tricycle or Jeepney).
   - Computes total commuter cost per head and flags last-trip curfew risks.

4. **Trip Integration**:
   - Save multi-leg transit steps into `TransitLeg` models linked to a `Trip`.
   - Protect routes with member authorization checks.

5. **REST API Endpoints**:
   - `GET /api/v1/transit/hubs`: List major provincial transit hubs.
   - `GET /api/v1/transit/buses`: Search provincial bus routes and schedules.
   - `GET /api/v1/transit/toda`: Search TODA tariffs and dialect negotiation tips by municipality.
   - `POST /api/v1/transit/plan`: Plan end-to-end multi-leg commuter transit route.
   - `POST /api/v1/trips/:id/transit-legs`: Attach planned transit legs to a barkada trip.

6. **Automated Testing & Verification**:
   - Unit and integration tests in `apps/api/src/__tests__/unit-05-transit-toda.test.ts`.

---

## 2. Invariants & Rules

1. **Exact Centavo Currency Math**:
   All bus ticket fares and TODA tariffs must be represented as integer centavos or `Decimal(10, 2)` to eliminate precision drift.
2. **Special vs. Regular Fare Transparency**:
   TODA listings must explicitly differentiate between per-head regular commuter fares and chartered special trip rates so groups can choose the most cost-effective option.
3. **Last-Trip Curfew Safety Warnings**:
   Any planned transit route where the final provincial connection departs after the local last-trip curfew must return an explicit `hasCurfewWarning: true` advisory flag.
