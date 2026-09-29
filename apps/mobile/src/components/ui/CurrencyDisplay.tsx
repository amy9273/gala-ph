import React from "react";
import { Text, StyleSheet, type TextStyle } from "react-native";
import { formatPHP } from "@gala-ph/shared";
import { AppColors } from "../../theme/colors";
import { AppTypography } from "../../theme/typography";

interface CurrencyDisplayProps {
  centavos: number;
  style?: TextStyle;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  centavos,
  style,
  color = AppColors.textPrimary,
  size = "md",
}) => {
  const formatted = formatPHP(centavos, true);

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 };
      case "lg":
        return { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 };
      case "xl":
        return { fontSize: 28, fontWeight: "800" as const, lineHeight: 34 };
      default:
        return AppTypography.currency;
    }
  };

  return (
    <Text style={[styles.currency, getSizeStyle(), { color }, style]}>
      {formatted}
    </Text>
  );
};

const styles = StyleSheet.create({
  currency: {
    fontVariant: ["tabular-nums"],
  },
});
