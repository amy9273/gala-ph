# UI & Design System Standards — GalaPH

This document defines the strict visual language, ergonomics, and **non-negotiable UI consistency rules** across the Next.js Web Application and the Mobile App.

---

## 1. Non-Negotiable Consistency Rules (Anti-Slop Guardrails)

Every AI coding agent and human contributor must follow these rules without exception:

### Rule 1: Zero Arbitrary Styles (No Magic Numbers or Hex Codes)
- **Web**: NEVER use inline styles (`style={{ color: '#059669' }}`) or arbitrary Tailwind classes like `bg-[#00b4d8]`. Use semantic tokens and Tailwind config tokens only (`bg-brand-ocean`, `text-travel-sunset`, `text-muted-foreground`).
- **Mobile**: NEVER instantiate ad-hoc colors in widgets (`Color(0xFF00B4D8)`). Always reference `AppTheme.colors(context).brandPrimary` or `AppColors.ocean`.
- **Spacing**: Follow a strict 4px/8px grid system (`p-2`, `p-4`, `p-6`, `gap-4`). No random margins (`mt-[19px]`).

### Rule 2: The Mandatory 4-State UI Rule
Every screen, itinerary section, toll card, or KKB breakdown that consumes asynchronous data **MUST** explicitly implement four states:
1. **Loading State**: Content-shaped **Skeleton loaders** with subtle shimmer. Never slap a solitary spinner in the center of an empty screen.
2. **Empty State**: Icon + clear title + descriptive copy + primary Call-to-Action (e.g., _"No expenses logged yet. Tap 'Scan Receipt' or 'Add Quick Expense' to start KKB"_).
3. **Error State**: Non-technical explanation + clear error badge + prominent **"Retry"** button.
4. **Populated State**: Full data view with proper pagination, sorting, and optimistic updates.

### Rule 3: Uniform Travel & Transit Semantics
Status colors and transit indicators are sacred across Web and Mobile:

| Semantic Entity        | Meaning / Context          | Tailwind Class (Web)                                        | Mobile Theme Token       | Icon            | Visual Behavior                      |
| :--------------------- | :------------------------- | :---------------------------------------------------------- | :----------------------- | :-------------- | :----------------------------------- |
| **AUTOSWEEP RFID**     | SLEX / Skyway / TPLEX      | `bg-amber-500/10 text-amber-600 border-amber-500/30`        | `AppColors.autosweep`    | `CreditCard`    | Amber/Burgundy Pill Badge            |
| **EASYTRIP RFID**      | NLEX / SCTEX / CALAX       | `bg-sky-500/10 text-sky-600 border-sky-500/30`              | `AppColors.easytrip`     | `CreditCard`    | Ocean/Cyan Pill Badge                |
| **COMMUTER TRANSIT**   | Bus / UV / Jeepney / Trike | `bg-emerald-500/10 text-emerald-600 border-emerald-500/30`  | `AppColors.commute`      | `Bus`           | Emerald Step Badge                   |
| **CONVOY ACTIVE**      | Car moving in convoy       | `bg-blue-500/10 text-blue-600 border-blue-500/30`           | `AppColors.convoyActive` | `Navigation`    | Pulsing beacon (`animate-ping`)      |
| **DEBT OWED / UNPAID** | KKB unsettled liability    | `bg-rose-500/10 text-rose-600 border-rose-500/30`           | `AppColors.unsettled`    | `Clock`         | High-contrast alert badge            |
| **SETTLED / PAID**     | GCash/Maya verified        | `bg-emerald-500/10 text-emerald-600 border-emerald-500/30`  | `AppColors.settled`      | `CheckCircle2`  | Static clean green pill              |

---

## 2. Color Palette & Semantic Tokens

Inspired by Philippine travel landscapes: **Deep Ocean (`#0077B6`)**, **Tropical Palm (`#10B981`)**, **Sunset Coral (`#F97316`)**, and **Volcanic Basalt (`#0F172A`)**.

### Semantic Travel Tokens
- **Brand Primary Ocean (`--brand-ocean`)**: Light: `#0284C7` | Dark: `#38BDF8` | Glow: `rgba(56, 189, 248, 0.25)`
- **Sunset Accent (`--accent-sunset`)**: Light: `#EA580C` | Dark: `#FB923C` | Glow: `rgba(251, 146, 60, 0.25)`
- **Verdant Nature (`--nature-emerald`)**: Light: `#059669` | Dark: `#34D399` | Glow: `rgba(52, 211, 153, 0.25)`
- **Autosweep Gold**: `#D97706` (Amber-600)
- **Easytrip Blue**: `#0284C7` (Sky-600)

### Surface & Neutral Hierarchy
| Token               | Light Mode Hex         | Dark Mode Hex             | Usage                                    |
| :------------------ | :--------------------- | :------------------------ | :--------------------------------------- |
| `background`        | `#F8FAFC` (Slate-50)   | `#090D16` (Midnight Surf) | Screen background                        |
| `surface`           | `#FFFFFF` (Pure White) | `#111827` (Gray-900)      | Cards, itinerary timeline, drawer panels |
| `surface-secondary` | `#F1F5F9` (Slate-100)  | `#1E293B` (Slate-800)     | Sub-sections, table headers, hover tiles |
| `border`            | `#E2E8F0` (Slate-200)  | `#334155` (Slate-700)     | Bento card borders, divider lines        |
| `text-primary`      | `#0F172A` (Slate-900)  | `#F8FAFC` (Slate-50)      | Headers, trip titles, amounts            |
| `text-secondary`    | `#64748B` (Slate-500)  | `#94A3B8` (Slate-400)     | Timestamps, subtitle metadata, notes     |

---

## 3. Ergonomics & Usability for Road Trips

### High-Glare Sunlight Visibility (Outdoor Road Trip Proofing)
- Avoid low-contrast pastels for text. All critical numbers (Toll fees, GCash amounts, Bus departure times) must maintain **WCAG AAA $\ge 7:1$ contrast**.
- In dark mode, avoid pitch-black OLED smear; use deep navy obsidian (`#090D16`) with high-contrast text.

### One-Handed "Thumb-Zone" Mobile Ergonomics
- The primary actions while on the road (**Scan Receipt**, **Add Expense**, **Flash GCash QR**, **Convoy SOS**) must be permanently anchored in the bottom navigation bar or floating action dock.
- Minimum touch target for all buttons: **$48\text{dp}$ (Standard)**, **$56\text{dp}$ (Primary Action/Emergency)**.

### Bento-Grid Itinerary Architecture (Web & Mobile)
- Multi-stop itineraries are rendered in clean, collapsible Bento cards.
- Each stop displays: **Time Badge**, **Location Map Pin**, **Estimated Cost**, **Assigned Driver / Transpo Mode**, and **Tag Badges (e.g., `#Seafood`, `#Swimming`)**.
