# System Architecture & Technical Specifications — GalaPH

## 1. System High-Level Topology

```
                                  [ GalaPH System Architecture ]

     ┌────────────────────────────┐                        ┌────────────────────────────┐
     │   Mobile App (Flutter/RN)  │                        │   Web App (Next.js 15)     │
     │ • Offline SQLite Cache     │                        │ • Public Trip Planner & Map│
     │ • Convoy Live GPS Beacon   │                        │ • Host / Resort Admin View │
     │ • Camera OCR for Receipts  │                        │ • Deep Analytics & Itin.   │
     └─────────────┬──────────────┘                        └─────────────┬──────────────┘
                   │                                                     │
                   └──────────────────────┬──────────────────────────────┘
                                          ▼
                             [ Fastify / Node.js API Gateway ]
                             (JWT Auth + REST / OpenAPI Specs)
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
   [ Toll & Route Engine ]       [ Real-time WebSocket Hub ]   [ Ledger & Split Engine ]
   • OpenStreetMap / OSRM        • Convoy Live Geofencing      • Debt Simplification Graph
   • Autosweep/Easytrip Matrix   • Live Group Chat             • Multi-payer atomic tx
            │                             │                             │
            └─────────────────────────────┼─────────────────────────────┘
                                          ▼
                  ┌──────────────────────────────────────────────┐
                  │ PostgreSQL (Prisma ORM) + Redis + S3/R2      │
                  └──────────────────────────────────────────────┘
```

---

## 2. Component Boundaries & Responsibilities

### A. `apps/api` (Backend Engine)
- **Framework**: Node.js + Fastify / Express (TypeScript).
- **Core Modules**:
  1. `TollService`: Highway lookup tables for Skyway, NLEX, SCTEX, SLEX, TPLEX, CALAX, CAVITEX, NAIAX, CCLEX.
  2. `TransitService`: GTFS-style provincial bus schedules (PITX, Cubao, Pasay, Buendia) + TODA tariff database.
  3. `SplitLedgerService`: Itemized bill consumption engine + Debt simplification graph solver.
  4. `SocketServer`: Convoy telemetry, real-time geofence pinging, and synchronized trip updates.
  5. `ReceiptOcrWorker`: Asynchronous Tesseract / Vision OCR processing queue for physical receipts.

### B. `apps/web` (Interactive Web Portal)
- **Framework**: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui.
- **Responsibilities**:
  - Interactive multi-stop Trip Builder with Mapbox / Leaflet highway toll previews.
  - Comprehensive KKB Ledger Breakdown dashboard with downloadable PDF statements.
  - Crowdsourced TODA Fare Matrix Wiki with community upvoting.

### C. `apps/mobile` (Mobile Companion App)
- **Framework**: Flutter or React Native (Expo) with local SQLite caching.
- **Responsibilities**:
  - 100% offline access to trip itinerary, contact numbers, and saved receipts.
  - Camera OCR receipt capture with interactive touch-to-assign item tagging.
  - Convoy GPS beaconing with battery-efficient background updates.
  - Dynamic GCash / Maya QR generator for instant on-site debt settlement.

### D. `packages/shared`
- Shared TypeScript interfaces, DTOs, Zod validation schemas, Philippine currency formatters, and mathematical ledger formulas.

---

## 3. Database Schema Blueprint (PostgreSQL via Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  TRIP_LEAD
  MEMBER
  DRIVER
  COMMUTER
}

enum TravelMode {
  PRIVATE_CAR
  MOTORCYCLE
  COMMUTE_BUS
  COMMUTE_VAN
  HYBRID
}

enum ExpenseCategory {
  FOOD_AND_DINING
  ALCOHOL_AND_BAR
  TOLL_HIGHWAY
  FUEL_AND_GAS
  COMMUTE_TICKET
  LODGING_RESORT
  LOCAL_TOUR_GUIDE
  ENVIRONMENTAL_FEE
  SHARED_GROCERY
  MISCELLANEOUS
}

model User {
  id              String        @id @default(cuid())
  email           String        @unique
  name            String
  phone           String?
  gcashNumber     String?
  mayaNumber      String?
  avatarUrl       String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  memberships     TripMember[]
  expensesPaid    Expense[]     @relation("ExpensePayer")
  itemsConsumed   ItemConsumer[]
  splitsOwed      ExpenseSplit[]
}

