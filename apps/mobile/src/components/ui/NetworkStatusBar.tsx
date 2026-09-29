import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import type { NetworkConnectionState } from "../../types";

interface NetworkStatusBarProps {
  state: NetworkConnectionState;
  onSyncPress?: () => void;
  onToggleSimulatedOffline?: () => void;
}

export const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({
  state,
  onSyncPress,
  onToggleSimulatedOffline,
}) => {
  const isOffline = !state.isOnline;

  return (
    <View
      style={[
        styles.container,
        isOffline ? styles.offlineContainer : styles.onlineContainer,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggleSimulatedOffline}
        style={styles.statusIndicator}
      >
        <View
          style={[
            styles.dot,
            {
              backgroundColor: isOffline
                ? AppColors.offlineOrange
                : AppColors.natureEmerald,
            },
          ]}
        />
        <Text style={styles.statusText}>
          {isOffline ? "Offline Mode (Local SQLite)" : "Online Connected"}
        </Text>
      </TouchableOpacity>

      {state.pendingOutboxCount > 0 ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSyncPress}
          style={styles.pendingBadge}
        >
          <Text style={styles.pendingText}>
            ⚡ {state.pendingOutboxCount} pending
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: AppSpacing.base,
    paddingVertical: AppSpacing.sm,
    borderBottomWidth: 1,
  },
  onlineContainer: {
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    borderBottomColor: "rgba(5, 150, 105, 0.2)",
  },
  offlineContainer: {
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    borderBottomColor: "rgba(249, 115, 22, 0.3)",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: AppSpacing.sm,
  },
  statusText: {
    ...AppTypography.caption,
    color: AppColors.textPrimary,
    fontWeight: "600",
  },
  pendingBadge: {
    backgroundColor: AppColors.darkSurfaceSecondary,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 2,
    borderRadius: AppSpacing.badgeBorderRadius,
    borderWidth: 1,
    borderColor: AppColors.brandOceanLight,
  },
  pendingText: {
    ...AppTypography.tiny,
    color: AppColors.brandOceanLight,
    fontWeight: "700",
  },
});
