# Unit 16: UI/UX Ergonomics & Polish Specification

## 1. Objective

Refine the end-to-end user experience across both Web (`@gala-ph/web`) and Mobile (`@gala-ph/mobile`) applications with high-glare outdoor road trip visibility, WCAG AAA contrast compliance, micro-interactions, full 4-state UI loading skeletons/empty/error states, and interactive feedback notifications.

---

## 2. Requirements & Scope

### 2.1 High-Glare Sunlight Visibility & Contrast Optimization

- **Contrast Ratios**: All monetary values, speed limit readouts, toll reload numbers, and transit departure timestamps must satisfy WCAG AAA $\ge 7:1$ contrast against their respective backgrounds in both Dark Mode (`#090D16` / `#111827`) and Light Mode (`#F8FAFC` / `#FFFFFF`).
- **High-Glare Road Trip HUD**: Ensure the Mobile Convoy HUD, speedometer, and radar displays feature bold high-visibility typography, ambient glow rings, and anti-glare card surfaces for direct-sunlight dashboard mounts.

### 2.2 Micro-Interactions, Feedback & Toast System

- **Interactive Feedback (Web)**: Implement an animated, lightweight Toast Notification system (`<ToastContainer />`, `useToast` hook) for key actions:
  - Copying barkada invite code or payment references.
  - Adding / updating / toggling Bayanihan packing items.
  - Submitting receipt expenses or Toda tariffs.
  - Triggering & resolving Convoy SOS alerts.
- **Micro-Animations (CSS & Lucide)**: Subtle button press shrink effects (`active:scale-95`), card hover elevation shifts, glowing pulse animations on active convoy beacons (`animate-pulse`, `animate-ping`), and smooth theme transitions.

### 2.3 Comprehensive 4-State UI Rule Audit & Polish

Audit and verify that every asynchronous data view across Web and Mobile strictly fulfills all 4 states:

1. **Loading State**: Content-shaped shimmer skeletons matching exact card layout dimensions.
2. **Empty State**: Contextual Lucide/custom icon, clear headline, empathetic Philippine travel copy, and primary action button (e.g. "Plan New Trip", "Add First Expense", "Contribute Tariff").
3. **Error State**: Non-technical explanation, high-contrast alert badge, and prominent "Retry" trigger.
4. **Populated State**: Full rich interactive presentation with optimistic feedback and responsive layout.

### 2.4 Mobile Ergonomics & Thumb Zone Polish

- **Touch Target Verification**: All interactive buttons, chips, and toggles meet minimum $48\text{dp}$ (standard) and $56\text{dp}$ (primary actions / emergency SOS) touch targets.
- **Haptic & Visual Feedback**: Enhanced button press states with opacity and scale transforms.

---

## 3. Deliverables

1. Toast Notification Provider & UI (`apps/web/src/components/ui/toast.tsx`, `use-toast.ts`).
2. High-glare contrast enhancements across Tailwind tokens, theme CSS, and mobile theme palette.
3. Enhanced 4-state UI components on Web and Mobile with shimmer animations.
4. Integration of toast feedback across trip planning, ledger, TODA wiki, and toll calculator.
5. Unit tests validating toast state management and UI state transitions.
