import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ReceiptReviewModal } from "../components/receipt/ReceiptReviewModal";
import {
  ReceiptOcrService,
  SAMPLE_RECEIPT_TEXTS,
  type ParsedReceipt,
} from "../services/receipt-ocr.service";
import { tripRepository } from "../lib/sqlite/repositories/trip.repository";
import type { LocalTripMember, LocalExpense } from "../types";

interface ReceiptScannerScreenProps {
  onExpenseAdded?: (expense: LocalExpense) => void;
  onNavigateToLedger?: () => void;
}

export const ReceiptScannerScreen: React.FC<ReceiptScannerScreenProps> = ({
  onExpenseAdded,
  onNavigateToLedger,
}) => {
  const [members, setMembers] = useState<LocalTripMember[]>([]);
  const [selectedPreset, setSelectedPreset] =
    useState<keyof typeof SAMPLE_RECEIPT_TEXTS>("tagpuanSanJuan");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(
    null,
  );
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    void tripRepository.getAll().then((trips) => {
      if (trips[0] && trips[0].members) {
        setMembers(trips[0].members);
      }
    });
  }, []);

  const handleCaptureAndProcess = () => {
    setIsProcessing(true);

    // Simulate camera capture & OCR processing latency
    setTimeout(() => {
      const rawReceiptText = SAMPLE_RECEIPT_TEXTS[selectedPreset];
      const parsed = ReceiptOcrService.parseReceiptText(
        rawReceiptText,
        members,
      );

      setParsedReceipt(parsed);
      setIsProcessing(false);
      setIsReviewOpen(true);
    }, 600);
  };

  const handleExpenseSaved = (savedExpense: LocalExpense) => {
    setIsReviewOpen(false);
    if (onExpenseAdded) onExpenseAdded(savedExpense);
    Alert.alert(
      "Receipt Saved Offline! 🧾",
      `"${savedExpense.title}" recorded to local SQLite. Added to Outbox Queue.`,
      [
        {
          text: "View Ledger",
          onPress: onNavigateToLedger,
        },
        { text: "Scan Another", style: "cancel" },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Receipt Scanner</Text>
          <Text style={styles.headerSubtitle}>
            Camera OCR line-item extraction
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setTorchOn(!torchOn)}
          style={[styles.torchButton, torchOn && styles.torchButtonActive]}
        >
          <Ionicons
            name={torchOn ? "flashlight" : "flashlight-outline"}
            size={16}
            color={torchOn ? AppColors.accentGold : AppColors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.torchText}>
            {torchOn ? "TORCH ON" : "TORCH OFF"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Camera Viewfinder Box */}
        <View style={styles.viewfinder}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />

          {isProcessing ? (
            <View style={styles.processingOverlay}>
              <ActivityIndicator
                color={AppColors.brandOceanLight}
                size="large"
              />
              <Text style={styles.processingText}>
                Extracting Philippine receipt items...
              </Text>
              <Text style={styles.processingSub}>
                Detecting dishes, SC 10%, VAT & alcohol tags
              </Text>
            </View>
          ) : (
            <View style={styles.viewfinderContent}>
              <Ionicons
                name="scan-outline"
                size={44}
                color={AppColors.brandPrimary}
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.viewfinderPrompt}>
                Align receipt inside frame
              </Text>
              <Text style={styles.viewfinderSub}>
                Auto-detects dish names, prices & service charges
              </Text>
            </View>
          )}
        </View>

        {/* Shutter Capture Button */}
        <View style={styles.shutterContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCaptureAndProcess}
            disabled={isProcessing}
            style={styles.shutterOuter}
          >
            <View style={styles.shutterInner}>
              <Ionicons name="camera" size={26} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.shutterLabel}>Snap & Auto-Extract</Text>
        </View>

        {/* Sample Receipt Fixtures for Simulator Testing */}
        <Card variant="secondary" style={styles.presetsCard}>
          <View style={styles.presetsHeader}>
            <Text style={styles.presetsTitle}>Sample Philippine Receipts</Text>
            <Badge label="Simulator Test" variant="ocean" />
          </View>

          <View style={styles.presetsRow}>
            <TouchableOpacity
              onPress={() => setSelectedPreset("tagpuanSanJuan")}
              style={[
                styles.presetChip,
                selectedPreset === "tagpuanSanJuan" && styles.presetChipActive,
              ]}
            >
              <Ionicons
                name="restaurant-outline"
                size={14}
                color={
                  selectedPreset === "tagpuanSanJuan"
                    ? "#FFFFFF"
                    : AppColors.brandPrimary
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.presetChipText,
                  selectedPreset === "tagpuanSanJuan" &&
                    styles.presetChipTextActive,
                ]}
              >
                Tagpuan Seafood & Beers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPreset("kahunaBrunch")}
              style={[
                styles.presetChip,
                selectedPreset === "kahunaBrunch" && styles.presetChipActive,
              ]}
            >
              <Ionicons
                name="cafe-outline"
                size={14}
                color={
                  selectedPreset === "kahunaBrunch"
                    ? "#FFFFFF"
                    : AppColors.accentGold
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.presetChipText,
                  selectedPreset === "kahunaBrunch" &&
                    styles.presetChipTextActive,
                ]}
              >
                Kahuna Beach Brunch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPreset("balerSurfside")}
              style={[
                styles.presetChip,
                selectedPreset === "balerSurfside" && styles.presetChipActive,
              ]}
            >
              <Ionicons
                name="flame-outline"
                size={14}
                color={
                  selectedPreset === "balerSurfside"
                    ? "#FFFFFF"
                    : AppColors.brandPrimary
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.presetChipText,
                  selectedPreset === "balerSurfside" &&
                    styles.presetChipTextActive,
                ]}
              >
                Baler Surfside Grill
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preset Text Preview */}
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              {SAMPLE_RECEIPT_TEXTS[selectedPreset]}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Review & Touch-to-Tag Modal */}
      <ReceiptReviewModal
        visible={isReviewOpen}
        receipt={parsedReceipt}
        members={members}
        onClose={() => setIsReviewOpen(false)}
        onSuccess={handleExpenseSaved}
      />
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
  torchButton: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  torchButtonActive: {
    backgroundColor: "rgba(217, 119, 6, 0.2)",
    borderColor: AppColors.autosweep,
  },
  torchText: {
    ...AppTypography.tiny,
    color: AppColors.textPrimary,
    fontWeight: "700",
  },
  content: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl * 2,
  },
  viewfinder: {
    height: 240,
    backgroundColor: "#060911",
    borderRadius: AppSpacing.cardBorderRadius,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: AppSpacing.base,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: AppColors.brandOceanLight,
  },
  cornerTopRight: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: AppColors.brandOceanLight,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: AppColors.brandOceanLight,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: AppColors.brandOceanLight,
  },
  viewfinderContent: {
    alignItems: "center",
  },
  viewfinderIcon: {
    fontSize: 40,
    marginBottom: AppSpacing.sm,
  },
  viewfinderPrompt: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  viewfinderSub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
  },
  processingOverlay: {
    alignItems: "center",
  },
  processingText: {
    ...AppTypography.bodyBold,
    color: AppColors.brandOceanLight,
    marginTop: AppSpacing.md,
  },
  processingSub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  shutterContainer: {
    alignItems: "center",
    marginBottom: AppSpacing.lg,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: AppColors.brandOceanLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.brandOcean,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterIcon: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  shutterLabel: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginTop: AppSpacing.xs,
    fontWeight: "600",
  },
  presetsCard: {
    padding: AppSpacing.base,
  },
  presetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.md,
  },
  presetsTitle: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
  },
  presetsRow: {
    gap: AppSpacing.xs,
    marginBottom: AppSpacing.md,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.darkSurface,
    borderRadius: AppSpacing.buttonBorderRadius,
    padding: AppSpacing.sm,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  presetChipActive: {
    borderColor: AppColors.brandOceanLight,
    backgroundColor: "rgba(2, 132, 199, 0.15)",
  },
  presetEmoji: {
    fontSize: 18,
    marginRight: AppSpacing.sm,
  },
  presetChipText: {
    ...AppTypography.bodyBold,
    color: AppColors.textSecondary,
  },
  presetChipTextActive: {
    color: AppColors.textPrimary,
  },
  previewBox: {
    backgroundColor: "#060911",
    borderRadius: AppSpacing.badgeBorderRadius,
    padding: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  previewText: {
    ...AppTypography.tiny,
    color: AppColors.brandOceanLight,
    fontFamily: "monospace",
    lineHeight: 16,
  },
});
