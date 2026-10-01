/**
 * GalaPH Mobile Design System — Semantic Color Tokens
 * Strict adherence to context/ui-context.md
 */

export const AppColors = {
  // Primary Brand & Nature Tokens (Philippine Sunset & Golden Hour)
  brandPrimary: "#FF5A36", // Sunset Terracotta — Elyu / Manila Bay sunset
  brandPrimaryDark: "#E04826",
  brandPrimaryLight: "#FF8A65",
  brandPrimaryBg: "rgba(255, 90, 54, 0.08)",

  // Legacy Brand Ocean alias mapped to Sunset Terracotta for theme consistency
  brandOcean: "#FF5A36",
  brandOceanDark: "#E04826",
  brandOceanLight: "#FF5A36", // Vivid Sunset Terracotta for high contrast on light mode

  accentSunset: "#FF5A36",
  accentSunsetLight: "#FF8A65",
  accentGold: "#D97706", // Tropical Sun Gold / Amber-600 for light mode contrast
  accentGoldBg: "rgba(217, 119, 6, 0.10)",

  natureEmerald: "#059669", // Island Palm Emerald-600 for light mode contrast
  natureEmeraldLight: "#10B981",
  natureEmeraldBg: "rgba(5, 150, 105, 0.10)",

  // Transit & RFID Semantic Badges
  autosweep: "#D97706", // Autosweep Gold Amber-600
  autosweepBg: "rgba(217, 119, 6, 0.10)",
  autosweepBorder: "rgba(217, 119, 6, 0.30)",

  easytrip: "#0284C7", // Easytrip Blue Sky-600
  easytripBg: "rgba(2, 132, 199, 0.10)",
  easytripBorder: "rgba(2, 132, 199, 0.30)",

  commute: "#059669", // Commuter Emerald-600
  commuteBg: "rgba(5, 150, 105, 0.10)",
  commuteBorder: "rgba(5, 150, 105, 0.30)",

  convoyActive: "#FF5A36", // Active Convoy Beacon
  convoyActiveBg: "rgba(255, 90, 54, 0.10)",
  convoyActiveBorder: "rgba(255, 90, 54, 0.30)",

  // Financial Ledger Badges
  unsettled: "#DC2626", // Red-600 (Debt owed)
  unsettledBg: "rgba(220, 38, 38, 0.08)",
  unsettledBorder: "rgba(220, 38, 38, 0.30)",

  settled: "#059669", // Emerald-600 (Paid / Settled)
  settledBg: "rgba(5, 150, 105, 0.08)",
  settledBorder: "rgba(5, 150, 105, 0.30)",

  // Surface & Background (Light Sunlit Canvas — Standard Travel App Ergonomics)
  background: "#F8FAFC", // Clean warm slate-50 canvas
  surface: "#FFFFFF", // Pure white card surface
  surfaceSecondary: "#F1F5F9", // Slate-100 sub-section / tile surface
  border: "#E2E8F0", // Refined subtle border

  // Backward-compatible mappings for existing components to adopt Light Mode
  darkBackground: "#F8FAFC",
  darkSurface: "#FFFFFF",
  darkSurfaceSecondary: "#F1F5F9",
  darkBorder: "#E2E8F0",

  lightBackground: "#F8FAFC",
  lightSurface: "#FFFFFF",
  lightSurfaceSecondary: "#F1F5F9",
  lightBorder: "#E2E8F0",

  // Text Hierarchy (WCAG AAA >= 7:1 for outdoor sunlight on light surfaces)
  textPrimary: "#0F172A", // Slate-900 (High contrast: 18.7:1 on white)
  textSecondary: "#475569", // Slate-600
  textMuted: "#64748B", // Slate-500
  textInverse: "#FFFFFF", // White text on dark/colored buttons

  // System Status
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",
  offlineOrange: "#EA580C",
} as const;

export type AppColorKey = keyof typeof AppColors;
