export { AppColors, type AppColorKey } from "./colors";
export { AppSpacing } from "./spacing";
export { AppTypography } from "./typography";

import { AppColors } from "./colors";
import { AppSpacing } from "./spacing";
import { AppTypography } from "./typography";

export const AppTheme = {
  colors: AppColors,
  spacing: AppSpacing,
  typography: AppTypography,
  isDark: true,
} as const;

export type AppThemeType = typeof AppTheme;
