# Engineering Best Practices — GalaPH

## 1. Mathematical Accuracy & Currency Handling

- **Never use floating point numbers for currency**: Always store and compute currency amounts using exact integer centavos (e.g. ₱1,340.50 is represented as `134050` in logic, or `Decimal(10, 2)` in PostgreSQL).
- **Rounding Resolution Algorithm**: When distributing odd cents across $N$ members (e.g. ₱10.00 split 3 ways), distribute the remainder centavos starting from the largest consumer or primary payer to ensure $\sum \text{splits} \equiv \text{total}$.

---

## 2. API & Backend Best Practices

- **Idempotency Keys**: All financial transactions and split additions must accept an `x-idempotency-key` header to ensure retrying requests after mobile connection loss will never double-charge.
- **Atomic Transactions**: Multi-line item splits, debt settlements, and receipt imports must always be wrapped in Prisma `$transaction` blocks.
- **Fail-Safe Offline Reconciliation**: Sync queues from mobile clients must be processed in chronological sequence based on client monotonic timestamps, checking for existing transaction hashes before insertion.

---

## 3. Philippine Domain Specifics & Standards

- **RFID Formatting**: Display clear separation between **Autosweep** and **Easytrip** balances with distinct color coding (Autosweep: Yellow/Burgundy, Easytrip: Cyan/Blue).
- **Mobile Number Validation**: Support Philippine standard mobile formats (`+63 9XX XXX XXXX`, `09XX XXX XXXX`) with automatic normalization for GCash/Maya integrations.
- **TODA Matrix Display**: Always specify both **Special Trip Rate** (chartered tricycle for the group) vs. **Per-Head Rate** (shared commuter tricycle) to avoid miscommunication.

---

## 4. UI/UX Anti-Slop Guidelines

- Clean, fast-loading, high-contrast UI designed for outdoor glare on bright sunny beaches or night-shift driving.
- 1-tap quick actions for common operations (Add Quick Expense, Flash GCash QR, View Offline Toll Breakdown).
- No unnecessary spinners: optimistic UI updates with background synchronization for all ledger operations.

---

## 5. Shared Redis Infrastructure & Key Namespacing

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
