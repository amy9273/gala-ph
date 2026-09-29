# Unit 11: Crowdsourced TODA Wiki UI & Provincial Travel Directory — GalaPH

This specification details the frontend components, provincial commuter route planner, community tricycle tariff directory, dialect negotiation cheat sheets, and LGU environmental fee tracking for Philippine barkada commuters.

---

## 1. Scope & Deliverables

1. **Provincial Transit & TODA API Layer (`apps/web/src/lib/api.ts`)**:
   - Models: `TodaTariff`, `TodaDialectPhrase`, `ProvincialBusRoute`, `CommutePlan`, `EnvironmentalFee`.
   - Comprehensive seed tariffs across top Philippine travel corridors:
     - **San Juan, La Union** (Ilocano: "Mano ti plete aginggana Urbiztondo?", "Awan tawar?")
     - **Nasugbu & Calatagan, Batangas** (Batangueño: "Gaano baga ang pamasahi?", "Ala eh, pakitabi na laang!")
     - **Baler, Aurora** (Tagalog/Ilocano: "Magkano special papuntang Sabang?")
     - **Moalboal, Cebu** (Cebuano: "Pila plete padung Panagsama?", "Palihug pakanaog!")
     - **Panglao, Bohol** (Cebuano/Boholano: "Pila ang plete pa-Alona Beach?")
     - **Baguio City** (Ilocano: "Mano ti plete Mines View?")

2. **Interactive Components**:
   - `<TodaTariffCard />` (`apps/web/src/components/transit/toda-tariff-card.tsx`):
     - Differentiates regular commuter fare vs. chartered special trip fare.
     - Shows night differential rates (after 8/9 PM) and last-trip curfew warnings.
     - Built-in dialect negotiation flashcard with phonetics and 1-tap copy.
     - Community upvote/downvote counter and LGU verification badge.
   - `<CommutePlannerCard />` (`apps/web/src/components/transit/commute-planner-card.tsx`):
     - Multi-modal commuter route builder (Metro Manila bus terminal $\to$ Provincial terminal $\to$ TODA trike $\to$ Environmental fee).
     - Computes per-head and total group commuter fare.
     - Displays curfew risk advisories when arriving late.
   - `<SubmitTariffModal />` (`apps/web/src/components/transit/submit-tariff-modal.tsx`):
     - Community crowdsourcing modal for adding verified local fares, night surcharges, and regional dialect tips.

3. **Transit Pages**:
   - `apps/web/src/app/transit/page.tsx`:
     - Standalone Commuter Transit & TODA Wiki hub.
     - Multi-tab navigation: Multi-Leg Commuter Planner, TODA Directory, Bus Hub Schedules, Dialect Cheat Sheet.
     - Province/region filter (North Luzon, South Luzon, Visayas).

4. **Quality Gates**:
   - 100% Prettier formatting compliance.
   - 0 TypeScript errors across all workspaces.
   - 0 ESLint warnings.
   - Clean Next.js static build (`npm run build:web`).
   - 76/76 passing automated backend tests.
