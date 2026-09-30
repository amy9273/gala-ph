# Engineering Best Practices — GalaPH

## 1. Code Readability & Clean Architecture

- **Early Returns & Guard Clauses**: Invert nested conditionals and return or throw early. Keep the primary execution path (happy path) flat, un-nested, and readable at indentation level 0–1.
- **Function Brevity & Single Responsibility (SRP)**: Each function, method, and component must do one cohesive task and fit comfortably within 30–40 lines. Break large procedures into focused helper functions.
- **Pure Domain Logic Isolation**: Separate pure business calculations (split math, toll sums, distance formulas) from I/O side effects (HTTP calls, Prisma queries, WebSocket broadcasts) so domain logic is 100% unit-testable without mocks.
- **Intent-Revealing Naming**: Avoid cryptic abbreviations (`calcExp`, `btnClk`, `pData`) and vague names (`info`, `temp`, `data`, `item`). Prefer self-documenting domain identifiers (`autosweepSegmentBalance`, `unassignedEatersList`, `todaSpecialRateCentavos`).
- **Comments Policy ("Why", Not "What")**: Code should be self-documenting in describing _what_ it is doing. Comments exist strictly to explain _why_ non-obvious business rules, formulas, regulatory quirks (e.g. ₱50 Easytrip buffer reload), or workarounds exist.
- **Zero Dead Code**: Never commit commented-out blocks of code, unused imports, or orphaned functions. Rely on Git history for code retrieval.
- **Rule of Three (DRY vs. WET)**: Avoid premature abstraction. Consolidate logic only after seeing identical patterns repeated three times; duplicate code is preferable to the wrong abstraction.

---

## 2. Mathematical Accuracy & Currency Handling

- **Never use floating point numbers for currency**: Always store and compute currency amounts using exact integer centavos (e.g. ₱1,340.50 is represented as `134050` in logic, or `Decimal(10, 2)` in PostgreSQL).
- **Rounding Resolution Algorithm**: When distributing odd cents across $N$ members (e.g. ₱10.00 split 3 ways), distribute the remainder centavos starting from the largest consumer or primary payer to ensure $\sum \text{splits} \equiv \text{total}$.
- **Zero-Sum Balance Conservation**: In debt graph settlements, the sum of all net balances across members must strictly equal zero ($\sum \text{balances} = 0$).

---

## 3. Error Handling & Defensive Programming

- **Never Swallow Exceptions**: Never write empty `catch {}` blocks or log-and-forget patterns. If catching an error to rethrow, wrap it preserving the original cause (`new AppError("...", { cause: err })`).
- **Fail Fast & Boundary Validation**: Parse and validate all incoming inputs at system boundaries (HTTP request body, query params, WebSocket messages) using Zod schema parsers before reaching controllers or domain logic.
- **Standardized API Error Envelope**: All API error responses must adhere to a uniform JSON response contract:
  ```json
  {
    "success": false,
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "The requested trip was not found",
      "correlationId": "req-uuid-12345",
      "details": []
    }
  }
  ```
- **Graceful Degradation & Fallbacks**: Non-critical external service failures (e.g. Redis Cloud cache misses, OCR engine timeouts, live PAGASA weather scraping) must gracefully fall back to local database caches or deterministic presets rather than crashing user flows.

---

## 4. Resource Lifecycle & Query Hygiene

- **Listener, Timer & Socket Teardown**: Every `setInterval`, `setTimeout`, event listener (`addEventListener`, `.on()`), and WebSocket connection must have an explicit teardown mechanism invoked on component unmount or server shutdown.
- **Anti N+1 Database Queries**: Never execute database queries inside iterative loops (`for`, `.map()`, `forEach`). Always batch lookups using Prisma `in: ids` filters or relational `include` / `select` joins.
- **Bounded Memory & Mandatory Pagination**: Never execute unbounded queries (`findMany()` with no limits) on multi-row collections. Enforce default `take` (limit) and cursor- or offset-based pagination on all listing endpoints.
- **Immutable State Updates**: Favor pure immutable data transformations over in-place object or array mutations.

---

## 5. Security, PII & Multi-Tenant Isolation

- **Sanitized Logging (Zero Secret & PII Exposure)**: Never log plain-text passwords, JWT tokens, credit card digits, complete GCash/Maya reference tokens, or unmasked Philippine mobile numbers to application logs or monitoring sinks.
- **Strict Multi-Tenant Isolation**: Every endpoint accessing or mutating trip-scoped data (itinerary, ledger, packing, convoy) must verify that the authenticated user is an active member of that trip (`403 Forbidden` for non-members).
- **Least Privilege Access Control**: Enforce role-based checks (`TRIP_LEAD` vs `MEMBER`) on sensitive operations such as member role promotions, trip deletion, and expense approvals.
- **Rate Limiting on Sensitive Endpoints**: Enforce rate limiting on authentication (`/api/v1/auth/*`), trip creation, and OCR processing routes.

