# Progress Tracker — GalaPH

## Current Status: Unit 18 Complete (Mobile UI/UX & Brand System Redesign)

---

### Implementation Phases

| Phase                                         | Description                                                                              | Status      |
| :-------------------------------------------- | :--------------------------------------------------------------------------------------- | :---------- |
| **Unit 00: Specs & Architecture Blueprint**   | Context files, architectural invariants, Prisma schema, domain research                  | ✅ Complete |
| **Unit 01: Monorepo & Docker Setup**          | Workspaces setup, `@gala-ph/shared`, `apps/api` skeleton, `/health` probes, package-lock | ✅ Complete |
| **Unit 02: Database Models & Prisma**         | Prisma schema (Toll, Transit, Ledger, Bayanihan Packing, Weather Alerts) + Seed Data     | ✅ Complete |
| **Unit 03: Auth & Trip Management**           | JWT Auth, Trip creation, Member roles (Driver, Commuter, Non-Drinker)                    | ✅ Complete |
| **Unit 04: Toll & Fuel Engine**               | Autosweep vs Easytrip calculator, Class 1-3 toll matrices, Fuel estimator                | ✅ Complete |
| **Unit 05: Commuter Transit & TODA Engine**   | Provincial transit router, TODA fare matrix, dialect negotiation tips                    | ✅ Complete |
| **Unit 06: Itemized KKB Split Engine**        | Line-item consumption ledger, non-drinker exclusion, debt graph solver                   | ✅ Complete |
| **Unit 07: Realtime Convoy & Packing Sync**   | WebSockets for live GPS convoy telemetry & Bayanihan packing checklist                   | ✅ Complete |
| **Unit 08: Next.js App Shell & Theme**        | Next.js 15 App Router, Philippine nature/sunset design tokens                            | ✅ Complete |
| **Unit 09: Interactive Trip Planner Map**     | Interactive routing, dual-RFID card, PAGASA weather alert banner, trip planner           | ✅ Complete |
| **Unit 10: Itemized Bill Splitter UI**        | Bill splitter UI, avatar tagging, non-drinker toggles, GCash/Maya QR                     | ✅ Complete |
| **Unit 11: Crowdsourced TODA Wiki UI**        | Community TODA tariff directory and provincial travel tips                               | ✅ Complete |
| **Unit 12: Mobile Scaffold & Offline SQLite** | React Native (Expo) scaffold, offline SQLite (`expo-sqlite`), itinerary & expense queue  | ✅ Complete |
| **Unit 13: Mobile Camera Receipt Scanner**    | Camera OCR line-item extraction and touch-to-tag eater assigning                         | ✅ Complete |
| **Unit 14: Mobile Convoy HUD & SOS**          | Driver one-handed HUD mode, live convoy map, 1-tap SOS beacon                            | ✅ Complete |
| **Unit 15: Automated Testing & CI/CD**        | GitHub Actions pipeline, Jest/node test suites, quality gate verification                | ✅ Complete |
| **Unit 16: UI/UX Ergonomics & Polish**        | High-glare contrast optimization, micro-interactions, 4-state UI loaders                 | ✅ Complete |
| **Unit 17: Clean Architecture & Hardening**   | Anti-N+1 batching, transactional atomicity, PII masking, shared debt solver, pagination  | ✅ Complete |
| **Unit 18: Mobile UI/UX & Brand Redesign**    | Sunset Terracotta palette, Material 3 / HIG 4-tab navigation, vector icons, no emojis    | ✅ Complete |

---

### Recent Changes

