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
