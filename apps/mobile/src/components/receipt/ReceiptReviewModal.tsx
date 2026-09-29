import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Button } from "../ui/Button";
import { LineItemAssigner } from "./LineItemAssigner";
import { ReceiptSplitPreview } from "./ReceiptSplitPreview";
import {
  ReceiptOcrService,
  type ParsedReceipt,
  type ParsedReceiptItem,
} from "../../services/receipt-ocr.service";
import { outboxSyncService } from "../../services/outbox-sync.service";
import type { LocalTripMember, LocalExpense } from "../../types";

interface ReceiptReviewModalProps {
  visible: boolean;
  receipt: ParsedReceipt | null;
  members: LocalTripMember[];
  onClose: () => void;
  onSuccess: (savedExpense: LocalExpense) => void;
}

export const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({
  visible,
  receipt,
  members,
  onClose,
  onSuccess,
}) => {
  if (!receipt) return null;

  const [title, setTitle] = useState(receipt.establishmentName);
  const [items, setItems] = useState<ParsedReceiptItem[]>(receipt.items);
  const [serviceChargePesos, setServiceChargePesos] = useState(
    (receipt.serviceChargeCentavos / 100).toFixed(2),
  );
  const [taxPesos, setTaxPesos] = useState(
    (receipt.taxCentavos / 100).toFixed(2),
  );
  const [paidByUserId, setPaidByUserId] = useState(
    members[0]?.userId || "user-miguel",
  );
  const [isSaving, setIsSaving] = useState(false);

  const scCentavos = Math.round(parseFloat(serviceChargePesos || "0") * 100);
  const txCentavos = Math.round(parseFloat(taxPesos || "0") * 100);

  // Live split calculation
  const splitCalculation = ReceiptOcrService.calculateSplits(
    items,
    members,
    scCentavos,
    txCentavos,
  );

  // Item Eater Assignment Handlers
  const handleToggleUser = (itemId: string, userId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const exists = it.assignedUserIds.includes(userId);
        const next = exists
          ? it.assignedUserIds.filter((id) => id !== userId)
          : [...it.assignedUserIds, userId];
        return { ...it, assignedUserIds: next };
      }),
    );
  };

  const handleAssignAll = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, assignedUserIds: members.map((m) => m.userId) }
          : it,
      ),
    );
  };

  const handleAssignDrinkersOnly = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              assignedUserIds: members
                .filter((m) => !m.isNonDrinker)
                .map((m) => m.userId),
            }
          : it,
      ),
    );
  };

  const handleClear = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, assignedUserIds: [] } : it,
      ),
    );
  };

  const handleSaveToLedger = async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a receipt title.");
      return;
    }

    setIsSaving(true);
    try {
      const payer =
        members.find((m) => m.userId === paidByUserId) || members[0];
      const payerName = payer ? payer.name : "Miguel Santos";

      const expenseId = `exp-ocr-${Date.now()}`;

      const newExpense: LocalExpense = {
        id: expenseId,
        tripId: "trip-elyu-demo",
        paidById: paidByUserId,
        paidByName: payerName,
        title: title.trim(),
        category: "FOOD_AND_DINING",
        totalCentavos: splitCalculation.totalCentavos,
        serviceTaxCentavos: scCentavos + txCentavos,
        isSynced: false,
        createdAt: new Date().toISOString(),
        items: items.map((it) => ({
          id: `item-${it.id}`,
          expenseId,
          name: it.name,
          priceCentavos: it.priceCentavos,
          quantity: it.quantity,
          consumerIds: it.assignedUserIds,
        })),
        splits: splitCalculation.memberSplits.map((ms, idx) => ({
          id: `split-${expenseId}-${idx}`,
          expenseId,
          userId: ms.userId,
          userName: ms.userName,
          amountCentavos: ms.totalOwedCentavos,
          isSettled: ms.userId === paidByUserId,
        })),
      };

      const saved = await outboxSyncService.addExpenseOptimistic(newExpense);
      onSuccess(saved);
    } catch {
      Alert.alert(
        "Save Failed",
        "Could not save receipt expense to offline SQLite.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Review OCR Scanned Receipt</Text>
            <Text style={styles.headerSubtitle}>
              Touch member avatars to tag who ate what
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Receipt Title */}
          <Text style={styles.sectionLabel}>Restaurant / Merchant Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Tagpuan San Juan"
            placeholderTextColor={AppColors.textMuted}
          />

          {/* Paid By Member Selector */}
          <Text style={styles.sectionLabel}>Who Paid the Bill?</Text>
          <View style={styles.payerRow}>
            {members.map((member) => (
              <TouchableOpacity
                key={member.userId}
                activeOpacity={0.8}
                onPress={() => setPaidByUserId(member.userId)}
                style={[
                  styles.payerChip,
                  paidByUserId === member.userId && styles.payerChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.payerChipText,
                    paidByUserId === member.userId &&
                      styles.payerChipTextActive,
                  ]}
                >
                  👤 {member.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Service Charge & Tax Input Fields */}
          <View style={styles.feeInputsRow}>
            <View style={{ flex: 1, marginRight: AppSpacing.sm }}>
              <Text style={styles.sectionLabel}>Service Charge (₱)</Text>
              <TextInput
                style={styles.input}
                value={serviceChargePesos}
                onChangeText={setServiceChargePesos}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Tax / VAT (₱)</Text>
              <TextInput
                style={styles.input}
                value={taxPesos}
                onChangeText={setTaxPesos}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
          </View>

          {/* Live Split Calculation Preview */}
          <ReceiptSplitPreview
            calculation={splitCalculation}
            serviceChargeCentavos={scCentavos}
            taxCentavos={txCentavos}
          />

          {/* Line Items List with Touch-to-Tag Assigner */}
          <Text style={styles.sectionHeading}>
            Line Items & Eaters ({items.length})
          </Text>

          {items.map((item) => (
            <LineItemAssigner
              key={item.id}
              item={item}
              members={members}
              onToggleUser={(userId) => handleToggleUser(item.id, userId)}
              onAssignAll={() => handleAssignAll(item.id)}
              onAssignDrinkersOnly={() => handleAssignDrinkersOnly(item.id)}
              onClear={() => handleClear(item.id)}
            />
          ))}

          {/* Bottom Save Action */}
          <Button
            title={
              isSaving ? "Saving to Offline Ledger..." : "Save to KKB Ledger"
            }
            onPress={handleSaveToLedger}
            variant="primary"
            isLarge
            isLoading={isSaving}
            style={styles.saveButton}
          />
        </ScrollView>
      </View>
    </Modal>
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
    paddingTop: AppSpacing.lg,
    paddingBottom: AppSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.darkBorder,
  },
  headerTitle: {
    ...AppTypography.h2,
    color: AppColors.textPrimary,
  },
  headerSubtitle: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.darkSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: AppColors.textSecondary,
    fontWeight: "700",
    fontSize: 16,
  },
  content: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl * 2,
  },
  sectionLabel: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  sectionHeading: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.md,
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
  payerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.xs,
    marginBottom: AppSpacing.md,
  },
  payerChip: {
    backgroundColor: AppColors.darkSurfaceSecondary,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  payerChipActive: {
    backgroundColor: AppColors.brandOcean,
    borderColor: AppColors.brandOceanLight,
  },
  payerChipText: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  payerChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  feeInputsRow: {
    flexDirection: "row",
  },
  saveButton: {
    marginTop: AppSpacing.base,
    marginBottom: AppSpacing.xxl,
  },
});
