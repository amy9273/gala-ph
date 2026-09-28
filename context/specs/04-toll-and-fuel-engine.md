# Unit 04: Toll & Fuel Calculation Engine — GalaPH

This specification details the multi-modal Philippine expressway toll matrix engine, dual-RFID account isolation (Autosweep vs. Easytrip), vehicle class fee resolution, and fuel consumption calculation.

---

## 1. Scope & Objectives

1. **Dual-RFID Expressway Toll Calculation**:
   - Query highway plaza rates from `ExpresswayTollRate` database table.
   - Symmetrical plaza support (entry $\leftrightarrow$ exit bidirectional lookup).
   - Vehicle class rate mapping:
     - **Class 1**: Sedans, hatchbacks, crossovers, SUVs, pickups, vans (passenger height < 7 ft).
     - **Class 2**: Light trucks, provincial buses, heavy vans (height $\ge$ 7 ft with 2 axles).
     - **Class 3**: Heavy trucks, multi-axle freight vehicles (3+ axles).
   - Dual-RFID isolation:
     - Aggregates fees strictly by `rfidProvider` (`AUTOSWEEP` vs `EASYTRIP`).
     - Computes exact centavos and rounded Philippine peso top-up recommendations.

2. **Popular Philippine Barkada Preset Routes**:
   - Pre-configured expressway sequences for common weekend barkada destinations:
     - **Manila to La Union (Elyu)**: Skyway 3 (Buendia $\to$ Balintawak) + NLEX (Balintawak $\to$ SCTEX) + SCTEX (Clark $\to$ Tarlac) + TPLEX (Tarlac $\to$ Rosario).
     - **Manila to Baguio**: Skyway 3 + NLEX + SCTEX + TPLEX (Tarlac $\to$ Rosario).
     - **Manila to Batangas Port (Puerto Galera jump-off)**: Skyway 3 + SLEX (Magallanes $\to$ Sto. Tomas) + STAR Tollway.
     - **Manila to Tagaytay**: Skyway 3 + SLEX + CALAX (Mamplasan $\to$ Aguinaldo Highway).
     - **Manila to Subic / Zambales**: Skyway 3 + NLEX + SCTEX (Clark $\to$ Subic).

3. **Philippine Fuel Consumption & Cost Estimator**:
   - Fuel consumption model:
     - `litersNeeded = distanceKm / fuelEfficiencyKmPerLiter`
     - `totalFuelCentavos = round(litersNeeded * pricePerLiter * 100)`
   - Vehicle efficiency presets:
     - `SEDAN_1_5L`: 12.5 km/L
     - `SUV_DIESEL_2_8L`: 9.5 km/L
     - `COMMUTER_VAN`: 8.0 km/L
     - `MOTORCYCLE_150CC`: 38.0 km/L
   - Fuel price defaults with customizable per-liter inputs.

4. **Trip Integration & Vehicle Assignment**:
   - Persist calculated toll estimates into `TollEstimate` records linked to a `Trip`.
   - Associate estimates with a specific `vehicleId` for transit expense isolation.

5. **REST API Endpoints**:
   - `POST /api/v1/toll/calculate`: Calculate custom or preset expressway route tolls by vehicle class.
   - `POST /api/v1/toll/fuel-estimate`: Calculate estimated fuel volume and cost by distance, vehicle type, and fuel price.
   - `POST /api/v1/trips/:id/toll-estimates`: Attach toll estimates directly to a barkada trip and designated vehicle.
   - `GET /api/v1/toll/presets`: List available preset Philippine road trip routes.

6. **Automated Testing & Verification**:
   - Integration tests in `apps/api/src/__tests__/unit-04-toll-fuel.test.ts`.

---

## 2. Invariants & Rules

1. **Dual-RFID Isolation**:
   Autosweep (SMC tollways) and Easytrip (MPTC tollways) balances are completely separate financial accounts in the Philippines. Under no circumstances should the system merge their required balances into a single non-differentiated number.
2. **Exact Centavo Currency Math**:
   All monetary calculations must be stored and computed as integer centavos without floating-point drift.
3. **Plaza Symmetrical Fallback**:
   If an expressway segment query for `(entry: A, exit: B)` is not explicitly found, the engine must check `(entry: B, exit: A)` before declaring the plaza pair invalid.
