# Unit 15: Automated Testing & CI/CD Pipeline — GalaPH

This specification details the comprehensive monorepo automated testing strategy, debt graph and integer centavo mathematical verification suites, and the unified GitHub Actions CI/CD pipeline for the GalaPH platform.

---

## 1. Scope & Objectives

### A. Monorepo-Wide Test Coverage

1. **Shared Package (`@gala-ph/shared`)**:
   - Exact integer centavo currency math (`pesosToCentavos`, `centavosToPesos`, `formatPHP`).
   - Remainder centavo distribution with mathematical conservation (`splitAmountEqually`).
   - Philippine mobile phone validation and E.164 normalization (`isValidPhilippinePhone`, `normalizePhilippinePhone`).
   - Haversine geographical distance calculations (`calculateHaversineDistanceKm`, `calculateHaversineDistanceMeters`).
   - Zod runtime validation contracts (`ConvoyBeaconSchema`, `ConvoySosAlertSchema`, `ExpenseCategorySchema`, `TravelModeSchema`).

2. **Backend API (`apps/api`)**:
   - Integration test suites covering:
     - Auth & multi-tenant trip management (JWT authentication, role permissions, invite code generation).
     - Dual-RFID Expressway toll matrix and fuel estimation (Autosweep vs Easytrip isolation, class multipliers).
     - Commuter transit router and crowdsourced TODA fare directory.
     - Itemized KKB consumption ledger, non-drinker alcohol exclusion, and greedy bilateral debt graph solver.
     - Real-time WebSockets hub, GPS convoy telemetry, and Bayanihan shared packing checklist sync.

3. **Mobile React Native (`apps/mobile`)**:
   - Offline-first SQLite persistence and schema migrations.
   - Optimistic state updates and idempotent Outbox queue synchronization (`outboxRepository`, `OutboxSyncService`).
   - Philippine dining receipt OCR parser, alcohol keyword heuristics, and proportional SC/tax calculator.
   - In-car Driver HUD Mode, live spatial radar, straggler distance detection ($> 5.0\text{km}$), and roadside emergency SOS lifecycle.

4. **Web Application (`apps/web`)**:
   - Client-side itemized bill split calculation with proportional tax and service charge apportionment.
   - Greedy bilateral debt graph simplification ($O(N^2) \to \le N-1$).
   - Dual-RFID toll fee calculations with ₱50 buffer rounding.
   - Fuel consumption estimation.

---

### B. Unified GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)

1. **Job Matrix**:
   - `lint-and-typecheck`: Validates Prettier formatting (`npm run format:check`), ESLint across all workspaces (`npm run lint`), and strict TypeScript typechecking (`npm run typecheck`).
   - `test-shared`: Executes automated test suite for `@gala-ph/shared`.
   - `test-api`: Spins up ephemeral PostgreSQL 16 and Redis 7 containers, runs schema migrations (`db:migrate:test`), and executes API integration tests.
   - `test-mobile`: Executes mobile React Native test suites with in-memory SQLite harness.
   - `test-web`: Executes web client logic and component calculation tests.
   - `build-web`: Compiles production Next.js static bundle (`npm run build:web`).
   - `ci-success`: Unified gate for GitHub branch protection rules requiring all jobs to succeed.

---

## 2. Invariants & Quality Standards

1. **100% Mathematical Conservation**:
   - In both backend, web, and mobile split engines, $\sum \text{consumer shares} \equiv \text{grand total}$ in exact integer centavos with zero floating-point drift.
2. **Deterministic Outbox Idempotency**:
   - Mutations queued during offline scenarios must generate unique `idemp-...` keys ensuring zero duplicate insertions on retry.
3. **Hermetic Test Environments**:
   - All tests must run hermetically with automated setup and teardown of test databases and in-memory caches.
