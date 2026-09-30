import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
        <Ionicons
          name={isOffline ? "cloud-offline" : "wifi"}
          size={14}
          color={isOffline ? AppColors.brandPrimary : AppColors.natureEmerald}
          style={styles.statusIcon}
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
          <Ionicons
            name="sync"
            size={12}
            color={AppColors.accentGold}
            style={styles.syncIcon}
          />
          <Text style={styles.pendingText}>
            {state.pendingOutboxCount} pending
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
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  onlineContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderBottomColor: "rgba(16, 185, 129, 0.15)",
  },
  offlineContainer: {
    backgroundColor: "rgba(255, 90, 54, 0.08)",
    borderBottomColor: "rgba(255, 90, 54, 0.2)",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    ...AppTypography.caption,
    color: AppColors.textPrimary,
    fontWeight: "600",
    fontSize: 12,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.darkSurfaceSecondary,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 3,
    borderRadius: AppSpacing.badgeBorderRadius,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  syncIcon: {
    marginRight: 4,
  },
  pendingText: {
    ...AppTypography.tiny,
    color: AppColors.accentGold,
    fontWeight: "700",
  },
});
