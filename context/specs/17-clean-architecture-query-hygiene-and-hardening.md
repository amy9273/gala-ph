# Unit 17: Clean Architecture, Query Hygiene & Engineering Hardening Specification

## 1. Objective

Harden the GalaPH monorepo across all workspaces (`packages/shared`, `apps/api`, `apps/web`, `apps/mobile`) to strictly conform to the updated [`context/engineering-best-practices.md`](file:///c:/Projects/gala-ph/context/engineering-best-practices.md). This entails eliminating N+1 database queries, enforcing atomic transactions, standardizing API error envelopes with correlation IDs, masking PII in logs, bounding listing queries with pagination, centralizing pure domain debt math in `@gala-ph/shared`, and solidifying the Expo monorepo configuration.

---

## 2. Requirements & Scope

### 2.1 PII & Secret Logger Redaction (Rule 5)

- Configure Pino `redact` in [`apps/api/src/lib/logger.ts`](file:///c:/Projects/gala-ph/apps/api/src/lib/logger.ts) to automatically mask:
  - `password`, `passwordHash`, `token`, `authorization`, `req.headers.authorization`, `*.password`, `*.token`, `phone`, `gcashNumber`, `mayaNumber`.
- Ensure censored values are replaced with `[REDACTED]`.

### 2.2 Standardized API Error Response Envelope (Rule 3)

- Update [`apps/api/src/middlewares/error.middleware.ts`](file:///c:/Projects/gala-ph/apps/api/src/middlewares/error.middleware.ts) to return the uniform contract:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable error description",
      "correlationId": "req-uuid-...",
      "details": []
    }
  }
  ```
- Pull the active `correlationId` from `asyncLocalStorage` store so clients can quote it for support tracing.

### 2.3 Database Query Hygiene & Anti-N+1 Batching (Rule 4 & Rule 7)

- **Toll Rate Batching**:
  - Refactor `TollService.calculateRouteToll` in [`apps/api/src/services/toll.service.ts`](file:///c:/Projects/gala-ph/apps/api/src/services/toll.service.ts) to eliminate the sequential `findFirst` loop.
  - Query all route segments in a single batch with `prisma.expresswayTollRate.findMany({ where: { OR: [...] } })` and map them in-memory, preserving bidirectional plaza symmetry.
- **Transactional Atomic Transit Persistence**:
  - Refactor `TransitService.attachTransitLegs` in [`apps/api/src/services/transit.service.ts`](file:///c:/Projects/gala-ph/apps/api/src/services/transit.service.ts) to wrap the operation in `prisma.$transaction()`.
  - Replace individual iterative `prisma.transitLeg.create` calls with atomic batch creation (`createMany` or transaction array).

### 2.4 Bounded Memory & Mandatory Pagination (Rule 4)

- **User Trips**:
  - Update `TripService.getUserTrips` in [`apps/api/src/services/trip.service.ts`](file:///c:/Projects/gala-ph/apps/api/src/services/trip.service.ts) to accept optional `page` and `limit` parameters (default: `page = 1, limit = 20`) with `take` and `skip`.
- **TODA Tariffs & Bus Routes**:
  - Enforce upper bounds (`take: limit || 100`) on provincial bus route and TODA tariff listings to guard against unbounded memory consumption.

### 2.5 Pure Domain Logic Isolation & Shared Debt Solver (Rule 1)

- Create [`packages/shared/src/ledger.ts`](file:///c:/Projects/gala-ph/packages/shared/src/ledger.ts) with pure, side-effect-free function:
  `solveGreedyDebtGraph(balances: MemberNetBalance[]): SimplifiedDebtTransaction[]`.
- Refactor [`apps/api/src/services/ledger.service.ts`](file:///c:/Projects/gala-ph/apps/api/src/services/ledger.service.ts) to import and execute `solveGreedyDebtGraph` from `@gala-ph/shared`.
- Refactor [`apps/web/src/lib/api.ts`](file:///c:/Projects/gala-ph/apps/web/src/lib/api.ts) to delegate debt simplification to `@gala-ph/shared`, eliminating duplicate math logic across frontend and backend.

### 2.6 Mobile Expo Monorepo Clean Bundling

- Ensure [`apps/mobile/app.json`](file:///c:/Projects/gala-ph/apps/mobile/app.json) and [`apps/mobile/metro.config.js`](file:///c:/Projects/gala-ph/apps/mobile/metro.config.js) resolve monorepo dependencies and root packages cleanly.

---

## 3. Deliverables & Quality Gates

1. **Updated Codebases**:
   - `packages/shared/src/ledger.ts` (pure debt solver algorithm) + export from `packages/shared/src/index.ts`.
   - `apps/api/src/lib/logger.ts` (Pino PII redaction).
   - `apps/api/src/middlewares/error.middleware.ts` (standard error envelope with correlationId).
   - `apps/api/src/services/toll.service.ts` (batched toll lookup).
   - `apps/api/src/services/transit.service.ts` (atomic transaction & batching).
   - `apps/api/src/services/trip.service.ts` (paginated `getUserTrips`).
   - `apps/web/src/lib/api.ts` (using shared debt solver).
2. **Automated Test Suite**:
   - `packages/shared/src/__tests__/ledger-solver.test.ts` (validating $\mathcal{O}(N \log N)$ bilateral simplification, conservation invariant, and zero odd centavo loss).
   - `apps/api/src/__tests__/unit-17-hardening.test.ts` (validating error envelope shape, PII redaction, batched toll queries, and transaction atomicity).
3. **Monorepo Quality Gates**:
   - 100% Prettier format check.
   - 100% strict TypeScript check across all workspaces.
   - 100% unit tests passing.
