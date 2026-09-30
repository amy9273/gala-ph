# Unit 18: Mobile UI/UX & Brand System Redesign

---

## 1. Overview & Problem Statement

The initial mobile UI adopted an overly dark, cybernetic "dev console" aesthetic (cold cyan `#00C2A8`, sky-blue `#0284C7`, midnight navy `#090D16`, and heavy slate borders). Furthermore, it introduced a non-standard 7-tab bottom navigation dock (`[Trip] [Convoy] [Itinerary] [Scan OCR] [Packing] [Ledger] [Outbox]`) utilizing raw Unicode emojis instead of vector icons.

This unit executes a comprehensive UI/UX and brand identity transformation:

1. **Brand Color Transformation**: Transition from cold enterprise blue to **Sunset Terracotta (`#FF5A36`)**, **Tropical Sun Gold (`#F59E0B`)**, and **Warm Obsidian (`#121316`)** surfaces, reflecting authentic Philippine travel and barkada road trips.
2. **Navigation Standard Adherence**: Enforce Material Design 3 and Apple HIG bottom navigation standards by reducing the root navigation to **4 primary tabs** (`Trip`, `Itinerary`, `Convoy`, `Ledger`).
3. **Action & Modal Relocation**: Move **Scan OCR Receipt** into a contextual primary action, embed **Bayanihan Packing** as a clean card/section inside the Trip hub, and bind **Outbox Sync** to the header connectivity pill.
4. **Professional Vector Iconography**: Purge all raw emojis (`🏝️`, `🚗`, `🗺️`, `📸`, `🎒`, `🧾`, `⚡`, `📍`, `🗓️`) across navigation, action cards, and badges, replacing them with crisp `@expo/vector-icons` (`Ionicons`).
5. **Ergonomic Surface Refinement**: Replace heavy borders with subtle tonal elevation, generous breathing room, and high-contrast outdoor typography.

---

## 2. Invariants & Guardrails

1. **4-Tab Maximum Invariant**: The bottom navigation bar must never exceed 4 tabs (`overview`, `itinerary`, `convoy`, `expenses`).
2. **Zero Emoji Invariant**: Navigation tabs, action buttons, screen titles, and badge components must use vector icons from `@expo/vector-icons`, never raw Unicode emojis.
3. **Contrast & Outdoor Ergonomics**: All monetary figures, destination headers, and status badges must maintain WCAG AAA $\ge 7:1$ contrast against the warm dark surface.
4. **Preserve Offline & Data Flow**: All existing SQLite queries, offline outbox mutations, OCR parsing, and convoy telemetry services must remain 100% functional and covered by automated tests.

---

## 3. Brand Color System

### Palette Definition (`apps/mobile/src/theme/colors.ts`)

| Token                  | Hex / Value                | Semantic Role                                                  |
| :--------------------- | :------------------------- | :------------------------------------------------------------- |
| `brandPrimary`         | `#FF5A36`                  | Sunset Terracotta — Primary brand, active tab, primary buttons |
| `brandPrimaryDark`     | `#E04826`                  | Pressed states, active gradients                               |
| `brandPrimaryLight`    | `#FF8A65`                  | Subtle highlights, active badges                               |
| `brandPrimaryBg`       | `rgba(255, 90, 54, 0.12)`  | Soft tinted button & badge backgrounds                         |
| `accentGold`           | `#F59E0B`                  | Tropical Sun Gold — Autosweep, road trip milestones, tolls     |
| `natureEmerald`        | `#10B981`                  | Island Palm — Paid KKB settlements, commuter transit, online   |
| `natureEmeraldBg`      | `rgba(16, 185, 129, 0.12)` | Settled ledger background                                      |
| `darkBackground`       | `#121316`                  | Warm Obsidian — Primary screen canvas (low glare, warm)        |
| `darkSurface`          | `#1A1C23`                  | Warm Slate Surface — Bento cards, hero panels                  |
| `darkSurfaceSecondary` | `#242731`                  | Sub-sections, action tiles, hover/pressed rows                 |
| `darkBorder`           | `#2E323E`                  | Refined subtle 1px border lines                                |
| `textPrimary`          | `#F9FAFB`                  | High-contrast warm white for headers and totals                |
| `textSecondary`        | `#9CA3AF`                  | Neutral slate for labels and timestamps                        |
| `textMuted`            | `#6B7280`                  | Subdued metadata                                               |

---

## 4. Navigation & Component Specifications

### 4.1. Bottom Tab Bar (`apps/mobile/src/navigation/BottomTabBar.tsx`)

- Exactly 4 root destinations:
  1. `overview` — **Trip** (`compass-outline` / `compass`)
  2. `itinerary` — **Itinerary** (`calendar-outline` / `calendar`)
  3. `convoy` — **Convoy** (`navigate-outline` / `navigate`)
  4. `expenses` — **Ledger** (`receipt-outline` / `receipt`)
- Height: 64dp with 48dp minimum touch target.
- Active state: Sunset Terracotta icon fill with glowing indicator pill.

### 4.2. Action Relocation & Floating Triggers

- **Scan Receipt (OCR)**: Accessible via:
  1. Prominent "Scan Receipt" action on Trip Overview.
  2. Primary action in Ledger Screen.
- **Bayanihan Packing**: Accessible via Trip Overview checklist preview card with direct modal or sub-view toggle.
- **Outbox Sync**: Header status pill (`NetworkStatusBar.tsx`) is clickable, displaying pending mutation count and opening the `SyncQueueScreen`.

### 4.3. Trip Overview Refactor (`TripOverviewScreen.tsx`)

- **Hero Card**:
  - Warm obsidian surface with subtle sunset terracotta accent border.
  - Vector icons for location pin (`location`) and calendar (`time-outline`).
  - Clean badge pills for offline caching and invite code.
- **Quick Metrics**:
  - "Total Logged" in Sunset Terracotta (`#FF5A36`).
  - "Est. Budget" in Warm White (`#F9FAFB`).
- **Barkada Roster**:
  - Avatar initials with terracotta/amber accent rings.
  - Soft pastel role tags (`Lead`, `Driver`, `Non-Drinker`).
- **Quick Actions Grid**:
  - Replaced emojis with vector icons in circular tinted containers.

---

## 5. Verification Plan

1. **Static Quality Gates**:
   - `npm run format:check` (100% Prettier compliance).
   - `npm run typecheck` (Strict TypeScript pass across monorepo).
   - `npm run lint` (0 ESLint warnings/errors).
2. **Automated Test Suite**:
   - `npm test` (All 122 monorepo unit & integration tests passing).
   - Update mobile unit tests to reflect 4-tab navigation contracts.
3. **Bundling Verification**:
   - `npx expo export --no-bytecode` (Verify 0 bundle errors on Android and iOS).
