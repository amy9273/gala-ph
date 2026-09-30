import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";
import { Badge, type BadgeVariant } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CardSkeleton } from "../components/ui/SkeletonLoader";
import { EmptyState } from "../components/ui/EmptyState";
import { outboxRepository } from "../lib/sqlite/repositories/outbox.repository";
import { sqliteClient } from "../lib/sqlite/db";
import { outboxSyncService } from "../services/outbox-sync.service";
import type { OutboxMutation, NetworkConnectionState } from "../types";

export const SyncQueueScreen: React.FC = () => {
  const [mutations, setMutations] = useState<OutboxMutation[]>([]);
  const [networkState, setNetworkState] = useState<NetworkConnectionState>(
    outboxSyncService.getNetworkState(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const list = await outboxRepository.getAll();
      setMutations(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
    const unsub = outboxSyncService.subscribe((state) => {
      setNetworkState(state);
      void outboxRepository.getAll().then(setMutations);
    });
    return unsub;
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await outboxSyncService.processOutboxQueue();
      await loadQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleNetwork = () => {
    outboxSyncService.setOnlineStatus(!networkState.isOnline);
  };

  const handleClearSynced = async () => {
    await outboxRepository.clearSynced();
    await loadQueue();
  };

  const handleResetDatabase = async () => {
    await sqliteClient.resetDatabase();
    await outboxSyncService.hydrateInitialData();
    await loadQueue();
  };

  const pendingCount = mutations.filter(
    (m) => m.status === "PENDING" || m.status === "FAILED",
  ).length;
  const syncedCount = mutations.filter((m) => m.status === "SYNCED").length;

  const getStatusBadgeVariant = (
    status: OutboxMutation["status"],
  ): BadgeVariant => {
    switch (status) {
      case "SYNCED":
        return "settled";
      case "FAILED":
        return "unsettled";
      case "SYNCING":
        return "ocean";
      default:
        return "offline";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header & Controls */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Outbox Queue</Text>
          <Text style={styles.headerSubtitle}>
            Offline-first idempotent mutation sync
          </Text>
        </View>
        <Button
          title={isSyncing ? "Syncing..." : "Sync Now"}
          onPress={handleSyncNow}
          variant="primary"
          isLoading={isSyncing}
          style={styles.syncButton}
        />
      </View>

      {/* Network State & Storage Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Connection</Text>
          <TouchableOpacity
            onPress={handleToggleNetwork}
            style={styles.networkToggle}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: networkState.isOnline
                    ? AppColors.natureEmerald
                    : AppColors.offlineOrange,
                },
              ]}
            />
            <Text style={styles.statValue}>
              {networkState.isOnline ? "Online" : "Offline"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.statSub}>Tap to toggle simulation</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Queue Status</Text>
          <Text
            style={[styles.statValue, { color: AppColors.brandOceanLight }]}
          >
            {pendingCount} Pending • {syncedCount} Synced
          </Text>
          <Text style={styles.statSub}>
            {networkState.lastSyncTimestamp
              ? `Last: ${new Date(networkState.lastSyncTimestamp).toLocaleTimeString()}`
              : "Not synced yet"}
          </Text>
        </Card>
      </View>

      {/* 4-State UI Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      ) : mutations.length === 0 ? (
        <View style={styles.content}>
          <EmptyState
            title="Outbox is Clean"
            description="All offline actions, expenses, packing checks, and itinerary stops are fully synchronized with SQLite and server."
            actionTitle="Refresh Queue"
            onAction={loadQueue}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {mutations.map((mut) => (
            <Card key={mut.id} style={styles.mutationCard}>
              <View style={styles.mutationHeader}>
                <Badge
                  label={mut.mutationType.replace(/_/g, " ")}
                  variant="ocean"
                />
                <Badge
                  label={mut.status}
                  variant={getStatusBadgeVariant(mut.status)}
                  style={{ marginLeft: 6 }}
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Ionicons
                  name="key-outline"
                  size={12}
                  color={AppColors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.idempKey} numberOfLines={1}>
                  {mut.idempotencyKey}
                </Text>
              </View>

              <Text style={styles.mutationDetails}>
                Created: {new Date(mut.createdAt).toLocaleTimeString()} •
                Retries: {mut.retryCount}
              </Text>

              {mut.lastError ? (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="warning-outline"
                    size={13}
                    color={AppColors.danger}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.errorText}>{mut.lastError}</Text>
                </View>
              ) : null}
            </Card>
          ))}

          {/* Clean Up Utilities */}
          <View style={styles.utilityRow}>
            {syncedCount > 0 ? (
              <Button
                title="Clear Synced Actions"
                onPress={handleClearSynced}
                variant="outline"
                style={{ flex: 1, marginRight: AppSpacing.sm }}
              />
            ) : null}
            <Button
              title="Reset Demo Data"
              onPress={handleResetDatabase}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.darkBackground,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: AppSpacing.base,
    paddingTop: AppSpacing.base,
    paddingBottom: AppSpacing.xs,
  },
  headerTitle: {
    ...AppTypography.h2,
    color: AppColors.textPrimary,
  },
  headerSubtitle: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  syncButton: {
    minHeight: 38,
    paddingHorizontal: AppSpacing.md,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: AppSpacing.base,
    paddingVertical: AppSpacing.sm,
    gap: AppSpacing.md,
  },
  statCard: {
    flex: 1,
    padding: AppSpacing.md,
  },
  statLabel: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  networkToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statValue: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
  },
  statSub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl * 2,
  },
  mutationCard: {
    marginBottom: AppSpacing.md,
  },
  mutationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: AppSpacing.xs,
  },
  idempKey: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  mutationDetails: {
    ...AppTypography.caption,
    color: AppColors.textMuted,
  },
  errorBox: {
    marginTop: AppSpacing.sm,
    padding: AppSpacing.sm,
    backgroundColor: "rgba(225, 29, 72, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.unsettledBorder,
  },
  errorText: {
    ...AppTypography.tiny,
    color: AppColors.unsettled,
  },
  utilityRow: {
    flexDirection: "row",
    marginTop: AppSpacing.base,
    marginBottom: AppSpacing.xl,
  },
});
