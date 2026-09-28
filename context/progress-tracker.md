# Progress Tracker — GalaPH

## Current Status: Unit 01 Complete (Monorepo Foundation & API Skeleton)

---

### Implementation Phases

| Phase                                         | Description                                                                              | Status      |
| :-------------------------------------------- | :--------------------------------------------------------------------------------------- | :---------- |
| **Unit 00: Specs & Architecture Blueprint**   | Context files, architectural invariants, Prisma schema, domain research                  | ✅ Complete |
| **Unit 01: Monorepo & Docker Setup**          | Workspaces setup, `@gala-ph/shared`, `apps/api` skeleton, `/health` probes, package-lock | ✅ Complete |
| **Unit 02: Database Models & Prisma**         | Prisma schema (Toll, Transit, Ledger, Bayanihan Packing, Weather Alerts) + Seed Data     | ⏳ Next     |
| **Unit 03: Auth & Trip Management**           | JWT Auth, Trip creation, Member roles (Driver, Commuter, Non-Drinker)                    | 📅 Planned  |
| **Unit 04: Toll & Fuel Engine**               | Autosweep vs Easytrip calculator, Class 1-3 toll matrices, Fuel estimator                | 📅 Planned  |
| **Unit 05: Commuter Transit & TODA Engine**   | Provincial transit router, TODA fare matrix, dialect negotiation tips                    | 📅 Planned  |
| **Unit 06: Itemized KKB Split Engine**        | Line-item consumption ledger, non-drinker exclusion, debt graph solver                   | 📅 Planned  |
| **Unit 07: Realtime Convoy & Packing Sync**   | WebSockets for live GPS convoy telemetry & Bayanihan packing checklist                   | 📅 Planned  |
| **Unit 08: Next.js App Shell & Theme**        | Next.js 15 App Router, Philippine nature/sunset design tokens                            | 📅 Planned  |
| **Unit 09: Interactive Trip Planner Map**     | Interactive Mapbox/Leaflet routing, dual-RFID card, PAGASA weather alert banner          | 📅 Planned  |
| **Unit 10: Itemized Bill Splitter UI**        | Bill splitter UI, avatar tagging, non-drinker toggles, GCash/Maya QR                     | 📅 Planned  |
| **Unit 11: Crowdsourced TODA Wiki UI**        | Community TODA tariff directory and provincial travel tips                               | 📅 Planned  |
| **Unit 12: Mobile Scaffold & Offline SQLite** | React Native (Expo) scaffold, offline SQLite (`expo-sqlite`), itinerary & expense queue  | 📅 Planned  |
| **Unit 13: Mobile Camera Receipt Scanner**    | Camera OCR line-item extraction and touch-to-tag eater assigning                         | 📅 Planned  |
| **Unit 14: Mobile Convoy HUD & SOS**          | Driver one-handed HUD mode, live convoy map, 1-tap SOS beacon                            | 📅 Planned  |
| **Unit 15: Automated Testing & CI/CD**        | GitHub Actions pipeline, Jest test suites, quality gate verification                     | 📅 Planned  |
| **Unit 16: UI/UX Ergonomics & Polish**        | High-glare contrast optimization, micro-interactions, 4-state UI loaders                 | 📅 Planned  |

---

### Recent Changes

- Scaffolded monorepo workspaces: `packages/shared`, `apps/api`, `apps/web`.
- Generated unified root `package-lock.json` with 100% clean `npm install`.
- Built `@gala-ph/shared` with exact integer centavo currency math, Philippine phone validation, and domain enums.
- Created Express API skeleton in `apps/api` with Zod env validation, correlation tracing, singleton Redis client (`src/lib/redis.ts`), and isolated `/health/live` & `/health/ready` probe endpoints.
- Documented and instituted Redis namespace invariant (`galaph:*`) for shared Redis environments.
- Configured local `.env` with Neon PostgreSQL pooler and Redis Cloud connection, wiring `REDIS_KEY_PREFIX="galaph:"` into `ioredis` to ensure complete key isolation from Incident Pulse.
- Formatted and verified all workspaces (100% Prettier, TypeScript strict check, ESLint, automated API tests passing).
- Unified mobile application architecture strictly onto **React Native (Expo)** with TypeScript to share `@gala-ph/shared` business logic and eliminate cross-language duplication.
