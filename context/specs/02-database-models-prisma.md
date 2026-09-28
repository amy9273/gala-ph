# Unit 02: Database Models & Prisma — GalaPH

This specification details the complete database architecture, Prisma schema, seed infrastructure, and health check integration for GalaPH.

---

## 1. Scope & Objectives

1. **Prisma Schema (`apps/api/prisma/schema.prisma`)**:
   - PostgreSQL datasource targeting the Neon PostgreSQL instance via `DATABASE_URL`.
   - Comprehensive domain models covering:
     - **Authentication & Users**: `User` with Philippine phone numbers, GCash, Maya.
     - **Trips & Barkada Membership**: `Trip`, `TripMember` with roles (`TRIP_LEAD`, `MEMBER`, `DRIVER`, `COMMUTER`), non-drinker flags, vehicle assignments.
     - **Bayanihan Packing**: `PackingItem` with assignable owners, categories, and packed status.
     - **PAGASA Weather Alerts**: `TripWeatherAlert` with TCWS signals, severity levels, and issuance timestamps.
     - **Granular KKB Ledger**: `Expense`, `ExpenseItem`, `ItemConsumer`, `ExpenseSplit` with exact integer centavo fields and Decimal equivalents for zero floating-point error.
     - **Philippine Toll & Highway Infrastructure**: Expressway matrices for `AUTOSWEEP` and `EASYTRIP` (Class 1–3) with plazas and exact rates.
     - **Multi-Modal Transit Legs**: `TransitLeg` with bus/jeep/trike fare rates, special trips, and last trip curfews.
     - **Itinerary Timeline**: `ItineraryItem` for scheduled activities, coordinates, and estimated costs.
2. **Prisma Singleton Client (`apps/api/src/lib/prisma.ts`)**:
   - Singleton client export preventing multiple connection pools in development and test environments.
   - Teardown helper for graceful shutdown and test lifecycle.
3. **Database Seed Script (`apps/api/prisma/seed.ts`)**:
   - Real toll fee tables for major Philippine expressways:
     - **NLEX** (Balintawak, Mindanao Ave, San Fernando, Dau, Sta. Ines)
     - **SCTEX** (Clark, Subic, Tarlac Central)
     - **TPLEX** (Tarlac Central, Urdaneta, Pozorrubio, Rosario)
     - **Skyway Stage 3** (Buendia, Plaza Dilao, Quezon Ave, Balintawak)
     - **SLEX** (Magallanes, Alabang, Santa Rosa, Calamba, Sto. Tomas)
     - **CALAX** (Mamplasan, Santa Rosa, Silang East, Aguinaldo)
     - **CAVITEX, MCX, CCLEX**
   - Major provincial bus terminals:
     - **PITX**, **Cubao**, **Buendia / Pasay**
   - Realistic demo trip: _"Elyu Surf & Chill Weekend"_ with drivers, commuters, non-drinker members, gear packing list, PAGASA advisory, and itemized dinner expense.
4. **Health Probe Integration**:
   - Enhance `apps/api/src/routes/health.routes.ts` `/health/ready` probe to verify active PostgreSQL connectivity using Prisma (`SELECT 1`).
5. **Quality & Validation**:
   - Run `prisma db push` to synchronize schema with Neon PostgreSQL.
   - Run `prisma/seed.ts` to populate reference and demo data.
   - Unit tests verifying model queries, relations, and cascade deletions.

---

## 2. Invariants & Rules

1. **Mathematical Conservation**:
   The sum of `ExpenseSplit.amountOwed` for any expense must exactly equal `Expense.totalAmount` within ₱0.01 precision.
2. **Transit Isolation**:
   Expenses restricted by `vehicleIdOnly` can only be split among members assigned to that `vehicleId`.
3. **Connection Hygiene**:
   Prisma client must disconnect gracefully in server teardown and Jest/node:test suites to avoid hanging connections.
