import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";

export type QuickActionType = "scan" | "itinerary" | "packing" | "create_trip";

interface QuickActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (action: QuickActionType) => void;
}

interface ActionOption {
  key: QuickActionType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  isPrimary?: boolean;
}

const ACTION_OPTIONS: ActionOption[] = [
  {
    key: "scan",
    title: "Split Expense / Scan Receipt",
    subtitle: "Camera OCR bill scan or log shared payment",
    icon: "receipt-outline",
    iconBg: AppColors.natureEmeraldBg,
    iconColor: AppColors.natureEmerald,
    isPrimary: true,
  },
  {
    key: "itinerary",
    title: "Add Itinerary Stop",
    subtitle: "Add scenic spot, restaurant, or activity stop",
    icon: "calendar-outline",
    iconBg: AppColors.brandPrimaryBg,
    iconColor: AppColors.brandPrimary,
  },
  {
    key: "packing",
    title: "Add Shared Packing Gear",
    subtitle: "Cooler, burner stove, tent, speaker to pack",
    icon: "bag-check-outline",
    iconBg: AppColors.accentGoldBg,
    iconColor: AppColors.accentGold,
  },
  {
    key: "create_trip",
    title: "Create New Trip",
    subtitle: "Start a new barkada road trip or beach gala",
    icon: "add-circle-outline",
    iconBg: AppColors.easytripBg,
    iconColor: AppColors.easytrip,
  },
];

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  visible,
  onClose,
  onSelectAction,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle Indicator */}
              <View style={styles.dragHandle} />

              <View style={styles.header}>
                <Text style={styles.sheetTitle}>Quick Actions</Text>
                <Text style={styles.sheetSub}>
                  Select an action to fast-track your road trip
                </Text>
              </View>

              <View style={styles.actionList}>
                {ACTION_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      onSelectAction(item.key);
                    }}
                    style={[
                      styles.actionRow,
                      item.isPrimary && styles.actionRowPrimary,
                    ]}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: item.iconBg },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={item.iconColor}
                      />
                    </View>

                    <View style={styles.actionContent}>
                      <View style={styles.titleRow}>
                        <Text style={styles.actionTitle}>{item.title}</Text>
                        {item.isPrimary && (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>MAIN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.actionSub}>{item.subtitle}</Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={AppColors.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: AppSpacing.md,
    paddingBottom: AppSpacing.xxxl,
    paddingHorizontal: AppSpacing.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: AppColors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: AppSpacing.base,
  },
  header: {
    marginBottom: AppSpacing.base,
  },
  sheetTitle: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
  },
  sheetSub: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  actionList: {
    gap: 10,
    marginBottom: AppSpacing.base,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceSecondary,
    padding: AppSpacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  actionRowPrimary: {
    borderColor: AppColors.natureEmerald,
    backgroundColor: "rgba(5, 150, 105, 0.04)",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: AppSpacing.md,
  },
  actionContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionTitle: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
  },
  primaryBadge: {
    backgroundColor: AppColors.natureEmerald,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  actionSub: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: AppColors.surfaceSecondary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cancelButtonText: {
    ...AppTypography.bodyBold,
    color: AppColors.textSecondary,
  },
});
