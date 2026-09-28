# GalaPH — Philippine Barkada Travel & Granular Itemized Ledger OS

An all-in-one group travel operating system tailored specifically for the Philippine context and culture. It eliminates road trip planning chaos, dual-RFID toll confusion (**Autosweep vs. Easytrip**), commuter last-mile friction (**TODA Tariffs & Terminal Guides**), and post-trip "singilan" friendship drama through an **Itemized Granular Consumption Ledger** where members only pay for what they actually consumed or rendered.

---

## 🌴 Key Features

- **Dual-RFID Toll Calculator**: Computes exact tollway fees and balance requirements across SLEX, Skyway 3, NLEX, SCTEX, TPLEX, CALAX, CAVITEX, and CCLEX for vehicle Classes 1, 2, and 3.
- **Commuter Terminal & TODA Tariff Hub**: Step-by-step multi-modal transit directions (PITX/Cubao $\to$ Bus $\to$ Local Jeep $\to$ TODA Tricycle) with verified local tariffs and dialect negotiation tips.
- **Granular Itemized KKB (Kanya-Kanyang Bayad)**:
  - Line-item bill splitting with camera receipt OCR.
  - Non-drinkers are completely excluded from alcohol/inuman bills.
  - Allergic/dietary restrictions excluded from specific dishes.
  - Car riders split gas/toll with optional exemption for the driver.
  - Proportional mathematical apportionment of service charge and taxes.
- **Debt Simplification Graph Solver**: Resolves tangled group debts into minimum direct transactions with 1-tap dynamic **GCash / Maya QR generation**.
- **Offline-First Resilience**: 100% offline-capable itinerary, emergency contacts, and expense logging for remote beaches and mountain dead zones.
- **Live Convoy Telemetry**: Real-time GPS beaconing over WebSockets to synchronize car convoys and commuter bus catch-up points.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js, Fastify / Express, TypeScript, Prisma ORM, PostgreSQL, Redis, WebSockets.
- **Web App**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui, TanStack Query, Leaflet / Mapbox.
- **Mobile App**: React Native (Expo) with local SQLite offline persistence (`expo-sqlite`).
- **Testing & CI/CD**: Jest, Docker Compose, GitHub Actions workflow with strict typecheck, lint, and service container test suites.

---

## 🚀 Quick Start

### 1. Start Infrastructure (PostgreSQL & Redis)

```bash
docker-compose up -d
```

### 2. Install Dependencies & Build Packages

```bash
npm install
npm run build:shared
```

### 3. Run Development Servers

```bash
npm run dev:api    # Starts API server on http://localhost:5000
npm run dev:web    # Starts Next.js Web App on http://localhost:3000
```

---

## 📖 Architecture & Standards Documentation

Before contributing or modifying code, consult the context files:

- [`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md) — Operating rules and workflow discipline.
- [`context/project-overview.md`](./context/project-overview.md) — Product definition & user personas.
- [`context/architecture.md`](./context/architecture.md) — System boundaries & Prisma database schema.
- [`context/engineering-best-practices.md`](./context/engineering-best-practices.md) — Exact currency math & security.
- [`context/ui-context.md`](./context/ui-context.md) — Nature/Sunset design tokens & outdoor road-trip ergonomics.
- [`context/code-standards.md`](./context/code-standards.md) — Code hygiene, layer responsibilities & CI/CD quality gates.
- [`context/progress-tracker.md`](./context/progress-tracker.md) — Implementation status and milestones.
