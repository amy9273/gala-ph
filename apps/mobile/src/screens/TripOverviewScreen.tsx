import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { CardSkeleton } from "../components/ui/SkeletonLoader";
import { ErrorState } from "../components/ui/ErrorState";
import { CurrencyDisplay } from "../components/ui/CurrencyDisplay";
import { tripRepository } from "../lib/sqlite/repositories/trip.repository";
import { itineraryRepository } from "../lib/sqlite/repositories/itinerary.repository";
import { expenseRepository } from "../lib/sqlite/repositories/expense.repository";
import type { LocalTrip, LocalItineraryItem, LocalExpense } from "../types";

interface TripOverviewScreenProps {
  onNavigateTab: (
    tab: "overview" | "itinerary" | "packing" | "expenses" | "sync",
  ) => void;
}

export const TripOverviewScreen: React.FC<TripOverviewScreenProps> = ({
  onNavigateTab,
}) => {
  const [trip, setTrip] = useState<LocalTrip | null>(null);
  const [itinerary, setItinerary] = useState<LocalItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allTrips = await tripRepository.getAll();
      const currentTrip = allTrips[0] || null;
      setTrip(currentTrip);

      if (currentTrip) {
        const itinItems = await itineraryRepository.getByTripId(currentTrip.id);
        const expItems = await expenseRepository.getByTripId(currentTrip.id);
        setItinerary(itinItems);
        setExpenses(expItems);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load local trip data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <CardSkeleton />
        <CardSkeleton />
      </ScrollView>
    );
  }

  if (error || !trip) {
    return (
      <View style={[styles.container, styles.center]}>
        <ErrorState
          title="Trip Not Found"
          message={error || "No local offline trip found in SQLite storage."}
          onRetry={loadData}
        />
      </View>
    );
  }

  const totalExpenseCentavos = expenses.reduce(
    (sum, e) => sum + e.totalCentavos,
    0,
  );
  const totalEstimatedCostCentavos = itinerary.reduce(
    (sum, i) => sum + i.estimatedCostCentavos,
    0,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Destination Hero Card */}
      <Card variant="oceanGlow" style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Badge label="Offline Cached" variant="offline" />
          <Badge label={`CODE: ${trip.inviteCode}`} variant="ocean" />
        </View>

        <Text style={styles.tripTitle}>{trip.title}</Text>
        <Text style={styles.destination}>📍 {trip.destination}</Text>

        <View style={styles.datesRow}>
          <Text style={styles.datesText}>
            🗓️ Oct 15 - Oct 18, 2026 • 4 Days, 3 Nights
          </Text>
        </View>

        <View style={styles.modeRow}>
          <Badge
            label={
              trip.travelMode === "HYBRID"
                ? "Convoy + Commuter Hybrid"
                : trip.travelMode
            }
            variant="commute"
          />
        </View>
      </Card>

      {/* Quick Spend & Estimation Metrics Bento */}
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Logged (KKB)</Text>
          <CurrencyDisplay
            centavos={totalExpenseCentavos}
            size="md"
            color={AppColors.accentSunset}
          />
          <Text style={styles.metricSub}>
            {expenses.length} expenses logged
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Est. Budget</Text>
          <CurrencyDisplay
            centavos={totalEstimatedCostCentavos}
            size="md"
            color={AppColors.brandOceanLight}
          />
          <Text style={styles.metricSub}>
            {itinerary.length} stops scheduled
          </Text>
        </Card>
      </View>

      {/* Barkada Roster */}
      <Card style={styles.rosterCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Barkada Roster</Text>
          <Badge label={`${trip.members.length} Members`} variant="neutral" />
        </View>

        {trip.members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.memberBadges}>
                {member.role === "TRIP_LEAD" ? (
                  <Badge label="Lead" variant="ocean" style={styles.tagBadge} />
                ) : null}
                {member.isDriver ? (
                  <Badge
                    label="Driver"
                    variant="autosweep"
                    style={styles.tagBadge}
                  />
                ) : null}
                {member.isNonDrinker ? (
                  <Badge
                    label="Non-Drinker"
                    variant="settled"
                    style={styles.tagBadge}
                  />
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </Card>

      {/* Quick Navigation Action Grid */}
      <Text style={styles.actionsHeader}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("itinerary")}
          style={[
            styles.actionTile,
            { backgroundColor: "rgba(2, 132, 199, 0.12)" },
          ]}
        >
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionTitle}>Itinerary</Text>
          <Text style={styles.actionSubtitle}>Offline timeline & stops</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("packing")}
          style={[
            styles.actionTile,
            { backgroundColor: "rgba(5, 150, 105, 0.12)" },
          ]}
        >
          <Text style={styles.actionIcon}>🎒</Text>
          <Text style={styles.actionTitle}>Bayanihan Packing</Text>
          <Text style={styles.actionSubtitle}>Shared gear checklist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("expenses")}
          style={[
            styles.actionTile,
            { backgroundColor: "rgba(234, 88, 12, 0.12)" },
          ]}
        >
          <Text style={styles.actionIcon}>🧾</Text>
          <Text style={styles.actionTitle}>KKB Ledger</Text>
          <Text style={styles.actionSubtitle}>Itemized bills & splits</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("sync")}
          style={[
            styles.actionTile,
            { backgroundColor: "rgba(148, 163, 184, 0.12)" },
          ]}
        >
          <Text style={styles.actionIcon}>⚡</Text>
          <Text style={styles.actionTitle}>Outbox Sync</Text>
          <Text style={styles.actionSubtitle}>Manage offline queue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.darkBackground,
  },
  content: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl * 2,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    marginBottom: AppSpacing.base,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.md,
  },
  tripTitle: {
    ...AppTypography.h1,
    color: AppColors.textPrimary,
    marginBottom: AppSpacing.xs,
  },
  destination: {
    ...AppTypography.bodyBold,
    color: AppColors.brandOceanLight,
    marginBottom: AppSpacing.sm,
  },
  datesRow: {
    marginBottom: AppSpacing.md,
  },
  datesText: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  modeRow: {
    flexDirection: "row",
  },
  metricsRow: {
    flexDirection: "row",
    gap: AppSpacing.md,
    marginBottom: AppSpacing.base,
  },
  metricCard: {
    flex: 1,
    padding: AppSpacing.md,
  },
  metricLabel: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    textTransform: "uppercase",
    marginBottom: AppSpacing.xs,
  },
  metricSub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: AppSpacing.xs,
  },
  rosterCard: {
    marginBottom: AppSpacing.base,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.md,
  },
  sectionTitle: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: AppSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.darkBorder,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.brandOceanDark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: AppSpacing.md,
  },
  avatarText: {
    ...AppTypography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  memberBadges: {
    flexDirection: "row",
    gap: AppSpacing.xs,
  },
  tagBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  actionsHeader: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
    marginBottom: AppSpacing.md,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.md,
  },
  actionTile: {
    width: "47.5%",
    borderRadius: AppSpacing.cardBorderRadius,
    padding: AppSpacing.base,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: AppSpacing.sm,
  },
  actionTitle: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
  },
});
