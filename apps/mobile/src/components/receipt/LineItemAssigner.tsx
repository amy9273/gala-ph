import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Badge } from "../ui/Badge";
import { CurrencyDisplay } from "../ui/CurrencyDisplay";
import type { ParsedReceiptItem } from "../../services/receipt-ocr.service";
import type { LocalTripMember } from "../../types";

interface LineItemAssignerProps {
  item: ParsedReceiptItem;
  members: LocalTripMember[];
  onToggleUser: (userId: string) => void;
  onAssignAll: () => void;
  onAssignDrinkersOnly: () => void;
  onClear: () => void;
}

export const LineItemAssigner: React.FC<LineItemAssignerProps> = ({
  item,
  members,
  onToggleUser,
  onAssignAll,
  onAssignDrinkersOnly,
  onClear,
}) => {
  return (
    <View style={styles.card}>
      {/* Item Details Header */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={styles.itemName}>
            {item.quantity > 1 ? `${item.quantity}x ` : ""}
            {item.name}
          </Text>
          <View style={styles.badgeRow}>
            {item.isAlcohol ? (
              <Badge
                label="Alcohol / Bar"
                variant="unsettled"
                style={styles.tag}
              />
            ) : (
              <Badge label="Food & Dining" variant="ocean" style={styles.tag} />
            )}
            <Text style={styles.assignedCount}>
              {item.assignedUserIds.length} eater
              {item.assignedUserIds.length === 1 ? "" : "s"} assigned
            </Text>
          </View>
        </View>

        <CurrencyDisplay
          centavos={item.priceCentavos}
          size="md"
          color={AppColors.textPrimary}
        />
      </View>

      {/* Preset Action Buttons */}
      <View style={styles.presetsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAssignAll}
          style={styles.presetButton}
        >
          <Text style={styles.presetText}>All ({members.length})</Text>
        </TouchableOpacity>

        {item.isAlcohol ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onAssignDrinkersOnly}
            style={[styles.presetButton, styles.drinkerPresetButton]}
          >
            <Text style={[styles.presetText, styles.drinkerPresetText]}>
              🍺 Drinkers Only
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClear}
          style={styles.presetButton}
        >
          <Text style={styles.presetText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Member Avatar Toggle Chips */}
      <View style={styles.membersRow}>
        {members.map((member) => {
          const isAssigned = item.assignedUserIds.includes(member.userId);
          const isNonDrinker = member.isNonDrinker;

          return (
            <TouchableOpacity
              key={member.userId}
              activeOpacity={0.8}
              onPress={() => onToggleUser(member.userId)}
              style={[
                styles.memberChip,
                isAssigned && styles.memberChipSelected,
                item.isAlcohol && isNonDrinker && !isAssigned
                  ? styles.memberChipNonDrinker
                  : null,
              ]}
            >
              <View
                style={[
                  styles.avatarCircle,
                  isAssigned && styles.avatarCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitials,
                    isAssigned && styles.avatarInitialsSelected,
                  ]}
                >
                  {member.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>

              <View style={styles.memberNameArea}>
                <Text
                  style={[
                    styles.memberName,
                    isAssigned && styles.memberNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {member.name.split(" ")[0]}
                </Text>
                {isNonDrinker ? (
                  <Text style={styles.nonDrinkerTag}>No Alcohol</Text>
                ) : null}
              </View>

              {isAssigned ? <Text style={styles.checkIcon}>✓</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.cardBorderRadius,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: AppSpacing.sm,
  },
  titleArea: {
    flex: 1,
    marginRight: AppSpacing.sm,
  },
  itemName: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tag: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    marginRight: AppSpacing.sm,
  },
  assignedCount: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
  },
  presetsRow: {
    flexDirection: "row",
    gap: AppSpacing.xs,
    marginBottom: AppSpacing.sm,
  },
  presetButton: {
    backgroundColor: AppColors.darkSurface,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  presetText: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  drinkerPresetButton: {
    backgroundColor: "rgba(225, 29, 72, 0.12)",
    borderColor: AppColors.unsettledBorder,
  },
  drinkerPresetText: {
    color: AppColors.unsettled,
  },
  membersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.xs,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.darkSurface,
    borderRadius: 20,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    minHeight: 34,
  },
  memberChipSelected: {
    backgroundColor: "rgba(2, 132, 199, 0.2)",
    borderColor: AppColors.brandOceanLight,
  },
  memberChipNonDrinker: {
    opacity: 0.6,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.darkBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  avatarCircleSelected: {
    backgroundColor: AppColors.brandOcean,
  },
  avatarInitials: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },
  avatarInitialsSelected: {
    color: "#FFFFFF",
  },
  memberNameArea: {
    marginRight: 4,
  },
  memberName: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
  },
  memberNameSelected: {
    color: AppColors.textPrimary,
    fontWeight: "700",
  },
  nonDrinkerTag: {
    fontSize: 8,
    color: AppColors.natureEmerald,
    fontWeight: "700",
  },
  checkIcon: {
    color: AppColors.brandOceanLight,
    fontWeight: "800",
    fontSize: 12,
  },
});
