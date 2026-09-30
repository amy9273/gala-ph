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
import { CardSkeleton } from "../components/ui/SkeletonLoader";
import { ErrorState } from "../components/ui/ErrorState";
import { CurrencyDisplay } from "../components/ui/CurrencyDisplay";
import { tripRepository } from "../lib/sqlite/repositories/trip.repository";
import { itineraryRepository } from "../lib/sqlite/repositories/itinerary.repository";
import { expenseRepository } from "../lib/sqlite/repositories/expense.repository";
import { packingRepository } from "../lib/sqlite/repositories/packing.repository";
import type {
  LocalTrip,
  LocalItineraryItem,
  LocalExpense,
  LocalPackingItem,
} from "../types";

interface TripOverviewScreenProps {
  onNavigateTab: (
    tab:
      "overview" | "itinerary" | "convoy" | "expenses" | "packing" | "scanner",
  ) => void;
}

export const TripOverviewScreen: React.FC<TripOverviewScreenProps> = ({
  onNavigateTab,
}) => {
  const [trip, setTrip] = useState<LocalTrip | null>(null);
  const [itinerary, setItinerary] = useState<LocalItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [packingItems, setPackingItems] = useState<LocalPackingItem[]>([]);
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
        const [itinItems, expItems, packItems] = await Promise.all([
          itineraryRepository.getByTripId(currentTrip.id),
          expenseRepository.getByTripId(currentTrip.id),
          packingRepository.getByTripId(currentTrip.id),
        ]);
        setItinerary(itinItems);
        setExpenses(expItems);
        setPackingItems(packItems);
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
  const packedCount = packingItems.filter((i) => i.isPacked).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Destination Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroAccentBar} />
        <View style={styles.heroContent}>
          <View style={styles.heroHeader}>
            <View style={styles.offlineBadge}>
              <Ionicons
                name="cloud-done-outline"
                size={13}
                color={AppColors.accentGold}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.offlineBadgeText}>OFFLINE CACHED</Text>
            </View>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>CODE: {trip.inviteCode}</Text>
            </View>
          </View>

          <Text style={styles.tripTitle}>{trip.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons
              name="location"
              size={16}
              color={AppColors.brandPrimary}
              style={styles.metaIcon}
            />
            <Text style={styles.destinationText}>{trip.destination}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={15}
              color={AppColors.textSecondary}
              style={styles.metaIcon}
            />
            <Text style={styles.datesText}>
              Oct 15 - Oct 18, 2026 • 4 Days, 3 Nights
            </Text>
          </View>

          <View style={styles.modeRow}>
            <View style={styles.modeBadge}>
              <Ionicons
                name="car-outline"
                size={13}
                color={AppColors.natureEmerald}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.modeBadgeText}>
                {trip.travelMode === "HYBRID"
                  ? "Convoy + Commuter Hybrid"
                  : trip.travelMode}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Spend & Estimation Metrics Bento */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Logged (KKB)</Text>
          <CurrencyDisplay
            centavos={totalExpenseCentavos}
            size="md"
            color={AppColors.brandPrimary}
          />
          <Text style={styles.metricSub}>
            {expenses.length} expenses logged
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Est. Budget</Text>
          <CurrencyDisplay
            centavos={totalEstimatedCostCentavos}
            size="md"
            color={AppColors.textPrimary}
          />
          <Text style={styles.metricSub}>
            {itinerary.length} stops scheduled
          </Text>
        </View>
      </View>

      {/* Primary Action Button: Scan Dining Receipt */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onNavigateTab("scanner")}
        style={styles.scanActionButton}
      >
        <View style={styles.scanIconWrapper}>
          <Ionicons name="camera" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.scanTextWrapper}>
          <Text style={styles.scanActionTitle}>Scan Dining Receipt</Text>
          <Text style={styles.scanActionSubtitle}>
            OCR line-item extraction with non-drinker exclusion
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={AppColors.textSecondary}
        />
      </TouchableOpacity>

      {/* Bayanihan Packing Progress Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onNavigateTab("packing")}
        style={styles.packingCard}
      >
        <View style={styles.packingHeader}>
          <View style={styles.packingTitleRow}>
            <Ionicons
              name="checkbox-outline"
              size={18}
              color={AppColors.natureEmerald}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.sectionTitle}>Bayanihan Packing</Text>
          </View>
          <Text style={styles.packingCount}>
            {packedCount} / {packingItems.length || 6} packed
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${
                  packingItems.length > 0
                    ? Math.round((packedCount / packingItems.length) * 100)
                    : 60
                }%`,
              },
            ]}
          />
        </View>
        <Text style={styles.packingSub}>
          Shared gear checklist: cooler, first-aid kit, powerbank
        </Text>
      </TouchableOpacity>

      {/* Barkada Roster */}
      <View style={styles.rosterCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Barkada Roster</Text>
          <View style={styles.memberCountBadge}>
            <Text style={styles.memberCountText}>
              {trip.members.length} Members
            </Text>
          </View>
        </View>

        {trip.members.map((member, idx) => (
          <View
            key={member.id}
            style={[
              styles.memberRow,
              idx === trip.members.length - 1 && styles.memberRowLast,
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.memberBadges}>
                {member.role === "TRIP_LEAD" ? (
                  <View style={[styles.roleTag, styles.roleLead]}>
                    <Text style={[styles.roleText, styles.roleLeadText]}>
                      Lead
                    </Text>
                  </View>
                ) : null}
                {member.isDriver ? (
                  <View style={[styles.roleTag, styles.roleDriver]}>
                    <Text style={[styles.roleText, styles.roleDriverText]}>
                      Driver
                    </Text>
                  </View>
                ) : null}
                {member.isNonDrinker ? (
                  <View style={[styles.roleTag, styles.roleNonDrinker]}>
                    <Text style={[styles.roleText, styles.roleNonDrinkerText]}>
                      Non-Drinker
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Navigation Action Grid */}
      <Text style={styles.actionsHeader}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("itinerary")}
          style={styles.actionTile}
        >
          <View
            style={[
              styles.actionIconContainer,
              { backgroundColor: "rgba(255, 90, 54, 0.12)" },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={AppColors.brandPrimary}
            />
          </View>
          <Text style={styles.actionTitle}>Itinerary</Text>
          <Text style={styles.actionSubtitle}>Timeline & stops</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("convoy")}
          style={styles.actionTile}
        >
          <View
            style={[
              styles.actionIconContainer,
              { backgroundColor: "rgba(245, 158, 11, 0.12)" },
            ]}
          >
            <Ionicons
              name="navigate-outline"
              size={20}
              color={AppColors.accentGold}
            />
          </View>
          <Text style={styles.actionTitle}>Convoy HUD</Text>
          <Text style={styles.actionSubtitle}>Radar & SOS beacon</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("expenses")}
          style={styles.actionTile}
        >
          <View
            style={[
              styles.actionIconContainer,
              { backgroundColor: "rgba(16, 185, 129, 0.12)" },
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={AppColors.natureEmerald}
            />
          </View>
          <Text style={styles.actionTitle}>KKB Ledger</Text>
          <Text style={styles.actionSubtitle}>Bills & GCash split</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("packing")}
          style={styles.actionTile}
        >
          <View
            style={[
              styles.actionIconContainer,
              { backgroundColor: "rgba(156, 163, 175, 0.12)" },
            ]}
          >
            <Ionicons
              name="bag-check-outline"
              size={20}
              color={AppColors.textSecondary}
            />
          </View>
          <Text style={styles.actionTitle}>Gear Checklist</Text>
          <Text style={styles.actionSubtitle}>Shared packing</Text>
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
    backgroundColor: AppColors.darkSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    marginBottom: AppSpacing.base,
    overflow: "hidden",
  },
  heroAccentBar: {
    height: 3,
    backgroundColor: AppColors.brandPrimary,
  },
  heroContent: {
    padding: AppSpacing.base,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.md,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: AppColors.accentGold,
    letterSpacing: 0.5,
  },
  codeBadge: {
    backgroundColor: AppColors.darkSurfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: AppColors.textSecondary,
    letterSpacing: 0.5,
  },
  tripTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaIcon: {
    marginRight: 6,
  },
  destinationText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.brandPrimary,
  },
  datesText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  modeRow: {
    marginTop: 6,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.natureEmerald,
  },
  metricsRow: {
    flexDirection: "row",
    gap: AppSpacing.md,
    marginBottom: AppSpacing.base,
  },
  metricCard: {
    flex: 1,
    backgroundColor: AppColors.darkSurface,
    borderRadius: 12,
    padding: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 11,
    color: AppColors.textMuted,
    marginTop: 4,
  },
  scanActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.darkSurface,
    borderRadius: 12,
    padding: AppSpacing.base,
    borderWidth: 1,
    borderColor: "rgba(255, 90, 54, 0.35)",
    marginBottom: AppSpacing.base,
  },
  scanIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: AppSpacing.md,
  },
  scanTextWrapper: {
    flex: 1,
  },
  scanActionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  scanActionSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  packingCard: {
    backgroundColor: AppColors.darkSurface,
    borderRadius: 12,
    padding: AppSpacing.base,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    marginBottom: AppSpacing.base,
  },
  packingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  packingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  packingCount: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.natureEmerald,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: AppColors.natureEmerald,
    borderRadius: 3,
  },
  packingSub: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  rosterCard: {
    backgroundColor: AppColors.darkSurface,
    borderRadius: 12,
    padding: AppSpacing.base,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    marginBottom: AppSpacing.base,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  memberCountBadge: {
    backgroundColor: AppColors.darkSurfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  memberCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: AppSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.darkBorder,
  },
  memberRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 90, 54, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 54, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: AppSpacing.md,
  },
  avatarText: {
    fontSize: 13,
    color: AppColors.brandPrimary,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  memberBadges: {
    flexDirection: "row",
    gap: AppSpacing.xs,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "700",
  },
  roleLead: {
    backgroundColor: "rgba(255, 90, 54, 0.12)",
  },
  roleLeadText: {
    color: AppColors.brandPrimary,
  },
  roleDriver: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  roleDriverText: {
    color: AppColors.accentGold,
  },
  roleNonDrinker: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  roleNonDrinkerText: {
    color: AppColors.natureEmerald,
  },
  actionsHeader: {
    fontSize: 15,
    fontWeight: "700",
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
    backgroundColor: AppColors.darkSurface,
    borderRadius: 12,
    padding: AppSpacing.base,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  actionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: AppSpacing.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },
});
