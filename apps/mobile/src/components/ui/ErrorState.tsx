import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <Badge label="System Error" variant="unsettled" style={styles.badge} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button
        title="Retry"
        onPress={onRetry}
        variant="outline"
        style={styles.retryButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: AppSpacing.xl,
    borderRadius: AppSpacing.cardBorderRadius,
    backgroundColor: "rgba(225, 29, 72, 0.06)",
    borderWidth: 1,
    borderColor: AppColors.unsettledBorder,
    marginVertical: AppSpacing.md,
  },
  badge: {
    marginBottom: AppSpacing.sm,
  },
  title: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
    textAlign: "center",
    marginBottom: AppSpacing.xs,
  },
  message: {
    ...AppTypography.body,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginBottom: AppSpacing.base,
    maxWidth: 280,
  },
  retryButton: {
    minWidth: 120,
    borderColor: AppColors.unsettled,
  },
});