- Implemented **Unit 18 (Mobile UI/UX & Brand System Redesign)**:
  - Conducted deep research on travel app color psychology (Airbnb, Wanderlog, Klook, Polarsteps) and Philippine road trip culture, transitioning the brand identity from cold cyber-blue (`#00C2A8`, `#0284C7`, `#090D16`) to **Sunset Terracotta (`#FF5A36`)**, **Tropical Sun Gold (`#F59E0B`)**, and **Warm Obsidian (`#121316`)** surfaces.
  - Enforced Apple HIG and Google Material Design 3 mobile navigation standards: built the balanced 4-tab bar (`Trip`, `Itinerary`, `Packing`, `KKB Ledger`) anchored by an **Elevated Center Action Dock (FAB `(+)`)** floating with Sunset Terracotta glow, opening a fast-track **Quick Action Sheet** (Receipt OCR, Add Stop, Add Gear, New Trip).
  - Purged all raw Unicode emojis across navigation, action cards, headers, and badges, replacing them with crisp, unified vector icons from `@expo/vector-icons` (`Ionicons`).
  - Formulated comprehensive **Trip Lifecycle & Shared Logistics UX Research** (`context/research/trip-lifecycle-and-shared-ux-research.md` and `context/research/ui-ux-brand-research.md`), dismantling the "Jira-fication" of travel apps and establishing the **Radically Simplified 3-Card Architecture**: 1. Trip Hero (Where & When + 1-tap Messenger share), 2. Barkada & Quick Split (Who & Money + 1-tap scan), 3. Shared Essentials (1-tap "Claim It" checklist).
  - Built comprehensive **Trip Lifecycle Management**: implemented **Add Trip** (`+ New Gala`), **Edit Trip Details** (`[✏️ Edit Trip]`), and **Trip Switcher Dropdown** directly in `TripOverviewScreen.tsx`, persisting atomically to local SQLite (`local_trips`).
  - Streamlined `apps/mobile/src/screens/TripOverviewScreen.tsx`, eliminating 800+ lines of administrative stepper and modal bloat to deliver a glanceable 3-card view fitting entirely on a single screen without vertical fatigue.
  - Implemented frictionless **"Claim It"** gear flow in `apps/mobile/src/screens/PackingScreen.tsx` (`[✋ Tap to Claim]` automatically claiming items for the user, plus an ultra-simple 1-field Add Gear modal).
  - Removed convoy radar/HUD from the foreground navigation to keep the UX laser-focused on the actual core problem: trip coordinates, KKB receipt splitting, and gear coordination.
  - Transitioned mobile canvas theme from dark obsidian to sunlit outdoor light mode (`Slate-50` `#F8FAFC`, `Card White` `#FFFFFF`, crisp text `#0F172A`) with high-glare WCAG AAA contrast and subtle ambient elevation.
  - Verified full quality check loop: 100% Prettier formatting (`npm run format:check`), 0 type errors across all 4 workspaces (`npm run typecheck --workspaces`), 0 ESLint errors (`npm run lint`), clean Metro export on Android and iOS (`npx expo export --no-bytecode`), and 122/122 tests passing monorepo-wide (`npm test`).
  - Formulated and instituted universal software engineering best practices in `context/engineering-best-practices.md` (Code Readability, Clean Architecture, Defensive Error Handling, Query Hygiene, Security/PII, and Testing Standards).
  - Configured Pino logger PII & secret redaction in `apps/api/src/lib/logger.ts` (`password`, `token`, `phone`, `gcashNumber`, `mayaNumber`).
  - Standardized API error responses across `apps/api/src/middlewares/error.middleware.ts` with uniform `{ success: false, error: { code, message, correlationId, details } }` contract.
  - Eliminated N+1 sequential database toll queries in `TollService.calculateRouteToll`, replacing them with batched plaza resolution (`batchResolvePlazaFees`) in a single query with bidirectional symmetry.
  - Enforced atomic transaction boundary (`prisma.$transaction`) on `TransitService.attachTransitLegsToTrip` and bounded TODA tariff queries with `take` constraints.
  - Added bounded memory pagination (`take`, `skip`, `page`, `limit`) to `TripService.getUserTrips` and wired into `TripController`.
  - Extracted pure greedy debt graph solver into `@gala-ph/shared/src/ledger.ts` (`solveGreedyDebtGraph`) and refactored both `LedgerService` and Next.js web client (`apps/web/src/lib/api.ts`) to eliminate duplicated logic.
  - Resolved Expo monorepo Metro resolution with `apps/mobile/metro.config.js` and removed invalid `expo-sqlite` config plugin from `app.json`.
  - Created automated test suites in `packages/shared/src/__tests__/ledger-solver.test.ts` and `apps/api/src/__tests__/unit-17-hardening.test.ts` (122/122 tests passing monorepo-wide).

