import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";

export type ButtonVariant =
  "primary" | "secondary" | "nature" | "danger" | "outline" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  isLarge?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
  isLarge = false,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: AppColors.brandOcean,
          borderColor: "transparent",
          textColor: "#FFFFFF",
        };
      case "nature":
        return {
          backgroundColor: AppColors.natureEmerald,
          borderColor: "transparent",
          textColor: "#FFFFFF",
        };
      case "danger":
        return {
          backgroundColor: AppColors.unsettled,
          borderColor: "transparent",
          textColor: "#FFFFFF",
        };
      case "secondary":
        return {
          backgroundColor: AppColors.darkSurfaceSecondary,
          borderColor: AppColors.darkBorder,
          textColor: AppColors.textPrimary,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: AppColors.darkBorder,
          textColor: AppColors.textPrimary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: AppColors.brandOceanLight,
        };
      default:
        return {
          backgroundColor: AppColors.brandOcean,
          borderColor: "transparent",
          textColor: "#FFFFFF",
        };
    }
  };

  const btnConfig = getButtonStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[
        styles.button,
        isLarge ? styles.largeButton : styles.standardButton,
        {
          backgroundColor: btnConfig.backgroundColor,
          borderColor: btnConfig.borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={btnConfig.textColor} size="small" />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.text,
              { color: btnConfig.textColor },
              icon ? { marginLeft: AppSpacing.sm } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: AppSpacing.buttonBorderRadius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  standardButton: {
    minHeight: AppSpacing.touchTargetMin,
    paddingHorizontal: AppSpacing.base,
    paddingVertical: AppSpacing.sm,
  },
  largeButton: {
    minHeight: AppSpacing.touchTargetPrimary,
    paddingHorizontal: AppSpacing.xl,
    paddingVertical: AppSpacing.md,
  },
  text: {
    ...AppTypography.bodyBold,
    textAlign: "center",
  },
});
