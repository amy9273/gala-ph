import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";
import { CardSkeleton } from "../components/ui/SkeletonLoader";
import { ErrorState } from "../components/ui/ErrorState";
import { CurrencyDisplay } from "../components/ui/CurrencyDisplay";
import { tripRepository } from "../lib/sqlite/repositories/trip.repository";
import { itineraryRepository } from "../lib/sqlite/repositories/itinerary.repository";
import { expenseRepository } from "../lib/sqlite/repositories/expense.repository";
import { packingRepository } from "../lib/sqlite/repositories/packing.repository";
import type { UserRole } from "@gala-ph/shared";
import type { LocalTrip, LocalItineraryItem, LocalExpense } from "../types";

interface TripOverviewScreenProps {
  onNavigateTab: (
    tab: "overview" | "itinerary" | "expenses" | "packing" | "scanner",
  ) => void;
}

interface BarkadaMember {
  id: string;
  name: string;
  role: UserRole;
}

interface SharedEssentialItem {
  id: string;
  name: string;
  claimedBy: string | null;
  isPacked: boolean;
}

const DEFAULT_ESSENTIALS: SharedEssentialItem[] = [
  {
    id: "ess-1",
    name: "50L Ice Chest / Cooler",
    claimedBy: "Juan",
    isPacked: true,
  },
  {
    id: "ess-2",
    name: "Portable Butane Stove & Grill",
    claimedBy: null,
    isPacked: false,
  },
  {
    id: "ess-3",
    name: "First Aid Kit & Meds",
    claimedBy: "Maria",
    isPacked: true,
  },
  {
    id: "ess-4",
    name: "Bluetooth Beach Speaker",
    claimedBy: null,
    isPacked: false,
  },
];

