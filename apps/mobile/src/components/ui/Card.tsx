import React from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "secondary" | "oceanGlow";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: AppColors.darkSurfaceSecondary,
          borderColor: AppColors.darkBorder,
        };
      case "oceanGlow":
        return {
          backgroundColor: "rgba(2, 132, 199, 0.08)",
          borderColor: "rgba(56, 189, 248, 0.3)",
        };
      default:
        return {
          backgroundColor: AppColors.darkSurface,
          borderColor: AppColors.darkBorder,
        };
    }
  };

  const cardConfig = getCardStyle();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardConfig.backgroundColor,
          borderColor: cardConfig.borderColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: AppSpacing.cardBorderRadius,
    borderWidth: 1,
    padding: AppSpacing.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
});