- Scaffolded monorepo workspaces: `packages/shared`, `apps/api`, `apps/web`.
- Generated unified root `package-lock.json` with 100% clean `npm install`.
- Built `@gala-ph/shared` with exact integer centavo currency math, Philippine phone validation, and domain enums.
- Created Express API skeleton in `apps/api` with Zod env validation, correlation tracing, singleton Redis client (`src/lib/redis.ts`), and isolated `/health/live` & `/health/ready` probe endpoints.
- Documented and instituted Redis namespace invariant (`galaph:*`) for shared Redis environments.
- Configured local `.env` with Neon PostgreSQL pooler and Redis Cloud connection, wiring `REDIS_KEY_PREFIX="galaph:"` into `ioredis` to ensure complete key isolation from Incident Pulse.
- Formatted and verified all workspaces (100% Prettier, TypeScript strict check, ESLint, automated API tests passing).
- Unified mobile application architecture strictly onto **React Native (Expo)** with TypeScript to share `@gala-ph/shared` business logic and eliminate cross-language duplication.
- Implemented **Unit 02 (Database Models & Prisma)**:
  - Designed full Philippine travel Prisma schema in `apps/api/prisma/schema.prisma` with 14 relational models.
  - Implemented singleton Prisma client in `apps/api/src/lib/prisma.ts` with graceful process and test teardown.
  - Integrated live PostgreSQL connectivity check (`prisma.$queryRaw`) into `/health/ready` probe.
  - Created comprehensive seed data in `apps/api/prisma/seed.ts` with 24 expressway toll segments (NLEX, SCTEX, TPLEX, Skyway 3, SLEX, CALAX, CAVITEX, MCX, CCLEX), 3 major provincial bus hubs (PITX, Cubao, Buendia) with 9 routes, and demo trip _"Elyu Surf & Chill Weekend"_ with Bayanihan packing items, PAGASA weather alert, and itemized KKB dinner expense with non-drinker exclusion.
  - Pushed schema to live Neon PostgreSQL database and verified all 15 automated unit tests pass.
  - Resolved CI `test-api` quality gate by defining `db:migrate:test` script (`prisma db push --accept-data-loss && tsx prisma/seed.ts`) in `apps/api/package.json` and monorepo root, ensuring CI ephemeral PostgreSQL container is migrated and seeded before test execution.
