import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
  icon,
}) => {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: AppSpacing.xxl,
    borderRadius: AppSpacing.cardBorderRadius,
    backgroundColor: AppColors.darkSurface,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    marginVertical: AppSpacing.md,
  },
  iconWrapper: {
    marginBottom: AppSpacing.base,
    padding: AppSpacing.md,
    borderRadius: 999,
    backgroundColor: AppColors.darkSurfaceSecondary,
  },
  title: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
    textAlign: "center",
    marginBottom: AppSpacing.xs,
  },
  description: {
    ...AppTypography.body,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginBottom: AppSpacing.base,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: AppSpacing.sm,
    minWidth: 160,
  },
});
