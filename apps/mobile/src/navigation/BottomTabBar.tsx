import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";

export type TabKey =
  | "overview"
  | "convoy"
  | "itinerary"
  | "scanner"
  | "packing"
  | "expenses"
  | "sync";

interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { key: "overview", label: "Trip", icon: "🏝️" },
  { key: "convoy", label: "Convoy", icon: "🚗" },
  { key: "itinerary", label: "Itinerary", icon: "🗺️" },
  { key: "scanner", label: "Scan OCR", icon: "📸" },
  { key: "packing", label: "Packing", icon: "🎒" },
  { key: "expenses", label: "Ledger", icon: "🧾" },
  { key: "sync", label: "Outbox", icon: "⚡" },
];

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingCount?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  pendingCount = 0,
}) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.key)}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
          >
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, isActive && styles.iconActive]}>
                {tab.icon}
              </Text>
              {tab.key === "sync" && pendingCount > 0 ? (
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
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: AppColors.darkSurface,
    borderTopWidth: 1,
    borderTopColor: AppColors.darkBorder,
    height: AppSpacing.bottomDockHeight,
    paddingBottom: AppSpacing.sm,
    paddingTop: AppSpacing.xs,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: AppSpacing.touchTargetMin,
  },
  tabButtonActive: {
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    position: "relative",
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
  },
  labelActive: {
    color: AppColors.brandOceanLight,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: AppColors.accentSunset,
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
});
