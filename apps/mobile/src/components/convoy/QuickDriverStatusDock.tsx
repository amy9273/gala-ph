import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import type { DriverQuickStatus } from "../../types";

interface QuickDriverStatusDockProps {
  currentStatus: DriverQuickStatus;
  onSelectStatus: (status: DriverQuickStatus) => void;
  onTriggerSosModal: () => void;
  isSosActive?: boolean;
}

const STATUS_BUTTONS: Array<{
  key: DriverQuickStatus;
  label: string;
  icon: string;
}> = [
  { key: "CRUISING", label: "Cruising", icon: "🚗" },
  { key: "REFUEL", label: "Gas Stop", icon: "⛽" },
  { key: "RESTROOM", label: "Restroom", icon: "🚻" },
  { key: "PULLING_OVER", label: "Stopping", icon: "🛑" },
];

export const QuickDriverStatusDock: React.FC<QuickDriverStatusDockProps> = ({
  currentStatus,
  onSelectStatus,
  onTriggerSosModal,
  isSosActive = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.dockTitle}>1-TAP DRIVER STATUS</Text>

      {/* 4-Button Grid for Quick Status */}
      <View style={styles.statusGrid}>
        {STATUS_BUTTONS.map((item) => {
          const isActive = currentStatus === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.statusButton,
                isActive && styles.statusButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={() => onSelectStatus(item.key)}
            >
              <Text style={styles.statusIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.statusLabel,
                  isActive && styles.statusLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Emergency Roadside SOS Button */}
      <TouchableOpacity
        style={[styles.sosButton, isSosActive && styles.sosButtonActive]}
        activeOpacity={0.8}
        onPress={onTriggerSosModal}
      >
        <Text style={styles.sosButtonIcon}>🚨</Text>
        <View style={styles.sosButtonTextCol}>
          <Text style={styles.sosButtonTitle}>
            {isSosActive ? "ACTIVE EMERGENCY SOS" : "ROADSIDE SOS BEACON"}
          </Text>
          <Text style={styles.sosButtonSub}>
            {isSosActive
              ? "Tap to view alert or mark resolved"
              : "1-Tap broadcast: Flat tire, overheat, medical, accident"}
          </Text>
        </View>
        <Text style={styles.sosChevron}>❯</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.darkSurface,
    borderRadius: AppSpacing.cardBorderRadius,
    padding: AppSpacing.base,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    marginTop: AppSpacing.md,
  },
  dockTitle: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: AppSpacing.md,
  },
  statusGrid: {
    flexDirection: "row",
    gap: AppSpacing.sm,
    marginBottom: AppSpacing.md,
  },
  statusButton: {
    flex: 1,
    minHeight: 56,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.badgeBorderRadius,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: AppSpacing.sm,
    borderWidth: 1.5,
    borderColor: AppColors.darkBorder,
  },
  statusButtonActive: {
    borderColor: AppColors.natureEmeraldLight,
    backgroundColor: "rgba(5, 150, 105, 0.2)",
  },
  statusIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  statusLabelActive: {
    color: AppColors.natureEmeraldLight,
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 2,
    borderColor: AppColors.danger,
    borderRadius: AppSpacing.buttonBorderRadius,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  sosButtonActive: {
    backgroundColor: AppColors.danger,
  },
  sosButtonIcon: {
    fontSize: 24,
    marginRight: AppSpacing.md,
  },
  sosButtonTextCol: {
    flex: 1,
  },
  sosButtonTitle: {
    ...AppTypography.bodyBold,
    fontWeight: "900",
    color: AppColors.textPrimary,
    letterSpacing: 0.5,
  },
  sosButtonSub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  sosChevron: {
    fontSize: 18,
    color: AppColors.textPrimary,
    fontWeight: "900",
    marginLeft: AppSpacing.sm,
  },
});