- Implemented **Unit 03 (Auth & Trip Management Engine)**:
  - Added `passwordHash` to `User` model in `apps/api/prisma/schema.prisma` and re-seeded demo users with bcrypt passwords (`P@ssword123!`).
  - Implemented secure password hashing (`apps/api/src/lib/password.ts`) and JWT signing & verification (`apps/api/src/lib/jwt.ts`).
  - Built `authMiddleware` with Bearer token authentication and user hydration.
  - Built Zod validation schemas for auth registration, login, trip creation, invite code joins, and member preference updates.
  - Built `AuthService`, `TripService`, `AuthController`, and `TripController` with custom error hierarchy (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`).
  - Added auto-generation of unique, uppercase barkada invite codes (e.g. `ELYU-XXXX`).
  - Enforced atomic transaction on trip creation, granting trip creators the `TRIP_LEAD` role automatically.
  - Implemented member role promotions and preference management (`isDriver`, `vehicleId`, `isNonDrinker`, `dietaryNotes`) with lead and self authorization guards.
  - Enforced multi-tenant trip boundary protection (403 Forbidden for non-members).
  - Created 18 automated integration tests in `apps/api/src/__tests__/unit-03-auth-trip.test.ts` (33/33 tests passing monorepo-wide).
- Implemented **Unit 04 (Philippine Expressway Dual-RFID Toll & Fuel Engine)**:
  - Built `TollService` with bidirectional symmetrical plaza resolution across NLEX, SCTEX, TPLEX, Skyway 3, SLEX, CALAX, CAVITEX, MCX, CCLEX.
  - Implemented Dual-RFID Account Isolation: aggregates fees strictly by provider (`AUTOSWEEP` vs `EASYTRIP`), computing exact centavos and rounded Philippine peso reload buffers (nearest ₱50).
  - Configured 5 preset Philippine road trip routes (`MANILA_TO_LA_UNION`, `MANILA_TO_BAGUIO`, `MANILA_TO_BATANGAS_PORT`, `MANILA_TO_TAGAYTAY`, `MANILA_TO_SUBIC`).
  - Implemented vehicle class fee multipliers (Class 1 sedans/SUVs, Class 2 vans/coasters, Class 3 heavy freight).
  - Built Philippine Fuel Consumption Estimator (`FuelService`) with vehicle economy presets (`SEDAN_1_5L`, `SUV_DIESEL_2_8L`, `COMMUTER_VAN`, `MOTORCYCLE_150CC`, `CUSTOM`) and exact centavo fuel math.
  - Integrated toll estimation with trip vehicle tagging (`POST /api/v1/trips/:id/toll-estimates`) with member authorization checks and `vehicleId` grouping.
  - Created 9 automated integration tests in `apps/api/src/__tests__/unit-04-toll-fuel.test.ts` (42/42 tests passing monorepo-wide).
- Implemented **Unit 05 (Commuter Transit Router & TODA Tariff Engine)**:
  - Designed and added `TodaTariff` model to `apps/api/prisma/schema.prisma` with provincial municipality, route, special trip fare, night differential, last trip curfew, and localized dialect tips.
  - Seeded official TODA tariffs across top Philippine barkada destinations (San Juan La Union, Batangas Wawa Port, Baler Aurora, Moalboal Cebu, Panglao Bohol) with dialect tips (Ilocano, Batangueño, Cebuano).
  - Built `TransitService` for provincial transit hub lookups, GTFS-style bus route searches, and TODA tariff queries.
  - Implemented end-to-end multi-leg commuter itinerary planner (`/api/v1/transit/plan-commute`) combining Metro Manila terminal bus legs with first-mile / last-mile TODA tricycle legs, computing per-head and total group fares, curfew advisories, and dialect negotiation tips.
  - Added trip integration endpoint (`POST /api/v1/trips/:id/transit-legs`) with member authorization check to persist commuter itineraries as `TransitLeg` entities.
  - Created 8 automated integration tests in `apps/api/src/__tests__/unit-05-transit-toda.test.ts` (50/50 tests passing monorepo-wide).
- Implemented **Unit 06 (Itemized KKB Consumption Ledger & Debt Graph Solver)**:
  - Added `Settlement` model in `apps/api/prisma/schema.prisma` linking payers, recipients, payment methods, and trips.
  - Built `LedgerService` supporting line-item expenses with individual dish prices, quantities, and selective consumer mappings.
  - Implemented automatic non-drinker exclusion (`isNonDrinker`) for `ALCOHOL_AND_BAR` items and carpool driver exemption (`isDriver`) for vehicle toll/fuel expenses.
  - Implemented exact proportional service charge (SC) and local tax apportionment based on each consumer's net food subtotal with fair integer remainder centavo distribution.
  - Built greedy bilateral debt simplification graph solver (`/api/v1/trips/:id/ledger/settlements`), collapsing $O(N^2)$ bilateral debts into at most $N-1$ direct settlements with pre-populated GCash and Maya recipient payloads.
  - Added peer-to-peer settlement endpoint (`POST /api/v1/trips/:id/ledger/settle`) updating live net balance tracking with strict conservation of money ($\sum \text{NetBalance} \equiv 0$).
  - Created 9 automated integration tests in `apps/api/src/__tests__/unit-06-kkb-ledger.test.ts` (59/59 tests passing monorepo-wide).
- Implemented **Unit 07 (Realtime Convoy & Packing Sync)**:
  - Built `PackingService` and `PackingController` supporting Bayanihan shared gear checklists, assignable trip members, category categorization (`GEAR`, `FOOD_DRINKS`, `MEDICAL`, `COMFORT`, `DOCUMENTS`, `MISCELLANEOUS`), quantity tracking, and 1-tap packed/unpacked state toggling with timestamps and progress metrics (`GET/POST/PATCH/DELETE /api/v1/trips/:id/packing`).
  - Added Haversine great-circle distance calculators (`calculateHaversineDistanceKm`, `calculateHaversineDistanceMeters`), convoy telemetry schemas, and SOS alert data types in `@gala-ph/shared`.
  - Built `ConvoyService` and `ConvoyController` for live GPS beacon streaming with ephemeral 60s Redis storage (`galaph:convoy:beacon:<tripId>:<userId>`), in-memory fallback, multi-vehicle spread computation, and automated straggler advisories when convoy vehicles separate $> 5\text{km}$.
  - Implemented emergency roadside SOS beacon broadcast and resolution workflow (`POST /api/v1/trips/:id/convoy/sos` and `POST /api/v1/trips/:id/convoy/sos/resolve`) stored with 24h TTL in Redis (`galaph:convoy:sos:<tripId>:<alertId>`).
  - Built native WebSocket Hub (`apps/api/src/sockets/socket.server.ts`) with JWT handshake authentication, dynamic trip room subscriptions (`JOIN_TRIP`/`LEAVE_TRIP`), 30s heartbeat monitoring, and real-time event broadcasting (`PACKING_ITEM_ADDED`, `PACKING_ITEM_UPDATED`, `PACKING_ITEM_TOGGLED`, `PACKING_ITEM_DELETED`, `CONVOY_LOCATION_UPDATE`, `CONVOY_STRAGGLER_ALERT`, `CONVOY_SOS_ALERT`, `CONVOY_SOS_RESOLVED`).
  - Created 17 automated integration tests in `apps/api/src/__tests__/unit-07-convoy-packing.test.ts` (76/76 tests passing monorepo-wide).
- Implemented **Unit 08 (Next.js App Shell & Theme)**:
  - Configured Tailwind CSS (`tailwind.config.ts`, `postcss.config.js`) and CSS variables in `apps/web/src/app/globals.css` with exact Philippine nature and sunset travel design tokens (`--brand-ocean`, `--accent-sunset`, `--nature-emerald`, `--travel-autosweep`, `--travel-easytrip`).
  - Implemented dynamic Dark and Light theme switching via `next-themes` with seamless transitions and `<ThemeToggle />` component.
  - Built responsive glassmorphism navigation header (`<Navbar />`) and footer (`<Footer />`) with mobile drawer navigation, active route highlights, barkada invite code input, and Philippine travel links.
  - Built foundational UI component primitives in `apps/web/src/components/ui/` (`<Button>`, `<Badge>`, `<Card>`, `<Skeleton>` for 4-state UI loading compliance).
  - Designed rich interactive Bento Grid travel OS hero dashboard (`apps/web/src/app/page.tsx`) showcasing Dual-RFID Toll Calculator preview, Live Convoy Radar, Itemized KKB Ledger with non-drinker protection, and Commuter Transit & TODA Directory.
  - Configured Google font optimization (`next/font/google` with Plus Jakarta Sans & Inter) and verified clean Next.js static production build.
- Implemented **Unit 09 (Interactive Trip Planner Map & Dual-RFID Breakdown)**:
  - Created Unit 09 specification in `context/specs/09-interactive-trip-planner-map.md`.
  - Built Philippine Road Trip API & client library (`apps/web/src/lib/api.ts`) with preset corridors (La Union, Baguio, Batangas Port, Tagaytay, Subic), engine fuel economy presets (Sedan, Diesel SUV, Commuter Van, Motorcycle), and local toll breakdown math with ₱50 reload buffer rounding.
  - Built standalone Dual-RFID Expressway Toll Calculator page (`/toll-calculator` and `apps/web/src/components/toll/toll-breakdown-card.tsx`) with Autosweep vs. Easytrip matrix isolation, vehicle class toggle (Class 1-3), plaza segment lists, and fuel estimation.
  - Built interactive route visualizer (`<RouteMap />` in `apps/web/src/components/map/route-map.tsx`) with waypoint milestones, toll provider tags, live beacon animation, and plaza detail cards.
  - Built DOST-PAGASA real-time Tropical Cyclone & Gale Advisory banner (`<WeatherAlertBanner />` in `apps/web/src/components/weather/weather-alert-banner.tsx`) with severity-coded alerts (`LOW`, `MODERATE`, `CRITICAL`), typhoon wind signals, and mountainous highway landslide alerts.
  - Built Barkada Trips directory (`/trips` and `apps/web/src/components/trips/trip-card.tsx`) with invite code quick-join bar, 4-state UI skeletons, and `<CreateTripModal />`.
  - Built full Trip Planner detail page (`/trips/[id]`) integrating Route Map, Dual-RFID breakdown, Itinerary Timeline accordion (`<ItineraryTimeline />`), PAGASA alert banner, barkada roster, and quick navigation actions to KKB Ledger, Live Convoy, and Transit Guide.
  - Formatted and verified all workspaces (100% Prettier compliance, 0 ESLint warnings/errors, TypeScript strict pass across monorepo, Next.js static build pass, 76/76 passing automated tests).
- Implemented **Unit 10 (Itemized Bill Splitter UI & Debt Settlement Hub)**:
  - Created Unit 10 specification in `context/specs/10-itemized-bill-splitter-and-ledger-ui.md`.
  - Expanded web client API models (`apps/web/src/lib/api.ts`) with `Expense`, `ExpenseItem`, `ExpenseSplit`, `MemberBalance`, `DebtSettlement`, integer centavo math, proportional SC/tax calculations (`calculateItemizedSplits`), and greedy debt graph solver (`solveDebtGraph`).
  - Built `<ExpenseSplitCard />` in `apps/web/src/components/ledger/expense-split-card.tsx` with expandable itemized receipt lines, tagged consumer avatars, category badges, and per-person split chips.
  - Built `<CreateExpenseModal />` in `apps/web/src/components/ledger/create-expense-modal.tsx` supporting multi-dish receipts, interactive eater avatar selection, 1-click presets ("Drinkers Only" excluding non-drinkers, "Passengers Only" exempting drivers), service charge (SC %) and tax (%) sliders, and live per-person calculation previews.
  - Built `<DebtSettlementCard />` in `apps/web/src/components/ledger/debt-settlement-card.tsx` rendering participant net balances (Creditors in Nature Emerald, Debtors in Coral) and collapsed bilateral debt transfers ($O(N^2) \to \le N-1$).
  - Built `<QRPaymentModal />` in `apps/web/src/components/ledger/qr-payment-modal.tsx` with Philippine QR Ph vector generator, GCash and Maya number copy toggles, and payment reference code formatting.
  - Built `<TripLedgerView />` in `apps/web/src/components/ledger/trip-ledger-view.tsx` with spend metrics bento, category filters, expense feed, and debt settlement hub.
  - Built standalone KKB Master Ledger page (`/ledger` in `apps/web/src/app/ledger/page.tsx`) and integrated direct KKB Ledger tab inside the trip planner detail page (`/trips/[id]`).
  - Verified full quality checks: 100% Prettier formatting (`npm run format:check`), 0 type errors across monorepo workspaces (`npm run typecheck --workspaces`), 0 ESLint errors (`npm run lint`), Next.js static build pass (`npm run build:web`), and 76/76 passing automated tests.
- Implemented **Unit 11 (Crowdsourced TODA Wiki UI & Provincial Travel Directory)**:
  - Created Unit 11 specification in `context/specs/11-crowdsourced-toda-wiki-ui.md`.
  - Added seed TODA route tariffs across San Juan Elyu, Nasugbu Batangas, Baler Aurora, Moalboal Cebu, Panglao Bohol, and Baguio City with dialect bargaining cheat sheets and environmental fees.
  - Built `<TodaTariffCard />`, `<CommutePlannerCard />`, `<DialectCheatSheet />`, `<SubmitTariffModal />`, and `/transit` hub page.
- Implemented **Unit 12 (Mobile Scaffold & Offline SQLite Persistence Engine)**:
  - Created Unit 12 specification in `context/specs/12-mobile-scaffold-offline-sqlite.md`.
  - Configured `@gala-ph/mobile` workspace using React Native and Expo with TypeScript, sharing `@gala-ph/shared` business logic and exact integer centavo currency math.
  - Built Philippine Travel Mobile Design System (`apps/mobile/src/theme/`) with semantic colors (`brandOcean`, `accentSunset`, `natureEmerald`, `autosweep`, `easytrip`, `darkBackground` obsidian) and $48\text{dp} / 56\text{dp}$ touch targets.
  - Implemented the mandatory 4-state UI rule primitives (`<SkeletonLoader />`, `<EmptyState />`, `<ErrorState />`, `<Badge />`, `<Button />`, `<Card />`, `<CurrencyDisplay />`, `<NetworkStatusBar />`).
  - Built offline-first SQLite database client (`apps/mobile/src/lib/sqlite/db.ts`, `schema.ts`) and repository layer for trips, itinerary timeline, Bayanihan packing items, and KKB expenses.
  - Built `OutboxSyncService` (`apps/mobile/src/services/outbox-sync.service.ts`) with idempotent mutation queueing (`outbox_mutations`), optimistic UI state transitions, and background cache hydration.
  - Built mobile feature screens: `TripOverviewScreen`, `ItineraryScreen`, `PackingScreen` with 1-tap check-off, `ExpensesScreen` with non-drinker exclusion toggles, and `SyncQueueScreen` outbox monitor.
  - Added bottom tab navigation dock (`<BottomTabBar />`) optimized for one-handed road trip thumb ergonomics.
  - Implemented **Unit 13 (Mobile Camera Receipt Scanner & Touch-to-Tag Splitter)**:
  - Created Unit 13 specification in `context/specs/13-mobile-camera-receipt-scanner.md`.
  - Built Philippine dining receipt OCR parser (`ReceiptOcrService` in `apps/mobile/src/services/receipt-ocr.service.ts`) extracting merchant name, dates, line items, quantities, unit prices, subtotal, service charges (SC), and taxes with exact integer centavo math.
  - Implemented alcohol keyword detector heuristics (`BEER`, `SAN MIGUEL`, `RED HORSE`, `GIN`, `RUM`, `COCKTAIL`, `TEQUILA`, `VODKA`, `WHISKEY`, `WINE`, `SOJU`, `RH`, `SMB`) to flag alcoholic items for non-drinker protection.
  - Built `<LineItemAssigner />` (`apps/mobile/src/components/receipt/LineItemAssigner.tsx`) with touch-to-tag eater avatar chips, alcohol tags, and 1-tap quick action presets ("Select All", "Drinkers Only" excluding non-drinkers, "Clear All").
  - Built `<ReceiptSplitPreview />` (`apps/mobile/src/components/receipt/ReceiptSplitPreview.tsx`) displaying real-time proportional service charge and tax distribution with 100% mathematical conservation of money ($\sum \text{splits} \equiv \text{total}$).
  - Built `<ReceiptReviewModal />` (`apps/mobile/src/components/receipt/ReceiptReviewModal.tsx`) with merchant name editing, line-item price adjustments, payer selection, and 1-tap optimistic SQLite persistence via `ExpenseRepository` and `OutboxSyncService`.
  - Built camera viewfinder screen (`ReceiptScannerScreen.tsx` in `apps/mobile/src/screens/ReceiptScannerScreen.tsx`) with frame overlay guide, torch toggle, $56\text{dp}$ shutter button, and sample Philippine receipt presets (Tagpuan San Juan, Kahuna Beach Resort, Baler Surfside Grill).
  - Integrated `scanner` tab into `BottomTabBar.tsx` and main navigation container in `apps/mobile/src/App.tsx`.
  - Created automated test suite (`apps/mobile/src/__tests__/receipt-ocr-scanner.test.ts`) validating OCR line-item extraction, alcohol tagging, non-drinker exemption, proportional SC/tax distribution, and SQLite outbox mutation enqueueing.
  - Verified full quality check loop: 100% Prettier formatting (`npm run format:check`), 0 type errors across all 4 workspaces (`npm run typecheck --workspaces`), 0 ESLint errors (`npm run lint`), Next.js static build pass (`npm run build:web`), and 84/84 passing tests (`npm test`).
- Implemented **Unit 14 (Mobile Convoy HUD, Radar & Roadside SOS Engine)**:
  - Created Unit 14 specification in `context/specs/14-mobile-convoy-hud-and-sos.md`.
  - Built `ConvoyService` (`apps/mobile/src/services/convoy.service.ts`) managing high-frequency GPS telemetry, Haversine distance computations, 16-point cardinal compass conversions, and automatic straggler detection ($> 5.0\text{km}$ separation threshold).
  - Built `<ConvoySpeedometer />` (`apps/mobile/src/components/convoy/ConvoySpeedometer.tsx`) featuring high-glare in-car ergonomics, $76\text{dp}$ velocity typography, speed limit pills, compass heading readouts, and pairwise distance to lead & trailing cars.
  - Built `<ConvoyRadarView />` (`apps/mobile/src/components/convoy/ConvoyRadarView.tsx`) with spatial northbound corridor track, inter-vehicle distance links, and straggler warning badges.
  - Built `<VehicleRosterCard />` (`apps/mobile/src/components/convoy/VehicleRosterCard.tsx`) displaying driver contacts, vehicle models, live speed, battery levels, and 1-tap driver call triggers.
  - Built `<QuickDriverStatusDock />` (`apps/mobile/src/components/convoy/QuickDriverStatusDock.tsx`) for one-handed thumb interaction with quick driver status toggles (Cruising, Gas Stop, Restroom, Stopping) and emergency SOS trigger.
  - Built `<RoadsideSosModal />` (`apps/mobile/src/components/convoy/RoadsideSosModal.tsx`) with 7 Philippine roadside emergency categories (Flat tire, overheat, accident, checkpoint, medical, lost route, general breakdown), 3-second safety countdown, location coordinate readouts, and offline SQLite outbox persistence.
  - Built `<ActiveSosEmergencyBanner />` (`apps/mobile/src/components/convoy/ActiveSosEmergencyBanner.tsx`) rendering persistent high-priority emergency alerts with victim info and direct phone dial actions.
  - Built `ConvoyHudScreen` (`apps/mobile/src/screens/ConvoyHudScreen.tsx`) integrating HUD Mode, Radar Mode, live simulated drive engine, and straggler advisory alerts.
  - Added `convoy` tab to `BottomTabBar.tsx` (🚗 Convoy) and wired into main navigation in `apps/mobile/src/App.tsx`.
  - Created automated test suite (`apps/mobile/src/__tests__/convoy-hud-sos.test.ts`) validating compass math, speed categories, straggler detection, driver status outbox sync, and SOS alert dispatch/resolution lifecycle.
  - Verified full quality check loop: 100% Prettier formatting (`npm run format:check`), 0 type errors across all 4 workspaces (`npm run typecheck --workspaces`), 0 ESLint errors (`npm run lint`), Next.js static build pass (`npm run build:web`), and 91/91 passing tests (`npm test`).
- Implemented **Unit 15 (Automated Testing & CI/CD Pipeline)**:
  - Created Unit 15 specification in `context/specs/15-automated-testing-and-ci-cd.md`.
  - Built comprehensive shared package unit test suite (`packages/shared/src/__tests__/shared-domain.test.ts`) validating exact integer centavo currency arithmetic, odd remainder split conservation ($\sum \text{splits} \equiv \text{total}$), Philippine phone number normalization/E.164 parsing, Haversine formula distance calculations, and runtime Zod validation contracts (12/12 passing).
  - Built web client logic & ledger math test suite (`apps/web/src/__tests__/web-logic.test.ts`) validating Dual-RFID toll breakdowns (Autosweep vs Easytrip), ₱50 reload buffer rounding, Class 1-3 vehicle multipliers, fuel economy presets, proportional service charge & tax distribution, greedy bilateral debt simplification ($O(N^2) \to \le N-1$), and Tailwind styling helpers (6/6 passing).
  - Added dedicated test scripts across all workspace `package.json` configurations and root `package.json` (`test:shared`, `test:api`, `test:mobile`, `test:web`).
  - Upgraded GitHub Actions CI/CD workflow (`.github/workflows/ci.yml`) with parallel matrix execution: Monorepo linting & formatting, strict TypeScript typechecking across workspaces, shared package tests, API integration tests with live PostgreSQL 16 & Redis 7 services, mobile SQLite & telemetry tests, web logic tests, Next.js static production build, and unified completion gate (`ci-success`).
  - Successfully verified full 109-test monorepo test suite across all 4 workspaces (`@gala-ph/shared`, `apps/api`, `apps/mobile`, `apps/web`) with 100% pass rate, 0 type errors, 0 ESLint errors, and clean Prettier formatting.
- Implemented **Unit 16 (UI/UX Ergonomics & Polish)**:
  - Created Unit 16 specification in `context/specs/16-ui-ux-ergonomics-polish.md`.
  - Built Web Toast notification system (`apps/web/src/components/ui/toast.tsx` and `apps/web/src/components/ui/use-toast.ts`) with custom semantic variants (`default`, `success`, `destructive`, `sunset`, `info`), micro-animations, Lucide status icons, and screen-reader accessibility.
  - Built web 4-state UI primitives (`<EmptyState />`, `<ErrorState />`, `<Skeleton />`) ensuring consistent loading, empty, error, and populated views across all pages.
  - Connected interactive toast feedback across key user workflows: copying barkada invite code, copying payment reference numbers & GCash/Maya mobile numbers, attaching expressway toll calculations to trip ledger, logging itemized expenses, and submitting community TODA tariffs.
  - Verified high-glare sunlight contrast compliance (WCAG AAA $\ge 7:1$) on monetary values, route timelines, and mobile in-car speedometer HUD elements.
  - Created automated test suite (`apps/web/src/__tests__/ui-ergonomics.test.ts`) validating toast state machine, 4-state screen resolution contracts, and minimum $48\text{dp} / 56\text{dp}$ touch target compliance (4/4 passing).
  - Verified complete monorepo quality loop: 100% Prettier formatting (`npm run format:check`), 0 type errors across all 4 workspaces (`npm run typecheck --workspaces`), 0 ESLint errors (`npm run lint`), Next.js static build pass (`npm run build:web`), and 113/113 passing automated tests (`npm test`).
