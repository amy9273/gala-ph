# Unit 12: Mobile Scaffold & Offline SQLite Engine — GalaPH

This specification details the architecture, local SQLite schema, outbox mutation queue, offline-first data sync engine, design tokens, and core screens for the GalaPH React Native (Expo) mobile application.

---

## 1. Scope & Deliverables

1. **Expo Mobile Scaffold (`apps/mobile`)**:
   - Expo managed workflow with TypeScript and React Native.
   - Monorepo package integration with `@gala-ph/shared` for integer centavo math, domain enums, and Philippine phone validation.
   - Root workspace registration in `package.json` (`apps/mobile`).

2. **Philippine Travel Design System (`src/theme/`)**:
   - Strict adherence to `context/ui-context.md`.
   - Semantic color tokens: `brandOcean` (`#0284C7`), `accentSunset` (`#EA580C`), `natureEmerald` (`#059669`), `autosweep` (`#D97706`), `easytrip` (`#0284C7`), `darkSurface` (`#111827`), `darkBackground` (`#090D16`).
   - One-handed thumb-zone bottom navigation and $48\text{dp} / 56\text{dp}$ touch targets.
   - 4-State UI Rule primitives (`<SkeletonLoader />`, `<EmptyState />`, `<ErrorState />`, `<Card />`, `<Badge />`, `<Button />`, `<NetworkStatusBar />`).

3. **Local SQLite Persistence Engine (`src/lib/sqlite/`)**:
   - `expo-sqlite` database manager with schema creation and migrations.
   - Tables:
     - `local_trips`: Trip details, invite codes, travel mode, and destination cache.
     - `local_itinerary_items`: Timeline stops, time slots, locations, and estimated costs.
     - `local_packing_items`: Bayanihan shared gear items, pack status, timestamps, and assignee.
     - `local_expenses`: Offline-logged expenses, categories, and totals in exact centavos.
     - `local_expense_items`: Line-item breakdown.
     - `local_expense_splits`: Itemized user debt allocations.
     - `outbox_mutations`: Idempotent offline mutation queue with status tracking (`PENDING`, `SYNCING`, `SYNCED`, `FAILED`).

4. **Offline Outbox Sync & Hydration Engine (`src/services/outbox-sync.service.ts`)**:
   - Optimistic UI updates with immediate local SQLite write.
   - Automatic background dispatching when network is restored.
   - Idempotency UUIDs preventing duplicate entries or split calculations on the backend.
   - In-memory database fallback for seamless testing and simulator environments.

5. **Mobile Screens & Navigation (`src/screens/`, `src/navigation/`)**:
   - `TripOverviewScreen`: Cached destination card, countdown, members roster, and offline badge.
   - `ItineraryScreen`: Offline itinerary timeline with day tabs, stop details, and add-stop modal.
   - `PackingScreen`: Bayanihan gear checklist with category chips, 1-tap optimistic toggle, and add-item modal.
   - `ExpensesScreen` & `QuickExpenseModal`: KKB bill logger with category picker, payer select, and non-drinker exclusion toggles.
   - `SyncQueueScreen`: Live outbox queue monitor showing queued mutations, retry triggers, and offline storage statistics.
   - `App.tsx`: Navigation container with bottom tab dock.

6. **Quality Gates**:
   - 100% Prettier formatting compliance.
   - 0 TypeScript errors across all workspaces (`npm run typecheck --workspaces`).
   - 0 ESLint warnings (`npm run lint`).
   - Clean Next.js web build (`npm run build:web`).
   - 76/76 passing automated backend test suite (`npm test`).
