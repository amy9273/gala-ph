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
    tab: "overview" | "itinerary" | "packing" | "expenses" | "scanner",
  ) => void;
  triggerAction?: "create_trip" | null;
  onClearTriggerAction?: () => void;
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
  triggerAction,
  onClearTriggerAction,
}) => {
  const [allTrips, setAllTrips] = useState<LocalTrip[]>([]);
  const [trip, setTrip] = useState<LocalTrip | null>(null);
  const [assemblyPoint, setAssemblyPoint] = useState(
    "Shell Magallanes • 4:00 AM Departure",
  );
  const [itinerary, setItinerary] = useState<LocalItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [essentials, setEssentials] =
    useState<SharedEssentialItem[]>(DEFAULT_ESSENTIALS);
  const [members, setMembers] = useState<BarkadaMember[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isTripSwitcherOpen, setIsTripSwitcherOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);

  // Form States
  const [friendName, setFriendName] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editDates, setEditDates] = useState("");
  const [editAssembly, setEditAssembly] = useState("");

  const [createTitle, setCreateTitle] = useState("");
  const [createDestination, setCreateDestination] = useState("");
  const [createDates, setCreateDates] = useState("Oct 25 – Oct 28, 2026");
  const [createAssembly, setCreateAssembly] = useState(
    "Centris EDSA • 3:30 AM Departure",
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async (targetTripId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const trips = await tripRepository.getAll();
      setAllTrips(trips);

      const activeTrip = targetTripId
        ? trips.find((t) => t.id === targetTripId) || trips[0] || null
        : trips[0] || null;

      setTrip(activeTrip);

      if (activeTrip) {
        const [itinItems, expItems, packItems] = await Promise.all([
          itineraryRepository.getByTripId(activeTrip.id),
          expenseRepository.getByTripId(activeTrip.id),
          packingRepository.getByTripId(activeTrip.id),
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
        } else {
          setEssentials(DEFAULT_ESSENTIALS);
        }

        setMembers(
          activeTrip.members.map((m) => ({
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

  // React to trigger action from center action sheet
  useEffect(() => {
    if (triggerAction === "create_trip") {
      setIsCreateTripOpen(true);
      onClearTriggerAction?.();
    }
  }, [triggerAction]);

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
    setIsAddFriendOpen(false);
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

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!trip) return;
    setEditTitle(trip.title);
    setEditDestination(trip.destination);
    setEditDates("Oct 15 – Oct 18, 2026");
    setEditAssembly(assemblyPoint);
    setIsEditTripOpen(true);
  };

  // Save Edit Trip
  const handleSaveEdit = async () => {
    if (!trip || !editTitle.trim() || !editDestination.trim()) return;

    const updated: LocalTrip = {
      ...trip,
      title: editTitle.trim(),
      destination: editDestination.trim(),
      updatedAt: new Date().toISOString(),
    };

    await tripRepository.upsert(updated);
    setTrip(updated);
    if (editAssembly.trim()) {
      setAssemblyPoint(editAssembly.trim());
    }
    setAllTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setIsEditTripOpen(false);
    showToast("Trip details updated successfully!");
  };

  // Save Create Trip
  const handleSaveCreate = async () => {
    if (!createTitle.trim() || !createDestination.trim()) return;

    const code =
      createDestination
        .substring(0, 4)
        .toUpperCase()
        .replace(/[^A-Z]/g, "") + Math.floor(10 + Math.random() * 90);

    const newTrip: LocalTrip = {
      id: `trip-local-${Date.now()}`,
      title: createTitle.trim(),
      destination: createDestination.trim(),
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-04T00:00:00.000Z",
      travelMode: "PRIVATE_CAR",
      inviteCode: code,
      isOfflineCached: true,
      members: [
        {
          id: `user-${Date.now()}`,
          userId: `user-${Date.now()}`,
          name: "Juan (You)",
          role: "TRIP_LEAD",
          isDriver: true,
          isNonDrinker: false,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    await tripRepository.upsert(newTrip);
    setAllTrips((prev) => [newTrip, ...prev]);
    setTrip(newTrip);
    if (createAssembly.trim()) {
      setAssemblyPoint(createAssembly.trim());
    }
    setItinerary([]);
    setExpenses([]);
    setEssentials(DEFAULT_ESSENTIALS);
    setMembers([
      { id: newTrip.members[0]!.id, name: "Juan (You)", role: "TRIP_LEAD" },
    ]);

    setIsCreateTripOpen(false);
    setCreateTitle("");
    setCreateDestination("");
    showToast(`"${newTrip.title}" created! Ready for your barkada.`);
  };

  // Switch Trip
  const handleSelectTrip = async (selectedTrip: LocalTrip) => {
    setIsTripSwitcherOpen(false);
    await loadData(selectedTrip.id);
    showToast(`Switched to "${selectedTrip.title}"`);
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
          onRetry={() => loadData()}
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
      {/* TOP HEADER: TRIP SWITCHER & NEW TRIP BUTTON              */}
      {/* ======================================================== */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsTripSwitcherOpen(true)}
          style={styles.tripSwitcherButton}
        >
          <View style={styles.switcherIconWrapper}>
            <Ionicons name="compass" size={16} color={AppColors.brandPrimary} />
          </View>
          <View style={styles.switcherTextWrapper}>
            <Text style={styles.switcherLabel}>SWITCH GALA</Text>
            <View style={styles.switcherTitleRow}>
              <Text style={styles.switcherTitle} numberOfLines={1}>
                {trip.destination}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={AppColors.textSecondary}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsCreateTripOpen(true)}
          style={styles.newTripBtn}
        >
          <Ionicons
            name="add"
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 2 }}
          />
          <Text style={styles.newTripBtnText}>New Gala</Text>
        </TouchableOpacity>
      </View>

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

          {/* EDIT TRIP BUTTON */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenEdit}
            style={styles.editTripBtn}
          >
            <Ionicons
              name="pencil"
              size={12}
              color={AppColors.brandPrimary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.editTripBtnText}>Edit Trip</Text>
          </TouchableOpacity>
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
          <Text style={styles.assemblyText}>{assemblyPoint}</Text>
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
            onPress={() => setIsAddFriendOpen(true)}
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
            onPress={() => setIsAddFriendOpen(true)}
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

        {/* Primary Highlighted CTA: Split Expense */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab("scanner")}
          style={styles.splitCtaButton}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
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
      {/* MODAL 1: TRIP SWITCHER MODAL                              */}
      {/* ======================================================== */}
      <Modal
        visible={isTripSwitcherOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTripSwitcherOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Switch Active Gala</Text>
              <TouchableOpacity
                onPress={() => setIsTripSwitcherOpen(false)}
                style={styles.closeIconBtn}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={AppColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Select a trip to load its itinerary, expenses, and packing list.
            </Text>

            <ScrollView style={styles.tripListScroll}>
              {allTrips.map((t) => {
                const isCurrent = t.id === trip.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => handleSelectTrip(t)}
                    style={[
                      styles.tripOptionRow,
                      isCurrent && styles.tripOptionRowActive,
                    ]}
                  >
                    <View style={styles.tripOptionInfo}>
                      <Text style={styles.tripOptionTitle}>{t.title}</Text>
                      <Text style={styles.tripOptionDest}>{t.destination}</Text>
                    </View>
                    {isCurrent ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={AppColors.brandPrimary}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={AppColors.textMuted}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setIsTripSwitcherOpen(false);
                setIsCreateTripOpen(true);
              }}
              style={styles.modalCreateBtn}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={AppColors.brandPrimary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.modalCreateBtnText}>Create New Gala</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: EDIT TRIP MODAL                                  */}
      {/* ======================================================== */}
      <Modal
        visible={isEditTripOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditTripOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Trip Details</Text>
            <Text style={styles.modalSub}>
              Update your trip name, destination, or departure coordinates.
            </Text>

            <Text style={styles.inputLabel}>Trip Title</Text>
            <TextInput
              style={styles.inputField}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="e.g. Elyu Long Weekend Gala"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Destination</Text>
            <TextInput
              style={styles.inputField}
              value={editDestination}
              onChangeText={setEditDestination}
              placeholder="e.g. San Juan, La Union"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Dates</Text>
            <TextInput
              style={styles.inputField}
              value={editDates}
              onChangeText={setEditDates}
              placeholder="e.g. Oct 15 – Oct 18, 2026"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Assembly / Meetup Point</Text>
            <TextInput
              style={styles.inputField}
              value={editAssembly}
              onChangeText={setEditAssembly}
              placeholder="e.g. Shell Magallanes • 4:00 AM Departure"
              placeholderTextColor={AppColors.textMuted}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setIsEditTripOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: CREATE TRIP MODAL                                */}
      {/* ======================================================== */}
      <Modal
        visible={isCreateTripOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCreateTripOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Plan a New Gala</Text>
            <Text style={styles.modalSub}>
              Set up your road trip essentials and invite your barkada.
            </Text>

            <Text style={styles.inputLabel}>Trip Title</Text>
            <TextInput
              style={styles.inputField}
              value={createTitle}
              onChangeText={setCreateTitle}
              placeholder="e.g. Baler Surf & Camp Weekend"
              placeholderTextColor={AppColors.textMuted}
              autoFocus
            />

            <Text style={styles.inputLabel}>Destination</Text>
            <TextInput
              style={styles.inputField}
              value={createDestination}
              onChangeText={setCreateDestination}
              placeholder="e.g. Sabang Beach, Baler, Aurora"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Dates</Text>
            <TextInput
              style={styles.inputField}
              value={createDates}
              onChangeText={setCreateDates}
              placeholder="e.g. Nov 12 – Nov 15, 2026"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Assembly / Meetup Point</Text>
            <TextInput
              style={styles.inputField}
              value={createAssembly}
              onChangeText={setCreateAssembly}
              placeholder="e.g. Total NLEX Marilao • 3:30 AM"
              placeholderTextColor={AppColors.textMuted}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setIsCreateTripOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveCreate}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Create Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: ADD FRIEND MODAL                                 */}
      {/* ======================================================== */}
      <Modal
        visible={isAddFriendOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAddFriendOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Friend to Barkada</Text>
            <Text style={styles.modalSub}>
              Enter their name to include them in expenses and trip sharing.
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
                onPress={() => setIsAddFriendOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddFriend}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Add Friend</Text>
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
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: AppSpacing.md,
  },
  tripSwitcherButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginRight: 10,
  },
  switcherIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: AppColors.brandPrimaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  switcherTextWrapper: {
    flex: 1,
  },
  switcherLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: AppColors.brandPrimary,
    letterSpacing: 0.5,
  },
  switcherTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  switcherTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginRight: 4,
    maxWidth: 160,
  },
  newTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.brandPrimary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: AppColors.brandPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  newTripBtnText: {
    ...AppTypography.caption,
    fontWeight: "700",
    color: "#FFFFFF",
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
  editTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  editTripBtnText: {
    fontSize: 11,
    fontWeight: "700",
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
    borderRadius: 10,
    paddingVertical: 14,
    shadowColor: AppColors.natureEmerald,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  splitCtaButtonText: {
    ...AppTypography.bodyBold,
    fontSize: 15,
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
    marginRight: 10,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: AppSpacing.base,
  },
  modalBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: AppSpacing.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    maxHeight: "85%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeIconBtn: {
    padding: 4,
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
  inputLabel: {
    ...AppTypography.tiny,
    fontWeight: "700",
    color: AppColors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
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
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    ...AppTypography.bodyBold,
    color: AppColors.textSecondary,
  },
  modalSaveBtn: {
    backgroundColor: AppColors.brandPrimary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalSaveText: {
    ...AppTypography.bodyBold,
    color: "#FFFFFF",
  },
  tripListScroll: {
    maxHeight: 220,
    marginBottom: AppSpacing.md,
  },
  tripOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.surfaceSecondary,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 8,
  },
  tripOptionRowActive: {
    borderColor: AppColors.brandPrimary,
    backgroundColor: AppColors.brandPrimaryBg,
  },
  tripOptionInfo: {
    flex: 1,
  },
  tripOptionTitle: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
  },
  tripOptionDest: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  modalCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: AppColors.brandPrimaryLight,
    backgroundColor: AppColors.brandPrimaryBg,
  },
  modalCreateBtnText: {
    ...AppTypography.bodyBold,
    color: AppColors.brandPrimary,
  },
});
