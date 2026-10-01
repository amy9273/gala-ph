import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";

export type TabKey = "overview" | "itinerary" | "expenses";

interface TabItem {
  key: TabKey;
  label: string;
  iconOutline: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
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
    height: 68,
    paddingBottom: 8,
    paddingTop: 6,
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
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 16,
    position: "relative",
  },
  iconWrapperActive: {
    backgroundColor: AppColors.brandPrimaryBg,
  },
  label: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    fontSize: 11,
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
    right: 6,
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
});
