# Unit 08: Next.js App Shell & Theme — GalaPH

This specification details the frontend application shell, design system tokens, Tailwind CSS configuration, dark/light theme switching, responsive navigation header, global layout, and hero travel OS dashboard for GalaPH.

---

## 1. Scope & Objectives

### A. Design System & Theme Engine (`ui-context.md`)

1. **Tailwind CSS & CSS Custom Properties**:
   - Configure Tailwind with CSS variables and custom utility classes in `apps/web/src/app/globals.css`.
   - Core palette:
     - **Ocean Primary (`--brand-ocean`)**: `#0284C7` (light) / `#38BDF8` (dark)
     - **Sunset Accent (`--accent-sunset`)**: `#EA580C` (light) / `#FB923C` (dark)
     - **Verdant Nature (`--nature-emerald`)**: `#059669` (light) / `#34D399` (dark)
     - **Autosweep Gold**: `#D97706` (Amber-600)
     - **Easytrip Blue**: `#0284C7` (Sky-600)
     - **Background**: `#F8FAFC` (light) / `#090D16` (Midnight Surf dark)
     - **Surface**: `#FFFFFF` (light) / `#111827` (dark)
     - **Surface Secondary**: `#F1F5F9` (light) / `#1E293B` (dark)
     - **Border**: `#E2E8F0` (light) / `#334155` (dark)
     - **Text Primary**: `#0F172A` (light) / `#F8FAFC` (dark)
     - **Text Secondary**: `#64748B` (light) / `#94A3B8` (dark)

2. **Dark / Light Theme Provider**:
   - Wrapped with `next-themes` (`<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`).
   - Theme toggle button with smooth icon transition (`Sun` / `Moon` / `Laptop`).

3. **Typography & Outdoor Glare High-Contrast Guardrail**:
   - Modern typography with `Inter` / `Plus Jakarta Sans`.
   - High outdoor contrast compliance for bright sunlight visibility.

---

### B. App Shell & Layout Components

1. **Header & Navigation Bar (`<Navbar />`)**:
   - Floating glassmorphism navbar with backdrop blur (`backdrop-blur-md bg-background/80 border-b border-border/60`).
   - Logo: `🌴 GalaPH` with animated sunset gradient badge (`PH`).
   - Navigation links:
     - 🗺️ **Trips & Planner** (`/trips`)
     - 💳 **Dual-RFID Tolls** (`/toll-calculator`)
     - 🚌 **Commuter Transit & TODA** (`/transit`)
     - 🧾 **KKB Bill Splitter** (`/ledger`)
     - 📡 **Convoy Live HUD** (`/convoy`)
   - Quick action buttons: **Create Trip**, **Join Barkada Code**, **Theme Toggle**, and **Demo Profile Avatar**.
   - Responsive mobile drawer sheet with smooth animated slide-in for handheld one-thumb navigation.

2. **Hero Dashboard & Bento OS Shell (`apps/web/src/app/page.tsx`)**:
   - Vibrant Philippine travel landscape hero with rich glassmorphism bento grid:
     - **Bento 1: Philippine Dual-RFID Toll Optimizer** (Autosweep vs. Easytrip balance recommendation card).
     - **Bento 2: Live Convoy GPS Beacon & Straggler Radar** (Live carpool tracker with pulsing active beacon).
     - **Bento 3: Itemized KKB Consumption Ledger** (Non-drinker alcohol exclusion toggle and GCash/Maya QR settlement preview).
     - **Bento 4: Commuter Transit & TODA Tariff Hub** (PITX/Cubao bus routes & local dialect tips).
     - **Bento 5: Bayanihan Shared Packing Checklist** (Real-time gear claim checklist).
     - **Bento 6: PAGASA Weather & Hazard Advisory Banner** (Tropical cyclone wind signals & gale warnings).

3. **Reusable Foundation UI Components (`apps/web/src/components/ui/`)**:
   - `<Button>`: Variants: `default`, `sunset`, `emerald`, `outline`, `ghost`, `glass`.
   - `<Badge>`: Semantic badges for `AUTOSWEEP`, `EASYTRIP`, `COMMUTE`, `CONVOY_ACTIVE`, `UNSETTLED`, `SETTLED`.
   - `<Card>`: Bento card with hover glow and glassmorphism borders.
   - `<Skeleton>`: Shimmer skeleton loaders for 4-state UI compliance.
   - `<ThemeToggle>`: Dark/Light mode switcher.
   - `<Modal>` / `<Dialog>`: Accessible dialog for joining barkada trips via invite code.

---

### C. Invariants & Rules

1. **Anti-Slop Guardrail (Zero Arbitrary Styles)**:
   Never write arbitrary hex codes like `bg-[#0284c7]`. Always use semantic Tailwind tokens (`bg-brand-ocean`, `text-accent-sunset`, `bg-surface`, `border-border`).
2. **4-State UI Rule**:
   All UI components that display data must support Loading Skeleton, Empty State, Error with Retry, and Populated State.
3. **Strict TypeScript & Zero Compiler Errors**:
   Clean type declarations across all React 18 / Next.js 14/15 components.
