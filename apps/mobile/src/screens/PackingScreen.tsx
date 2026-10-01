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
import { packingRepository } from "../lib/sqlite/repositories/packing.repository";
import { outboxSyncService } from "../services/outbox-sync.service";
import type { LocalPackingItem } from "../types";
import type { PackingCategory } from "@gala-ph/shared";

import { Ionicons } from "@expo/vector-icons";

const CATEGORIES: Array<{
  key: PackingCategory | "ALL";
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "ALL", label: "All Items", icon: "layers-outline" },
  { key: "GEAR", label: "Gear", icon: "construct-outline" },
  { key: "FOOD_DRINKS", label: "Food & Drinks", icon: "restaurant-outline" },
  { key: "MEDICAL", label: "Medical", icon: "medkit-outline" },
  { key: "COMFORT", label: "Comfort", icon: "bed-outline" },
  { key: "DOCUMENTS", label: "Docs / Cash", icon: "wallet-outline" },
];

export const PackingScreen: React.FC = () => {
  const [items, setItems] = useState<LocalPackingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    PackingCategory | "ALL"
  >("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [willBringMyself, setWillBringMyself] = useState(true);

  const loadPacking = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await packingRepository.getByTripId("trip-elyu-demo");
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load packing items",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPacking();
  }, []);

  const handleTogglePack = async (item: LocalPackingItem) => {
    // Optimistic toggle
    const updated = await outboxSyncService.togglePackingItemOptimistic(item);
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
  };

  const handleClaimItem = async (item: LocalPackingItem) => {
    const updated: LocalPackingItem = {
      ...item,
      assignedToName: "Juan (You)",
    };
    const saved = await outboxSyncService.addPackingItemOptimistic(updated);
    setItems((prev) => prev.map((it) => (it.id === item.id ? saved : it)));
  };

  const handleAddItem = async () => {
    if (!itemName.trim()) return;

    const newItem: LocalPackingItem = {
      id: `pack-local-${Date.now()}`,
      tripId: "trip-elyu-demo",
      itemName: itemName.trim(),
      category: "GEAR",
      quantity: 1,
      assignedToName: willBringMyself ? "Juan (You)" : undefined,
      isPacked: false,
      isSynced: false,
      isLocalDraft: true,
    };

    const saved = await outboxSyncService.addPackingItemOptimistic(newItem);
    setItems((prev) => [...prev, saved]);
    setIsModalOpen(false);
    setItemName("");
    setWillBringMyself(true);
  };

  const filteredItems =
    selectedCategory === "ALL"
      ? items
      : items.filter((it) => it.category === selectedCategory);

  const packedCount = items.filter((it) => it.isPacked).length;
  const progressPercent =
    items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header & Progress */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bayanihan Packing</Text>
          <Text style={styles.headerSubtitle}>
            {packedCount} / {items.length} items packed ({progressPercent}%)
          </Text>
        </View>
        <Button
          title="+ Add Gear"
          onPress={() => setIsModalOpen(true)}
          variant="nature"
          style={styles.addButton}
        />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => setSelectedCategory(cat.key)}
            style={[
              styles.categoryChip,
              selectedCategory === cat.key && styles.categoryChipActive,
            ]}
          >
            <Ionicons
              name={cat.icon}
              size={14}
              color={
                selectedCategory === cat.key
                  ? "#FFFFFF"
                  : AppColors.textSecondary
              }
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.key && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 4-State UI Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      ) : error ? (
        <View style={styles.center}>
          <ErrorState message={error} onRetry={loadPacking} />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.content}>
          <EmptyState
            title="No Items in this Category"
            description="Add shared gear, coolers, medical kits, or drinks to divide packing responsibilities."
            actionTitle="+ Add Item"
            onAction={() => setIsModalOpen(true)}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => handleTogglePack(item)}
            >
              <Card
                variant={item.isPacked ? "secondary" : "default"}
                style={[
                  styles.itemCard,
                  item.isPacked ? styles.itemCardPacked : null,
                ]}
              >
                <View style={styles.checkboxWrapper}>
                  <View
                    style={[
                      styles.checkbox,
                      item.isPacked ? styles.checkboxChecked : null,
                    ]}
                  >
                    {item.isPacked ? (
                      <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                    ) : null}
                  </View>
                </View>

                <View style={styles.itemDetails}>
                  <Text
                    style={[
                      styles.itemName,
                      item.isPacked ? styles.itemNamePacked : null,
                    ]}
                  >
                    {item.itemName}
                  </Text>

                  <View style={styles.itemMeta}>
                    <Text style={styles.metaText}>Qty: {item.quantity}</Text>

                    {item.assignedToName ? (
                      <View style={styles.assignedBadge}>
                        <Ionicons
                          name="person-circle-outline"
                          size={12}
                          color={AppColors.natureEmerald}
                          style={{ marginRight: 3 }}
                        />
                        <Text style={styles.assignedBadgeText}>
                          {item.assignedToName}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleClaimItem(item)}
                        style={styles.unassignedBadge}
                      >
                        <Ionicons
                          name="hand-left-outline"
                          size={11}
                          color={AppColors.brandPrimary}
                          style={{ marginRight: 3 }}
                        />
                        <Text style={styles.unassignedBadgeText}>
                          Tap to Claim
                        </Text>
                      </TouchableOpacity>
                    )}

                    {!item.isSynced ? (
                      <Badge
                        label="Queued"
                        variant="offline"
                        style={{ marginLeft: 6 }}
                      />
                    ) : null}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Add Gear Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Shared Gear</Text>
            <Text style={styles.modalSub}>
              List an item for the trip. You or a friend can claim it.
            </Text>

            <Text style={styles.inputLabel}>Item Name</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g. Coleman 40L Cooler, Butane Stove, Extension Cord"
              placeholderTextColor={AppColors.textMuted}
              autoFocus
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setWillBringMyself((v) => !v)}
              style={styles.claimToggleRow}
            >
              <View
                style={[
                  styles.toggleCheckbox,
                  willBringMyself && styles.toggleCheckboxActive,
                ]}
              >
                {willBringMyself && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>I will bring this</Text>
                <Text style={styles.toggleSub}>
                  {willBringMyself
                    ? "Assigned to Juan (You)"
                    : "Open for anyone in the barkada to claim"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setIsModalOpen(false)}
                variant="outline"
                style={{ flex: 1, marginRight: AppSpacing.sm }}
              />
              <Button
                title="Add Item"
                onPress={handleAddItem}
                variant="nature"
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
  addButton: {
    minHeight: 38,
    paddingHorizontal: AppSpacing.md,
  },
  progressContainer: {
    height: 4,
    backgroundColor: AppColors.darkSurfaceSecondary,
    marginHorizontal: AppSpacing.base,
    marginVertical: AppSpacing.sm,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: AppColors.natureEmerald,
  },
  categoryScroll: {
    paddingHorizontal: AppSpacing.base,
    paddingVertical: AppSpacing.xs,
    gap: AppSpacing.xs,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  categoryChipActive: {
    backgroundColor: AppColors.natureEmerald,
    borderColor: AppColors.natureEmeraldLight,
  },
  categoryChipIcon: {
    marginRight: 4,
    fontSize: 12,
  },
  categoryChipText: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  categoryChipTextActive: {
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
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: AppSpacing.sm,
    padding: AppSpacing.md,
  },
  itemCardPacked: {
    opacity: 0.6,
  },
  checkboxWrapper: {
    marginRight: AppSpacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: AppColors.natureEmerald,
    borderColor: AppColors.natureEmeraldLight,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  itemNamePacked: {
    textDecorationLine: "line-through",
    color: AppColors.textSecondary,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
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
  modalSub: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginBottom: AppSpacing.md,
  },
  claimToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: 8,
    padding: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    marginBottom: AppSpacing.lg,
  },
  toggleCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: AppSpacing.md,
  },
  toggleCheckboxActive: {
    backgroundColor: AppColors.brandPrimary,
    borderColor: AppColors.brandPrimary,
  },
  toggleTitle: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
  },
  toggleSub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: AppSpacing.sm,
  },
  assignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.natureEmeraldBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: AppSpacing.sm,
  },
  assignedBadgeText: {
    ...AppTypography.tiny,
    color: AppColors.natureEmerald,
    fontWeight: "700",
  },
  unassignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 90, 54, 0.10)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 90, 54, 0.25)",
    marginLeft: AppSpacing.sm,
  },
  unassignedBadgeText: {
    ...AppTypography.tiny,
    color: AppColors.brandPrimary,
    fontWeight: "700",
  },
});
