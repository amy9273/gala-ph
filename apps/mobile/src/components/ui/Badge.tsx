import React from "react";
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";

export type BadgeVariant =
  | "autosweep"
  | "easytrip"
  | "commute"
  | "convoyActive"
  | "unsettled"
  | "settled"
  | "offline"
  | "ocean"
  | "warning"
  | "danger"
  | "success"
  | "info"
  | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "small" | "medium";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "neutral",
  size = "medium",
  style,
  textStyle,
}) => {
  const getBadgeStyles = () => {
    switch (variant) {
      case "autosweep":
        return {
          backgroundColor: AppColors.autosweepBg,
          borderColor: AppColors.autosweepBorder,
          textColor: AppColors.autosweep,
        };
      case "easytrip":
        return {
          backgroundColor: AppColors.easytripBg,
          borderColor: AppColors.easytripBorder,
          textColor: AppColors.easytrip,
        };
      case "commute":
        return {
          backgroundColor: AppColors.commuteBg,
          borderColor: AppColors.commuteBorder,
          textColor: AppColors.commute,
        };
      case "convoyActive":
        return {
          backgroundColor: AppColors.convoyActiveBg,
          borderColor: AppColors.convoyActiveBorder,
          textColor: AppColors.convoyActive,
        };
      case "unsettled":
        return {
          backgroundColor: AppColors.unsettledBg,
          borderColor: AppColors.unsettledBorder,
          textColor: AppColors.unsettled,
        };
      case "settled":
        return {
          backgroundColor: AppColors.settledBg,
          borderColor: AppColors.settledBorder,
          textColor: AppColors.settled,
        };
      case "offline":
        return {
          backgroundColor: "rgba(249, 115, 22, 0.15)",
          borderColor: "rgba(249, 115, 22, 0.4)",
          textColor: AppColors.offlineOrange,
        };
      case "ocean":
        return {
          backgroundColor: "rgba(2, 132, 199, 0.15)",
          borderColor: "rgba(2, 132, 199, 0.4)",
          textColor: AppColors.brandOceanLight,
        };
      case "warning":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          borderColor: "rgba(245, 158, 11, 0.4)",
          textColor: AppColors.warning,
        };
      case "danger":
        return {
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          borderColor: "rgba(239, 68, 68, 0.4)",
          textColor: AppColors.danger,
        };
      case "success":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          borderColor: "rgba(16, 185, 129, 0.4)",
          textColor: AppColors.success,
        };
      case "info":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          borderColor: "rgba(59, 130, 246, 0.4)",
          textColor: AppColors.info,
        };
      default:
        return {
          backgroundColor: AppColors.darkSurfaceSecondary,
          borderColor: AppColors.darkBorder,
          textColor: AppColors.textSecondary,
        };
    }
  };

  const badgeConfig = getBadgeStyles();

  return (
    <View
      style={[
        styles.badge,
        size === "small" && styles.badgeSmall,
        {
          backgroundColor: badgeConfig.backgroundColor,
          borderColor: badgeConfig.borderColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === "small" && styles.textSmall,
          { color: badgeConfig.textColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: AppSpacing.xs,
    borderRadius: AppSpacing.badgeBorderRadius,
    borderWidth: 1,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    ...AppTypography.tiny,
    textTransform: "uppercase",
  },
  textSmall: {
    fontSize: 9,
    lineHeight: 12,
  },
});