---

## 6. Testing Standards & Hermetic Fixtures

- **Arrange-Act-Assert (AAA) Pattern**: Structure test cases clearly with distinct setup, execution, and assertion phases.
- **Hermetic & Deterministic Tests**: Unit and integration tests must not depend on live external networks, third-party APIs (Mapbox, external OCR), or local system clock drift. Mock external I/O and seed predictable test database states.
- **Boundary & Failure Case Coverage**: Always test boundary values: zero amounts, empty arrays, odd centavo distributions, non-drinker alcohol exclusions, expired tokens, duplicate idempotency keys, and offline outbox conflicts.

---

## 7. API & Backend Best Practices

- **Idempotency Keys**: All financial transactions and split additions must accept an `x-idempotency-key` header to ensure retrying requests after mobile connection loss will never double-charge.
- **Atomic Transactions**: Multi-line item splits, debt settlements, and receipt imports must always be wrapped in Prisma `$transaction` blocks.
- **Fail-Safe Offline Reconciliation**: Sync queues from mobile clients must be processed in chronological sequence based on client monotonic timestamps, checking for existing transaction hashes before insertion.

---

## 8. Philippine Domain Specifics & Standards

- **RFID Formatting**: Display clear separation between **Autosweep** and **Easytrip** balances with distinct color coding (Autosweep: Yellow/Burgundy, Easytrip: Cyan/Blue).
- **Mobile Number Validation**: Support Philippine standard mobile formats (`+63 9XX XXX XXXX`, `09XX XXX XXXX`) with automatic normalization to E.164 (`+639XXXXXXXXX`) for GCash/Maya integrations.
- **TODA Matrix Display**: Always specify both **Special Trip Rate** (chartered tricycle for the group) vs. **Per-Head Rate** (shared commuter tricycle) to avoid miscommunication.

---

## 9. UI/UX Anti-Slop Guidelines

- **High-Glare Outdoor Contrast**: Clean, fast-loading, high-contrast UI designed for outdoor glare on bright sunny beaches or night-shift driving (minimum 48dp touch targets, clear typographic hierarchy).
- **1-Tap Quick Actions**: 1-tap quick actions for common operations (Add Quick Expense, Flash GCash QR, View Offline Toll Breakdown).
- **4-State UI Rule**: All data-consuming components must implement:
  1. Content-shaped Skeleton loading state (never an unstyled solitary spinner).
  2. Meaningful Empty state with an actionable button.
  3. User-friendly Error state with a "Retry" button.
  4. Populated data view.
- **Optimistic UI with Background Sync**: No unnecessary blocking spinners: optimistic UI updates with background synchronization for all ledger and checklist operations.

---

## 10. Shared Redis Infrastructure & Key Namespacing

Because GalaPH connects to an **already existing / shared Redis instance** (e.g. shared local server or Redis Cloud alongside other apps), all Redis interactions must strictly observe these rules:

- **Mandatory `galaph:` Key Prefixing**: NEVER write naked keys to Redis. Every key, lock, cache item, and BullMQ queue MUST use the `galaph:` namespace:
  - `galaph:cache:toll:<origin>:<destination>` (Toll matrix lookups, TTL: 24h)
  - `galaph:cache:weather:<province>` (PAGASA weather alerts, TTL: 15m)
  - `galaph:idempotency:<key>` (Financial transaction deduplication, TTL: 24h)
  - `galaph:convoy:beacon:<tripId>:<memberId>` (Live GPS coordinate, TTL: 60s)
  - `galaph:ratelimit:<ip>` (API rate limit counters, TTL: 1m)
  - `galaph:bullmq:*` (Asynchronous OCR receipt processing and notification queues)
- **Singleton Connection Management**: Import the shared client exclusively from `src/lib/redis.ts`. Never create ad-hoc `new Redis()` connections per request.
- **Mandatory TTLs**: Every write operation must include a concrete `EX` (seconds) or `PX` (milliseconds) expiration to prevent memory bloat on the shared instance.
- **Graceful Reconnection & Fallback**: Redis client is configured with `lazyConnect: true`, capped backoff (`Math.min(times * 100, 3000)`), and maximum 5 retries. If Redis is unavailable, the API falls back to PostgreSQL directly where applicable.
- **Process Teardown & Socket Hygiene**: Test suites and graceful shutdown hooks (`SIGTERM`/`SIGINT`) must always execute `redis.quit()` to ensure zero orphaned socket connections.
