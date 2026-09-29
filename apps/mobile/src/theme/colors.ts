/**
 * GalaPH Mobile Design System — Semantic Color Tokens
 * Strict adherence to context/ui-context.md
 */

export const AppColors = {
  // Primary Brand & Nature Tokens
  brandOcean: "#0284C7", // Deep Ocean Sky-600
  brandOceanDark: "#0369A1",
  brandOceanLight: "#38BDF8", // Cyan-400
  accentSunset: "#EA580C", // Sunset Coral Orange-600
  accentSunsetLight: "#FB923C", // Orange-400
  natureEmerald: "#059669", // Tropical Palm Emerald-600
  natureEmeraldLight: "#34D399", // Emerald-400

  // Transit & RFID Semantic Badges
  autosweep: "#D97706", // Autosweep Gold Amber-600
  autosweepBg: "rgba(217, 119, 6, 0.12)",
  autosweepBorder: "rgba(217, 119, 6, 0.35)",

  easytrip: "#0284C7", // Easytrip Blue Sky-600
  easytripBg: "rgba(2, 132, 199, 0.12)",
  easytripBorder: "rgba(2, 132, 199, 0.35)",

  commute: "#059669", // Commuter Emerald
  commuteBg: "rgba(5, 150, 105, 0.12)",
  commuteBorder: "rgba(5, 150, 105, 0.35)",

  convoyActive: "#2563EB", // Blue-600
  convoyActiveBg: "rgba(37, 99, 235, 0.12)",
  convoyActiveBorder: "rgba(37, 99, 235, 0.35)",

  // Financial Ledger Badges
  unsettled: "#E11D48", // Rose-600 (Debt owed)
  unsettledBg: "rgba(225, 29, 72, 0.12)",
  unsettledBorder: "rgba(225, 29, 72, 0.35)",

  settled: "#059669", // Emerald-600 (Paid / Settled)
  settledBg: "rgba(5, 150, 105, 0.12)",
  settledBorder: "rgba(5, 150, 105, 0.35)",

  // Surface & Background (High-contrast Outdoor Theme)
  darkBackground: "#090D16", // Midnight Surf Obsidian
  darkSurface: "#111827", // Gray-900 Card Surface
  darkSurfaceSecondary: "#1E293B", // Slate-800 Tile Surface
  darkBorder: "#334155", // Slate-700 Border

  lightBackground: "#F8FAFC", // Slate-50
  lightSurface: "#FFFFFF", // Pure White
  lightSurfaceSecondary: "#F1F5F9", // Slate-100
  lightBorder: "#E2E8F0", // Slate-200

  // Text Hierarchy (WCAG AAA >= 7:1 for outdoor sunlight)
  textPrimary: "#F8FAFC", // Slate-50 (Dark mode primary)
  textSecondary: "#94A3B8", // Slate-400
  textMuted: "#64748B", // Slate-500
  textInverse: "#0F172A", // Slate-900 (Light mode primary)

  // System Status
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  offlineOrange: "#F97316",
} as const;

export type AppColorKey = keyof typeof AppColors;
