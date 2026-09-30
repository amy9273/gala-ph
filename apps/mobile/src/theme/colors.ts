/**
 * GalaPH Mobile Design System — Semantic Color Tokens
 * Strict adherence to context/ui-context.md
 */

export const AppColors = {
  // Primary Brand & Nature Tokens (Philippine Sunset & Golden Hour)
  brandPrimary: "#FF5A36", // Sunset Terracotta — Elyu / Manila Bay sunset
  brandPrimaryDark: "#E04826",
  brandPrimaryLight: "#FF8A65",
  brandPrimaryBg: "rgba(255, 90, 54, 0.12)",

  // Legacy Brand Ocean alias mapped to Sunset Terracotta for theme consistency
  brandOcean: "#FF5A36",
  brandOceanDark: "#E04826",
  brandOceanLight: "#FF8A65",

  accentSunset: "#FF5A36",
  accentSunsetLight: "#FF8A65",
  accentGold: "#F59E0B", // Tropical Sun Gold (Tolls, Highlights)
  accentGoldBg: "rgba(245, 158, 11, 0.12)",

  natureEmerald: "#10B981", // Island Palm Emerald-500
  natureEmeraldLight: "#34D399",
  natureEmeraldBg: "rgba(16, 185, 129, 0.12)",

  // Transit & RFID Semantic Badges
  autosweep: "#F59E0B", // Autosweep Gold Amber-500
  autosweepBg: "rgba(245, 158, 11, 0.12)",
  autosweepBorder: "rgba(245, 158, 11, 0.35)",

  easytrip: "#0284C7", // Easytrip Blue Sky-600
  easytripBg: "rgba(2, 132, 199, 0.12)",
  easytripBorder: "rgba(2, 132, 199, 0.35)",

  commute: "#10B981", // Commuter Emerald
  commuteBg: "rgba(16, 185, 129, 0.12)",
  commuteBorder: "rgba(16, 185, 129, 0.35)",

  convoyActive: "#FF5A36", // Active Convoy Beacon
  convoyActiveBg: "rgba(255, 90, 54, 0.12)",
  convoyActiveBorder: "rgba(255, 90, 54, 0.35)",

  // Financial Ledger Badges
  unsettled: "#EF4444", // Rose-500 (Debt owed)
  unsettledBg: "rgba(239, 68, 68, 0.12)",
  unsettledBorder: "rgba(239, 68, 68, 0.35)",

  settled: "#10B981", // Emerald-500 (Paid / Settled)
  settledBg: "rgba(16, 185, 129, 0.12)",
  settledBorder: "rgba(16, 185, 129, 0.35)",

  // Surface & Background (Warm Obsidian High-Contrast Outdoor Theme)
  darkBackground: "#121316", // Warm Obsidian
  darkSurface: "#1A1C23", // Warm Slate Card Surface
  darkSurfaceSecondary: "#242731", // Sub-section Tile Surface
  darkBorder: "#2E323E", // Refined subtle border

  lightBackground: "#F8FAFC", // Slate-50
  lightSurface: "#FFFFFF", // Pure White
  lightSurfaceSecondary: "#F1F5F9", // Slate-100
  lightBorder: "#E2E8F0", // Slate-200

  // Text Hierarchy (WCAG AAA >= 7:1 for outdoor sunlight)
  textPrimary: "#F9FAFB", // High-contrast warm white
  textSecondary: "#9CA3AF", // Slate-400
  textMuted: "#6B7280", // Slate-500
  textInverse: "#121316", // Dark primary

  // System Status
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  offlineOrange: "#FF5A36",
} as const;

export type AppColorKey = keyof typeof AppColors;
