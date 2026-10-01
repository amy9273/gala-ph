import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";

export type TabKey = "overview" | "itinerary" | "packing" | "expenses";

interface TabItem {
  key: TabKey;
  label: string;
  iconOutline: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}

const LEFT_TABS: TabItem[] = [
  {
    key: "overview",
    label: "Trip",
    iconOutline: "compass-outline",
    iconFilled: "compass",
  },
  {
    key: "itinerary",
    label: "Itinerary",
    iconOutline: "calendar-outline",
    iconFilled: "calendar",
  },
];

const RIGHT_TABS: TabItem[] = [
  {
    key: "packing",
    label: "Packing",
    iconOutline: "bag-check-outline",
    iconFilled: "bag-check",
  },
  {
    key: "expenses",
    label: "KKB Ledger",
    iconOutline: "receipt-outline",
    iconFilled: "receipt",
  },
];

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onPressCenterAction?: () => void;
  pendingCount?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onPressCenterAction,
  pendingCount = 0,
}) => {
  const renderTabButton = (tab: TabItem) => {
    const isActive = activeTab === tab.key;
    const iconName = isActive ? tab.iconFilled : tab.iconOutline;
    const iconColor = isActive
      ? AppColors.brandPrimary
      : AppColors.textSecondary;

    return (
      <TouchableOpacity
        key={tab.key}
        activeOpacity={0.7}
        onPress={() => onSelectTab(tab.key)}
        style={styles.tabButton}
      >
        <View
          style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}
        >
          <Ionicons name={iconName} size={22} color={iconColor} />
          {tab.key === "expenses" && pendingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left Tabs */}
      <View style={styles.tabGroup}>{LEFT_TABS.map(renderTabButton)}</View>

      {/* Center Highlighted Action Button (FAB) */}
      <View style={styles.centerActionWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPressCenterAction}
          style={styles.centerActionButton}
          accessibilityLabel="Quick actions: Split expense, add stop, add gear, or new trip"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Right Tabs */}
      <View style={styles.tabGroup}>{RIGHT_TABS.map(renderTabButton)}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    height: 72,
    paddingBottom: 10,
    paddingTop: 4,
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabGroup: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: AppSpacing.touchTargetMin,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "transparent",
    position: "relative",
  },
  iconWrapperActive: {
    backgroundColor: AppColors.brandPrimaryBg,
    borderRadius: 14,
  },
  label: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  labelActive: {
    color: AppColors.brandPrimary,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 4,
    backgroundColor: AppColors.accentGold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  centerActionWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  centerActionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
    shadowColor: AppColors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: AppColors.surface,
  },
});
