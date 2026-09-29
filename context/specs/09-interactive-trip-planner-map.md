# Unit 09: Interactive Trip Planner Map — GalaPH

This specification details the interactive route planner, expressway dual-RFID breakdown card, DOST-PAGASA weather and hazard banner, trip itinerary timeline, and standalone toll calculator web interface for GalaPH.

---

## 1. Scope & Objectives

### A. Standalone & Embedded Dual-RFID Toll Calculator (`/toll-calculator`)

1. **Route & Vehicle Class Selection**:
   - Support 5 preset Philippine road trip routes:
     - `MANILA_TO_LA_UNION` (NLEX Balintawak $\to$ SCTEX $\to$ TPLEX Rosario)
     - `MANILA_TO_BAGUIO` (NLEX Balintawak $\to$ SCTEX $\to$ TPLEX Rosario $\to$ Kennon / Marcos Hwy)
     - `MANILA_TO_BATANGAS_PORT` (Skyway 3 $\to$ SLEX $\to$ STAR Tollway $\to$ Batangas Port)
     - `MANILA_TO_TAGAYTAY` (Skyway 3 $\to$ SLEX $\to$ CALAX $\to$ Tagaytay)
     - `MANILA_TO_SUBIC` (NLEX Balintawak $\to$ SCTEX $\to$ Subic Freeport)
   - Support custom origin/destination plaza lookups across NLEX, SCTEX, TPLEX, Skyway 3, SLEX, CALAX, CAVITEX, MCX, CCLEX.
   - Support Vehicle Class 1, Class 2, and Class 3 toggles.

2. **Dual-RFID Account Isolation Card**:
   - **Autosweep Panel** (Amber/Gold badge): Exact toll subtotal, plaza-by-plaza table, and rounded ₱50 top-up buffer.
   - **Easytrip Panel** (Ocean/Blue badge): Exact toll subtotal, plaza-by-plaza table, and rounded ₱50 top-up buffer.
   - **Combined Road Trip Total**: Total tolls + Estimated fuel consumption based on selected vehicle engine economy (`SEDAN_1_5L`, `SUV_DIESEL_2_8L`, `COMMUTER_VAN`, `MOTORCYCLE_150CC`, `CUSTOM`).

---

### B. DOST-PAGASA Weather Alert & Route Hazard Banner

1. **Advisory Ingestion & Rendering**:
   - Displays real-time / simulated DOST-PAGASA tropical cyclone wind signals (Signal #1 to #5), gale warnings, and heavy rainfall advisories.
   - Severity badges:
     - `CRITICAL`: High-contrast Rose alert banner with emergency action recommendations.
     - `MODERATE`: Amber warning banner for mountain pass landslide hazards and maritime port delays.
     - `LOW`: Emerald/Sky information banner for light monsoon showers.

2. **Route-Specific Hazard Notices**:
   - Kennon Road / Marilaque Highway landslide advisories during heavy rains.
   - Batangas Port / Surigao ferry gale warnings during rough sea states.

---

### C. Interactive Trip Planner & Itinerary Views (`/trips` and `/trips/[id]`)

1. **Trips Directory (`/trips`)**:
   - 4-state UI compliant list of user's active and upcoming Philippine trips.
   - **"Create New Trip" Modal / Dialog**: Title, Destination, Start/End dates, Travel Mode (`PRIVATE_CAR`, `MOTORCYCLE`, `COMMUTE_BUS`, `COMMUTE_VAN`, `HYBRID`), and optional custom invite code.
   - **"Join Barkada Trip" Input**: Instant membership validation via 6-character code.

2. **Trip Management Detail View (`/trips/[id]`)**:
   - Hero Header: Trip Title, Destination, Travel Dates, Barkada Invite Code with 1-click copy button, and member avatars.
   - **Tabbed Bento Architecture**:
     - 🗺️ **Route & Toll Breakdown**: Interactive route overview, Autosweep/Easytrip cards, and fuel estimator.
     - 📅 **Itinerary Timeline**: Day-by-day collapsible schedule with time slots, activities, location pins, and estimated costs.
     - 🌦️ **PAGASA Weather Banner**: Live weather conditions and route safety warnings.
     - 🎒 **Bayanihan Packing**: Shared checklist with progress bar.
     - 🧾 **KKB Ledger Summary**: Real-time spending & quick settle link.

---

### D. Interactive Route Map Component (`<RouteMap />`)

1. **Lightweight Interactive Canvas / Map**:
   - Responsive vector routing canvas with expressway highway corridors (NLEX, SCTEX, TPLEX, SLEX, Skyway 3, CALAX, CAVITEX).
   - Interactive plaza toll waypoints with hover tooltips showing provider (`AUTOSWEEP` vs `EASYTRIP`) and entry/exit fee details.
   - Active convoy vehicle position markers with speed and heading indicators.

---

## 2. Invariants & Rules

1. **Anti-Slop Guardrail**:
   - Use design tokens from `ui-context.md` (`bg-brand-ocean`, `text-accent-sunset`, `bg-travel-autosweep`).
2. **Mandatory 4-State UI Rule**:
   - Every trip screen and toll calculator section must handle Loading (Shimmer Skeleton), Empty state, Error with Retry, and Populated state.
3. **Exact Currency Formatting**:
   - Use `formatPHP()` for all currency amounts.