model Trip {
  id              String        @id @default(cuid())
  title           String        // e.g. "Elyu Surf & Chill Weekend"
  destination     String        // e.g. "San Juan, La Union"
  startDate       DateTime
  endDate         DateTime
  travelMode      TravelMode    @default(HYBRID)
  inviteCode      String        @unique
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  members         TripMember[]
  itineraryItems  ItineraryItem[]
  expenses        Expense[]
  transitLegs     TransitLeg[]
  tollEstimates   TollEstimate[]
}

model TripMember {
  id              String        @id @default(cuid())
  tripId          String
  trip            Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  role            Role          @default(MEMBER)
  vehicleId       String?       // Grouped by vehicle for toll/gas splitting
  isDriver        Boolean       @default(false)
  isNonDrinker    Boolean       @default(false)
  dietaryNotes    String?
  joinedAt        DateTime      @default(now())

  @@unique([tripId, userId])
}

model Expense {
  id                String          @id @default(cuid())
  tripId            String
  trip              Trip            @relation(fields: [tripId], references: [id], onDelete: Cascade)
  paidById          String
  paidBy            User            @relation("ExpensePayer", fields: [paidById], references: [id])
  title             String          // e.g. "Dampa Seafood Dinner", "NLEX Balintawak Toll"
  category          ExpenseCategory
  totalAmount       Decimal         @db.Decimal(10, 2)
  serviceAndTaxFee  Decimal         @default(0) @db.Decimal(10, 2)
  receiptUrl        String?
  vehicleIdOnly     String?         // If restricted to riders of Car 1
  createdAt         DateTime        @default(now())

  items             ExpenseItem[]
  splits            ExpenseSplit[]
}

model ExpenseItem {
  id              String          @id @default(cuid())
  expenseId       String
  expense         Expense         @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  name            String          // e.g. "Garlic Butter Shrimp", "San Mig Pale Pilsen Bucket"
  price           Decimal         @db.Decimal(10, 2)
  quantity        Int             @default(1)

  consumers       ItemConsumer[]
}

model ItemConsumer {
  id              String          @id @default(cuid())
  expenseItemId   String
  expenseItem     ExpenseItem     @relation(fields: [expenseItemId], references: [id], onDelete: Cascade)
  userId          String
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([expenseItemId, userId])
}

model ExpenseSplit {
  id              String          @id @default(cuid())
  expenseId       String
  expense         Expense         @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  userId          String
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  amountOwed      Decimal         @db.Decimal(10, 2)
  isSettled       Boolean         @default(false)
  settledAt       DateTime?

  @@unique([expenseId, userId])
}

model TransitLeg {
  id              String          @id @default(cuid())
  tripId          String
  trip            Trip            @relation(fields: [tripId], references: [id], onDelete: Cascade)
  stepNumber      Int
  modeType        String          // BUS, JEEPNEY, TRICYCLE, FERRY
  operatorName    String?         // "Genesis JoyBus", "Local TODA"
  origin          String
  destination     String
  farePerHead     Decimal         @db.Decimal(10, 2)
  specialTripFare Decimal?        @db.Decimal(10, 2)
  lastTripTime    String?
  notes           String?
}

model TollEstimate {
  id              String          @id @default(cuid())
  tripId          String
  trip            Trip            @relation(fields: [tripId], references: [id], onDelete: Cascade)
  expresswayName  String          // "NLEX", "SCTEX", "TPLEX", "Skyway Stage 3", "SLEX", "CALAX", "CAVITEX"
  rfidProvider    String          // "EASYTRIP" or "AUTOSWEEP"
  entryPlaza      String
  exitPlaza       String
  classType       Int             @default(1)
  amount          Decimal         @db.Decimal(10, 2)
}

model ItineraryItem {
  id              String          @id @default(cuid())
  tripId          String
  trip            Trip            @relation(fields: [tripId], references: [id], onDelete: Cascade)
  dayNumber       Int             @default(1)
  timeSlot        String          // e.g. "07:30 AM"
  activity        String
  location        String
  latitude        Float?
  longitude       Float?
  estimatedCost   Decimal?        @db.Decimal(10, 2)
}
```

---

## 4. Architectural Invariants
1. **Mathematical Conservation**: The sum of all `ExpenseSplit.amountOwed` for any given expense MUST exactly equal `Expense.totalAmount` within ₱0.01 margin of floating precision (handled via integer centavo math).
2. **Strict Transit Isolation**: Expenses tagged with `vehicleIdOnly` cannot be assigned to members not seated in that vehicle.
3. **Offline Invariant**: All write actions generated on the mobile app in offline mode must include a monotonic client timestamp and idempotency UUID to prevent duplicate splits during sync.
