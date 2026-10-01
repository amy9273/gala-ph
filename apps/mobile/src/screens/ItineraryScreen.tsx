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
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CardSkeleton } from "../components/ui/SkeletonLoader";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { CurrencyDisplay } from "../components/ui/CurrencyDisplay";
import { Ionicons } from "@expo/vector-icons";
import { itineraryRepository } from "../lib/sqlite/repositories/itinerary.repository";
import { outboxSyncService } from "../services/outbox-sync.service";
import type { LocalItineraryItem } from "../types";

export const ItineraryScreen: React.FC = () => {
  const [items, setItems] = useState<LocalItineraryItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Stop Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dayNumber, setDayNumber] = useState("1");
  const [timeSlot, setTimeSlot] = useState("08:00 AM");
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [costPesos, setCostPesos] = useState("0");

  const loadItinerary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await itineraryRepository.getByTripId("trip-elyu-demo");
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load itinerary stops",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItinerary();
  }, []);

  const handleAddStop = async () => {
    if (!activity.trim() || !location.trim()) return;

    const parsedDay = parseInt(dayNumber, 10) || 1;
    const costCentavos = Math.round(parseFloat(costPesos || "0") * 100);

    const newStop: LocalItineraryItem = {
      id: `itin-local-${Date.now()}`,
      tripId: "trip-elyu-demo",
      dayNumber: parsedDay,
      timeSlot: timeSlot.trim() || "12:00 PM",
      activity: activity.trim(),
      location: location.trim(),
      estimatedCostCentavos: costCentavos,
      isSynced: false,
    };

    // Optimistically save to SQLite and outbox
    const saved = await outboxSyncService.addItineraryItemOptimistic(newStop);
    setItems((prev) => [...prev, saved]);
    setIsModalOpen(false);

    // Reset inputs
    setActivity("");
    setLocation("");
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 0;
    let hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const period = (match[3] || "").toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const filteredItems = (
    selectedDay ? items.filter((it) => it.dayNumber === selectedDay) : items
  )
    .slice()
    .sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot);
    });

  const totalCost = filteredItems.reduce(
    (sum, it) => sum + it.estimatedCostCentavos,
    0,
  );

  return (
    <View style={styles.container}>
      {/* Header & Controls */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Offline Itinerary</Text>
          <Text style={styles.headerSubtitle}>
            {filteredItems.length} stops scheduled
          </Text>
        </View>
        <Button
          title="+ Add Stop"
          onPress={() => setIsModalOpen(true)}
          variant="primary"
          style={styles.addButton}
        />
      </View>

      {/* Day Filter Pills */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setSelectedDay(null)}
          style={[
            styles.filterPill,
            selectedDay === null && styles.filterPillActive,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              selectedDay === null && styles.filterPillTextActive,
            ]}
          >
            All Days
          </Text>
        </TouchableOpacity>
        {[1, 2, 3, 4].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setSelectedDay(d)}
            style={[
              styles.filterPill,
              selectedDay === d && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedDay === d && styles.filterPillTextActive,
              ]}
            >
              Day {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 4-State UI Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      ) : error ? (
        <View style={styles.center}>
          <ErrorState message={error} onRetry={loadItinerary} />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.content}>
          <EmptyState
            title="No Stops Scheduled"
            description="Add itinerary stops, muster points, or meal activities to your offline road trip schedule."
            actionTitle="+ Add First Stop"
            onAction={() => setIsModalOpen(true)}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {filteredItems.map((item) => (
            <Card key={item.id} style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{item.timeSlot}</Text>
                </View>
                <View style={styles.badgeGroup}>
                  <Badge label={`Day ${item.dayNumber}`} variant="ocean" />
                  {!item.isSynced ? (
                    <Badge
                      label="Queued Sync"
                      variant="offline"
                      style={{ marginLeft: 4 }}
                    />
                  ) : null}
                </View>
              </View>

              <Text style={styles.activityTitle}>{item.activity}</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={AppColors.brandPrimary}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>

              <View style={styles.stopFooter}>
                <Text style={styles.estCostLabel}>Est. Budget:</Text>
                <CurrencyDisplay
                  centavos={item.estimatedCostCentavos}
                  size="sm"
                  color={AppColors.accentSunset}
                />
              </View>
            </Card>
          ))}

          {/* Subtotal Summary Card */}
          <Card variant="secondary" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {selectedDay
                ? `Day ${selectedDay} Total Budget`
                : "Total Trip Budget"}
            </Text>
            <CurrencyDisplay
              centavos={totalCost}
              size="lg"
              color={AppColors.brandOceanLight}
            />
          </Card>
        </ScrollView>
      )}

      {/* Add Stop Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Itinerary Stop</Text>

            <Text style={styles.inputLabel}>Day Number (1 - 4)</Text>
            <TextInput
              style={styles.input}
              value={dayNumber}
              onChangeText={setDayNumber}
              keyboardType="numeric"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Time Slot (e.g. 02:30 PM)</Text>
            <TextInput
              style={styles.input}
              value={timeSlot}
              onChangeText={setTimeSlot}
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Activity Name</Text>
            <TextInput
              style={styles.input}
              value={activity}
              onChangeText={setActivity}
              placeholder="e.g. Sunset Surf Lesson & Board Rental"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Mona Liza Point, Urbiztondo"
              placeholderTextColor={AppColors.textMuted}
            />

            <Text style={styles.inputLabel}>Estimated Cost (₱)</Text>
            <TextInput
              style={styles.input}
              value={costPesos}
              onChangeText={setCostPesos}
              keyboardType="numeric"
              placeholderTextColor={AppColors.textMuted}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setIsModalOpen(false)}
                variant="outline"
                style={{ flex: 1, marginRight: AppSpacing.sm }}
              />
              <Button
                title="Save Offline"
                onPress={handleAddStop}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: AppSpacing.sm,
  },
  headerTitle: {
    ...AppTypography.h2,
    color: AppColors.textPrimary,
  },
  headerSubtitle: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  addButton: {
    minHeight: 38,
    paddingHorizontal: AppSpacing.md,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: AppSpacing.base,
    paddingVertical: AppSpacing.sm,
    gap: AppSpacing.xs,
  },
  filterPill: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  filterPillActive: {
    backgroundColor: AppColors.brandOcean,
    borderColor: AppColors.brandOceanLight,
  },
  filterPillText: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  content: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl * 2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: AppSpacing.base,
  },
  stopCard: {
    marginBottom: AppSpacing.md,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.sm,
  },
  timeBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeText: {
    ...AppTypography.tiny,
    color: AppColors.brandOceanLight,
    fontWeight: "700",
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityTitle: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  locationText: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginBottom: AppSpacing.sm,
  },
  stopFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: AppColors.darkBorder,
    paddingTop: AppSpacing.sm,
  },
  estCostLabel: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    textTransform: "uppercase",
  },
  summaryCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: AppSpacing.base,
    marginTop: AppSpacing.sm,
  },
  summaryLabel: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: AppSpacing.base,
  },
  modalContent: {
    backgroundColor: AppColors.darkSurface,
    borderRadius: AppSpacing.cardBorderRadius,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    padding: AppSpacing.xl,
  },
  modalTitle: {
    ...AppTypography.h2,
    color: AppColors.textPrimary,
    marginBottom: AppSpacing.base,
  },
  inputLabel: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderColor: AppColors.darkBorder,
    borderWidth: 1,
    borderRadius: AppSpacing.buttonBorderRadius,
    color: AppColors.textPrimary,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    marginBottom: AppSpacing.md,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: AppSpacing.sm,
  },
});
