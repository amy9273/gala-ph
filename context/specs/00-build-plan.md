# Build Plan & Implementation Specs — GalaPH

This document outlines the sequential, unit-by-unit engineering plan for the GalaPH platform.

---

## Unit Specifications Breakdown

| Unit | Title | Scope & Deliverables |
| :--- | :--- | :--- |
| **Unit 00** | `00-build-plan.md` | Master plan and execution sequence. |
| **Unit 01** | `01-monorepo-docker-setup.md` | Monorepo scaffolding, Docker compose (`postgres:16`, `redis:7`), tsconfig base, scripts. |
| **Unit 02** | `02-database-models-prisma.md` | Prisma schema for Philippine travel, multi-modal transit legs, toll plazas, granular consumption ledger, and seed data (Expressway toll matrix & provincial bus hubs). |
| **Unit 03** | `03-auth-and-trip-management.md` | User authentication, JWT sessions, trip creation, invite codes, role assignments (Driver, Commuter, Non-Drinker). |
| **Unit 04** | `04-toll-and-fuel-engine.md` | Philippine Expressway dual-RFID calculation engine (Autosweep vs. Easytrip) + vehicle class toll tables + fuel consumption estimator. |
| **Unit 05** | `05-commuter-transit-and-toda-engine.md` | Multi-leg provincial transit router (PITX/Cubao/Pasay $\to$ provincial bus $\to$ local jeep/TODA trike) + verified local fare matrix and dialect negotiation guide. |
| **Unit 06** | `06-itemized-kkb-split-engine.md` | Granular line-item consumption model, tax/service charge proportional apportionment, and greedy debt simplification graph solver. |
| **Unit 07** | `07-realtime-convoy-telemetry.md` | WebSockets engine for live GPS convoy beaconing, geofencing proximity alerts, and live catch-up ETA synchronization. |
| **Unit 08** | `08-nextjs-app-shell-and-theme.md` | Next.js 15 App Router setup, Philippine nature/sunset design tokens (`ui-context.md`), responsive navigation bar, and dark/light mode toggling. |
| **Unit 09** | `09-interactive-trip-planner-map.md` | Web interactive trip planner with Mapbox/Leaflet route visualization, dual-RFID toll breakdown card, and multi-stop Bento itinerary builder. |
| **Unit 10** | `10-itemized-bill-splitter-and-ledger-ui.md` | Web interactive bill splitter, line-item avatar tagging, non-drinker exclusion toggles, and dynamic GCash/Maya QR settlement generator. |
| **Unit 11** | `11-crowdsourced-toda-wiki-ui.md` | Web community directory for local tricycle tariffs, environmental fees, and provincial travel tips with upvoting. |
| **Unit 12** | `12-mobile-scaffold-and-offline-sqlite.md` | Mobile app scaffold, local SQLite persistence, offline-first itinerary and expense queue. |
| **Unit 13** | `13-mobile-camera-receipt-scanner.md` | Mobile receipt photo capture, on-device/API OCR line-item extraction, and touch-to-tag eater assigning. |
| **Unit 14** | `14-mobile-convoy-hud-and-sos.md` | Mobile one-handed in-car HUD mode for drivers, live convoy map, and 1-tap roadside SOS beacon. |
| **Unit 15** | `15-automated-testing-and-ci-cd.md` | GitHub Actions pipeline (`ci.yml`), Jest integration tests, debt graph verification suites, typecheck and lint quality gates. |
| **Unit 16** | `16-ui-ux-ergonomics-polish.md` | High-glare outdoor contrast optimization, micro-interactions, skeleton loaders for the 4-state UI rule, and demo seeds. |
