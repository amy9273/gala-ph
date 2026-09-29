/**
 * GalaPH Mobile Design System — Spacing & Touch Targets
 * Strict 4px/8px grid with thumb-zone road trip ergonomics
 */

export const AppSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // Touch Target Ergonomics (Minimum standards)
  touchTargetMin: 48, // 48dp standard
  touchTargetPrimary: 56, // 56dp for emergency / major action buttons
  bottomDockHeight: 68,
  cardBorderRadius: 16,
  badgeBorderRadius: 8,
  buttonBorderRadius: 12,
} as const;
