# Product Overview — GalaPH

## 1. Executive Summary

**GalaPH** is an all-in-one travel operating system tailored specifically for the Philippine context and culture. It solves the endemic logistical and financial frictions of Philippine _barkada_ (group) getaways, road trips, and mixed-mode travel (drivers + commuters).

It eliminates **"drawing" (flake outs)**, **the Philippine dual-RFID toll nightmare (Autosweep vs Easytrip)**, **last-mile commuter overcharging (TODA tariffs)**, **forgotten essential gear via the Bayanihan Packing Checklist**, **typhoon/landslide trip disruptions via PAGASA Weather Alerts**, and **the social awkwardness of "KKB / Singilan"** via an **Itemized Granular Consumption Ledger** where members only pay for what they actually consumed or rendered.

---

## 2. Target Personas & Real-World Philippine Dynamics

| Persona                               | Key Context                                                                                | Primary Pain Points                                                                                            |
| :------------------------------------ | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **The Trip Lead / Organizer**         | Organizes 6–12 friends for a weekend in La Union, Zambales, Batangas, or Rizal.            | Flake outs after booking, calculating dual-RFID toll loads, chasing payments post-trip, equipment duplication. |
| **The Car Owner / Driver**            | Provides private car or SUV for the convoy.                                                | Incurring vehicle wear-and-tear, fronting gas/toll costs, unexpected flood/typhoon route hazards.              |
| **The Commuter Friend**               | Rides Victory Liner / Genesis Bus / UV Express from Cubao/PITX to meet group.              | Unfairly billed for highway toll/gas they didn't ride; overcharged by tourist-trap tricycles.                  |
| **The Non-Drinker / Allergic Friend** | Joins meals and late-night _inuman_ but doesn't drink or eat specific food (e.g. seafood). | Resents blind equal splits ("total bill divided by 10") paying for expensive alcohol & seafood.                |

---

## 3. Core Capabilities & Feature Scope

### A. Philippine Multi-Modal Travel & Routing Engine

1. **Dual-RFID Toll Calculator**:
   - Supports Class 1, 2, 3 vehicles.
   - Calculates exact entry-to-exit fees across **Autosweep** (SLEX, Skyway Stage 3, TPLEX, NAIAX) and **Easytrip** (NLEX, SCTEX, CAVITEX, CALAX).
   - Generates exact balance top-up recommendations prior to departure.
2. **Commuter Transit Guides & TODA Tariff Directory**:
   - Step-by-step terminal guides (PITX, Cubao, Pasay, Buendia) $\to$ Provincial Buses $\to$ Local Jeepneys / TODA Tricycles.
   - Verified local official fare matrices (Special vs Per-Head rates) with local dialect phrases to avoid tourist markups.
   - Last-trip curfew alarms (prevents getting stranded at remote waterfalls/coves).
3. **Live Convoy & Catch-Up Beacon**:
   - Real-time WebSockets & Geofencing for multi-car convoys and commuter bus catch-up points.

### B. Travel Readiness & Safety

1. **PAGASA Weather & Disaster Alerts**:
   - Live weather alert integration (Tropical Cyclone Wind Signals #1-#5, Heavy Rainfall Warnings, Gale Warnings).
   - Automated itinerary route hazard warnings (landslide alerts on Kennon/Marilaque, Batangas port sea gale warnings).
2. **Bayanihan Shared Packing & Equipment Checklist**:
   - Assignable shared gear (e.g. "Ice Cooler $\to$ Juan", "Extension Cord $\to$ Mark", "First Aid Kit $\to$ Sarah").
   - Quantity tracking to prevent equipment duplication and forgotten road trip essentials.

### C. Granular Itemized KKB (Kanya-Kanyang Bayad) & Debt Simplification

1. **Itemized Receipt OCR & Tagging**:
   - Scan physical receipt (e.g. Dampa seafood, 7-Eleven, dinner).
   - Line items extracted automatically; assign individuals or sub-groups to each dish/item.
   - Proportional mathematical apportionment of Service Charges and Local Taxes based on actual food subtotal.
2. **Transit Expense Isolation**:
   - Gas & Toll split ONLY among designated car passengers (optionally exempting the car owner/driver).
   - Commuter tickets logged exclusively to commuters.
3. **Debt Simplification Graph Algorithm**:
   - Greedy bilateral debt cancellation ($O(V+E)$) reducing $N \times N$ tangled debts into minimum direct transactions.
   - 1-tap dynamic **GCash / Maya QR generation** pre-filled with exact centavo amount.

### D. Offline-First Synchronization

- Full offline capability for provincial dead zones (Zambales, Aurora, Quezon, Batangas mountains).
- Local SQLite caching + conflict-free background synchronization when connectivity resumes.
