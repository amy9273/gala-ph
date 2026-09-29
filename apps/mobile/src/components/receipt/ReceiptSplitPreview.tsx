import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { CurrencyDisplay } from "../ui/CurrencyDisplay";
import type { ReceiptSplitCalculation } from "../../services/receipt-ocr.service";

interface ReceiptSplitPreviewProps {
  calculation: ReceiptSplitCalculation;
  serviceChargeCentavos: number;
  taxCentavos: number;
}

export const ReceiptSplitPreview: React.FC<ReceiptSplitPreviewProps> = ({
  calculation,
  serviceChargeCentavos,
  taxCentavos,
}) => {
  return (
    <Card variant="oceanGlow" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Live KKB Split Summary</Text>
        {calculation.isConservationExact ? (
          <Badge label="Exact Math ✓" variant="settled" />
        ) : (
          <Badge label="Rounding Invariant" variant="unsettled" />
        )}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Grand Total (with SC/Tax)</Text>
        <CurrencyDisplay
          centavos={calculation.totalCentavos}
          size="lg"
          color={AppColors.accentSunset}
        />
      </View>

      {serviceChargeCentavos > 0 || taxCentavos > 0 ? (
        <View style={styles.feeSubRow}>
          <Text style={styles.feeSubText}>
            Includes{" "}
            {serviceChargeCentavos > 0
              ? `SC: ₱${(serviceChargeCentavos / 100).toFixed(2)} `
              : ""}
            {taxCentavos > 0 ? `• Tax: ₱${(taxCentavos / 100).toFixed(2)}` : ""}
            {" (Proportionately Apportioned)"}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Member Share Cards */}
      <View style={styles.membersGrid}>
        {calculation.memberSplits.map((member) => (
          <View key={member.userId} style={styles.memberShareRow}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.userName}</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.itemCount}>
                  {member.consumedItemCount} dish
                  {member.consumedItemCount === 1 ? "" : "es"}
                </Text>
                {member.isNonDrinker ? (
                  <Badge
                    label="Non-Drinker"
                    variant="settled"
                    style={styles.nonDrinkerBadge}
                  />
                ) : null}
              </View>
            </View>

            <CurrencyDisplay
              centavos={member.totalOwedCentavos}
              size="md"
              color={
                member.totalOwedCentavos > 0
                  ? AppColors.textPrimary
                  : AppColors.textMuted
              }
            />
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: AppSpacing.base,
    marginBottom: AppSpacing.base,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppSpacing.xs,
  },
  title: {
    ...AppTypography.h3,
    color: AppColors.textPrimary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: AppSpacing.xs,
  },
  totalLabel: {
    ...AppTypography.bodyBold,
    color: AppColors.textSecondary,
  },
  feeSubRow: {
    marginTop: 2,
  },
  feeSubText: {
    ...AppTypography.tiny,
    color: AppColors.brandOceanLight,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.darkBorder,
    marginVertical: AppSpacing.md,
  },
  membersGrid: {
    gap: AppSpacing.sm,
  },
  memberShareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.badgeBorderRadius,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemCount: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginRight: 6,
  },
  nonDrinkerBadge: {
    paddingVertical: 1,
    paddingHorizontal: 4,
  },
});
