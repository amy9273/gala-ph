# Unit 06: Itemized KKB Consumption Ledger & Debt Graph Solver — GalaPH

This specification details the granular line-item consumption model, non-drinker/allergy exclusion mechanics, proportional service charge and tax apportionment, and the greedy bilateral debt simplification graph algorithm for Philippine barkada trips.

---

## 1. Scope & Objectives

1. **Granular Line-Item Consumption Ledger (`LedgerService`)**:
   - Record expenses with itemized dishes/receipt lines (`ExpenseItem`), each with individual prices, quantities, and specific consumer mappings (`ItemConsumer`).
   - Categorize expenses using `ExpenseCategory` (`FOOD_AND_DINING`, `ALCOHOL_AND_BAR`, `TOLL_HIGHWAY`, `FUEL_AND_GAS`, etc.).
   - Support quick full-group splits as well as selective consumer splits.

2. **Non-Drinker & Dietary Exclusion Mechanics**:
   - Trip members flagged with `isNonDrinker: true` are automatically excluded from `ALCOHOL_AND_BAR` items when auto-splitting or default-tagging alcohol.
   - Tagging consumers by user ID ensures non-eaters or members with allergies do not pay for dishes they did not consume (e.g. seafood allergy, non-pork, non-drinker).

3. **Proportional Service Charge & Local Tax Apportionment**:
   - Philippine dining establishments routinely levy a 5%–10% Service Charge (SC) and 12% VAT/local taxes.
   - Instead of naive flat division, service charges and taxes must be apportioned **proportionally** according to each consumer's net food/drink subtotal:
     $$\text{Apportioned Fee}_i = \text{Total Service \& Tax} \times \left( \frac{\text{Subtotal}_i}{\text{Total Food Subtotal}} \right)$$
   - Remainder centavos are distributed fairly using integer centavo arithmetic so that $\sum \text{Splits} \equiv \text{Total Amount}$.

4. **Transit Expense Isolation**:
   - Fuel and toll expenses (`FUEL_AND_GAS`, `TOLL_HIGHWAY`) can be tied to a `vehicleIdOnly`.
   - Option to exempt the vehicle driver (`isDriver: true`) so carpool passengers share the fuel and toll fees as barkada etiquette.

5. **Greedy Debt Simplification Graph Solver (`DebtGraphSolver`)**:
   - Computes net balance in integer centavos for every trip participant:
     $$\text{NetBalance}_i = \text{TotalPaid}_i - \text{TotalOwed}_i$$
   - Partitions participants into **Creditors** ($\text{NetBalance} > 0$) and **Debtors** ($\text{NetBalance} < 0$).
   - Solves the minimum cash flow problem via greedy bilateral matching, collapsing $O(N^2)$ tangled peer-to-peer debts into at most $N-1$ clean settlement transactions.
   - Formats settlement payouts with pre-populated Philippine e-wallet destinations (GCash, Maya mobile numbers).

6. **REST API Endpoints**:
   - `POST /api/v1/trips/:id/expenses`: Create itemized expense with dishes, consumers, and auto-computed splits.
   - `GET /api/v1/trips/:id/expenses`: List all expenses with item and split details.
   - `GET /api/v1/trips/:id/expenses/:expenseId`: Get single expense with consumption breakdowns.
   - `GET /api/v1/trips/:id/ledger/balances`: Get current member net balances and ledger summaries.
   - `GET /api/v1/trips/:id/ledger/settlements`: Run debt graph simplification and return optimized transactions with GCash/Maya info.
   - `POST /api/v1/trips/:id/ledger/settle`: Settle a debt between two members.

7. **Automated Testing & Verification**:
   - Full integration test suite in `apps/api/src/__tests__/unit-06-kkb-ledger.test.ts`.

---

## 2. Invariants & Rules

1. **Exact Centavo Currency Math**:
   Every line item price, fee, tax, split, and debt balance must be computed in integer centavos to eliminate 64-bit IEEE-754 floating-point drift.
2. **Conservation of Money**:
   $$\sum_{i} \text{AmountOwed}_i \equiv \text{Expense.totalAmount}$$
   $$\sum_{i} \text{NetBalance}_i \equiv 0$$
3. **Atomic Persistence**:
   Expense creation and split generation must execute inside a Prisma interactive transaction (`prisma.$transaction`).
4. **Multi-Tenant Boundary Isolation**:
   Only verified members of the trip can view the ledger, log expenses, or record settlements.