export const TripOverviewScreen: React.FC<TripOverviewScreenProps> = ({
  onNavigateTab,
}) => {
  const [trip, setTrip] = useState<LocalTrip | null>(null);
  const [itinerary, setItinerary] = useState<LocalItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [essentials, setEssentials] =
    useState<SharedEssentialItem[]>(DEFAULT_ESSENTIALS);
  const [members, setMembers] = useState<BarkadaMember[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Add Friend Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [friendName, setFriendName] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

        if (packItems.length > 0) {
          setEssentials(
            packItems.slice(0, 4).map((p) => ({
              id: p.id,
              name: p.itemName,
              claimedBy: p.assignedToName || null,
              isPacked: p.isPacked,
            })),
          );
        }

        setMembers(
          currentTrip.members.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
          })),
        );
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

  const handleShareTrip = () => {
    const code = trip?.inviteCode || "ELYU26";
    showToast(
      `Trip link copied! "Uy tara Elyu! Join with code ${code}: https://gala.ph/join/${code}"`,
    );
  };

  const handleAddFriend = () => {
    if (!friendName.trim()) return;
    const newMember: BarkadaMember = {
      id: `user-${Date.now()}`,
      name: friendName.trim(),
      role: "MEMBER",
    };
    setMembers((prev) => [...prev, newMember]);
    setFriendName("");
    setIsAddModalOpen(false);
    showToast(`${newMember.name} added to the barkada!`);
  };

  const handleToggleClaim = (itemId: string) => {
    setEssentials((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (!item.claimedBy) {
          showToast(`Claimed ${item.name}! You're bringing this.`);
          return { ...item, claimedBy: "You" };
        }
        return {
          ...item,
          isPacked: !item.isPacked,
        };
      }),
    );
  };

  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <CardSkeleton />
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
          message={error || "No offline trip available. Connect to sync."}
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
  const headCount = members.length || 1;
  const estPerHeadCentavos = Math.round(
    (totalEstimatedCostCentavos || 1400000) / headCount,
  );
  const packedCount = essentials.filter((e) => e.isPacked).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={AppColors.natureEmerald}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* ======================================================== */}
      {/* CARD 1: THE TRIP CARD (Where & When)                      */}
      {/* ======================================================== */}
      <View style={styles.card}>
        <View style={styles.cardTopBar}>
          <View style={styles.badgeRow}>
            <View style={styles.offlinePill}>
              <Ionicons
                name="cloud-done-outline"
                size={12}
                color={AppColors.accentGold}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.offlinePillText}>OFFLINE READY</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                showToast(`Code ${trip.inviteCode} copied to clipboard!`)
              }
              style={styles.codePill}
            >
              <Text style={styles.codePillText}>CODE: {trip.inviteCode}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.tripTitle}>{trip.title}</Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="location"
            size={16}
            color={AppColors.brandPrimary}
            style={styles.infoIcon}
          />
          <Text style={styles.destinationText}>{trip.destination}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={AppColors.textSecondary}
            style={styles.infoIcon}
          />
          <Text style={styles.metaSub}>
            Oct 15 – Oct 18, 2026 • 4 Days, 3 Nights
          </Text>
        </View>

        <View style={styles.assemblyBox}>
          <Ionicons
            name="flag-outline"
            size={14}
            color={AppColors.brandPrimary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.assemblyText}>
            Assembly: Shell Magallanes • 4:00 AM Departure
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleShareTrip}
          style={styles.shareTripButton}
        >
          <Ionicons
            name="share-social-outline"
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.shareTripButtonText}>
            Share Invite to Group Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* CARD 2: BARKADA & QUICK SPLIT (Who & Money)              */}
      {/* ======================================================== */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Barkada</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{members.length} Joined</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsAddModalOpen(true)}
            style={styles.addFriendBtn}
          >
            <Ionicons
              name="person-add-outline"
              size={13}
              color={AppColors.brandPrimary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.addFriendBtnText}>+ Add Friend</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Avatar Stack */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarStack}
        >
          {members.map((m) => (
            <View key={m.id} style={styles.avatarItem}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {m.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.avatarName} numberOfLines={1}>
                {m.name.split(" ")[0]}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setIsAddModalOpen(true)}
            style={styles.avatarItemAdd}
          >
            <Ionicons name="add" size={18} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>

        {/* Budget & Split Metrics Bento */}
        <View style={styles.splitBox}>
          <View style={styles.splitStat}>
            <Text style={styles.splitLabel}>Est. Ambagan</Text>
            <CurrencyDisplay
              centavos={estPerHeadCentavos}
              size="md"
              color={AppColors.brandPrimary}
            />
            <Text style={styles.splitSub}>per person</Text>
          </View>

          <View style={styles.splitDivider} />

          <View style={styles.splitStat}>
            <Text style={styles.splitLabel}>Total Logged</Text>
            <CurrencyDisplay
              centavos={totalExpenseCentavos}
              size="md"
              color={AppColors.textPrimary}
            />
            <Text style={styles.splitSub}>
              {expenses.length} expenses on record
            </Text>
          </View>
        </View>

        {/* Primary CTA: Split Expense */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("scanner")}
          style={styles.splitCtaButton}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.splitCtaButtonText}>
            + Split Expense / Scan Receipt
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* CARD 3: SHARED ESSENTIALS (Claim It Checklist)           */}
      {/* ======================================================== */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardTitle}>Shared Essentials</Text>
            <Text style={styles.essentialsCount}>
              {packedCount}/{essentials.length} Packed
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateTab("packing")}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.essentialsSub}>
          Tap an item to claim responsibility or toggle packed.
        </Text>

        <View style={styles.essentialsList}>
          {essentials.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleToggleClaim(item.id)}
              style={[
                styles.essentialRow,
                item.isPacked && styles.essentialRowPacked,
              ]}
            >
              <View
                style={[
                  styles.checkCircle,
                  item.isPacked && styles.checkCirclePacked,
                ]}
              >
                {item.isPacked && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>

              <View style={styles.essentialInfo}>
                <Text
                  style={[
                    styles.essentialName,
                    item.isPacked && styles.essentialNamePacked,
                  ]}
                >
                  {item.name}
                </Text>
              </View>

              <View
                style={[
                  styles.claimBadge,
                  item.claimedBy ? styles.claimBadgeClaimed : null,
                ]}
              >
                <Ionicons
                  name={item.claimedBy ? "person-outline" : "hand-left-outline"}
                  size={11}
                  color={
                    item.claimedBy
                      ? AppColors.natureEmerald
                      : AppColors.brandPrimary
                  }
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.claimBadgeText,
                    item.claimedBy ? styles.claimBadgeTextClaimed : null,
                  ]}
                >
                  {item.claimedBy || "Tap to Claim"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ======================================================== */}
      {/* QUICK SHORTCUTS ROW                                      */}
      {/* ======================================================== */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          onPress={() => onNavigateTab("itinerary")}
          style={styles.shortcutTile}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={AppColors.brandPrimary}
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.shortcutTitle}>Itinerary</Text>
          <Text style={styles.shortcutSub}>{itinerary.length} stops</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigateTab("packing")}
          style={styles.shortcutTile}
        >
          <Ionicons
            name="bag-check"
            size={18}
            color={AppColors.accentGold}
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.shortcutTitle}>Packing</Text>
          <Text style={styles.shortcutSub}>
            {packedCount}/{essentials.length} packed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigateTab("expenses")}
          style={styles.shortcutTile}
        >
          <Ionicons
            name="wallet"
            size={18}
            color={AppColors.natureEmerald}
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.shortcutTitle}>KKB Ledger</Text>
          <Text style={styles.shortcutSub}>GCash settle</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Add Friend Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Friend to Barkada</Text>
            <Text style={styles.modalSub}>
              Enter their name to add them to expenses and trip sharing.
            </Text>

            <TextInput
              style={styles.inputField}
              value={friendName}
              onChangeText={setFriendName}
              placeholder="Friend's Name (e.g. Bea, Carlos)"
              placeholderTextColor={AppColors.textMuted}
              autoFocus
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddFriend}
                style={styles.modalAddBtn}
              >
                <Text style={styles.modalAddText}>Add Friend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl * 2,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 150, 105, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.35)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: AppSpacing.md,
  },
  toastText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.natureEmerald,
    flex: 1,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: AppSpacing.base,
    marginBottom: AppSpacing.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217, 119, 6, 0.10)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.3)",
  },
  offlinePillText: {
    ...AppTypography.tiny,
    color: AppColors.accentGold,
  },
  codePill: {
    backgroundColor: AppColors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  codePillText: {
    ...AppTypography.tiny,
    color: AppColors.brandPrimary,
  },
  tripTitle: {
    ...AppTypography.h2,
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 6,
  },
  destinationText: {
    ...AppTypography.bodyBold,
    color: AppColors.brandPrimary,
  },
  metaSub: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  assemblyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: AppSpacing.md,
  },
  assemblyText: {
    ...AppTypography.caption,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  shareTripButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.brandPrimary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  shareTripButtonText: {
    ...AppTypography.bodyBold,
    color: "#FFFFFF",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
  },
  countBadge: {
    backgroundColor: AppColors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
  },
  addFriendBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.brandPrimaryLight,
  },
  addFriendBtnText: {
    ...AppTypography.caption,
    fontWeight: "700",
    color: AppColors.brandPrimary,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
    marginBottom: AppSpacing.md,
  },
  avatarItem: {
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 90, 54, 0.12)",
    borderWidth: 2,
    borderColor: AppColors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.brandPrimary,
  },
  avatarName: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    maxWidth: 50,
  },
  avatarItemAdd: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceSecondary,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: AppColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  splitBox: {
    flexDirection: "row",
    backgroundColor: AppColors.surfaceSecondary,
    borderRadius: 10,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.md,
  },
  splitStat: {
    flex: 1,
  },
  splitDivider: {
    width: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: AppSpacing.md,
  },
  splitLabel: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    marginBottom: 2,
  },
  splitSub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  splitCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.natureEmerald,
    borderRadius: 8,
    paddingVertical: 12,
  },
  splitCtaButtonText: {
    ...AppTypography.bodyBold,
    color: "#FFFFFF",
  },
  essentialsCount: {
    ...AppTypography.caption,
    fontWeight: "600",
    color: AppColors.natureEmerald,
  },
  viewAllBtn: {
    paddingVertical: 2,
  },
  viewAllText: {
    ...AppTypography.caption,
    fontWeight: "700",
    color: AppColors.brandPrimary,
  },
  essentialsSub: {
    ...AppTypography.caption,
    color: AppColors.textMuted,
    marginBottom: AppSpacing.sm,
  },
  essentialsList: {
    gap: 8,
  },
  essentialRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  essentialRowPacked: {
    opacity: 0.65,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AppColors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkCirclePacked: {
    backgroundColor: AppColors.natureEmerald,
    borderColor: AppColors.natureEmerald,
  },
  essentialInfo: {
    flex: 1,
  },
  essentialName: {
    ...AppTypography.bodyBold,
    fontSize: 13,
    color: AppColors.textPrimary,
  },
  essentialNamePacked: {
    textDecorationLine: "line-through",
    color: AppColors.textSecondary,
  },
  claimBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 90, 54, 0.10)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  claimBadgeClaimed: {
    backgroundColor: "rgba(5, 150, 105, 0.10)",
  },
  claimBadgeText: {
    ...AppTypography.tiny,
    color: AppColors.brandPrimary,
    fontWeight: "700",
  },
  claimBadgeTextClaimed: {
    color: AppColors.natureEmerald,
  },
  shortcutsRow: {
    flexDirection: "row",
    gap: 10,
  },
  shortcutTile: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  shortcutTitle: {
    ...AppTypography.caption,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  shortcutSub: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: AppSpacing.base,
  },
  modalBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    padding: AppSpacing.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  modalTitle: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginBottom: AppSpacing.md,
  },
  inputField: {
    backgroundColor: AppColors.surfaceSecondary,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
    marginBottom: AppSpacing.md,
  },
  modalActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  modalCancelText: {
    ...AppTypography.bodyBold,
    color: AppColors.textSecondary,
  },
  modalAddBtn: {
    backgroundColor: AppColors.brandPrimary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  modalAddText: {
    ...AppTypography.bodyBold,
    color: "#FFFFFF",
  },
});
