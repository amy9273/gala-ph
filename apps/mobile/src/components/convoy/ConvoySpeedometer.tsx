import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Badge } from "../ui/Badge";
import {
  getCompassHeading,
  getSpeedColorCategory,
} from "../../services/convoy.service";

interface ConvoySpeedometerProps {
  speedKmh: number;
  heading: number; // 0 - 360
  speedLimitKmh?: number;
  convoySpreadKm: number;
  distanceAheadKm?: number;
  distanceBehindKm?: number;
  isStragglerAlert?: boolean;
}

export const ConvoySpeedometer: React.FC<ConvoySpeedometerProps> = ({
  speedKmh,
  heading,
  speedLimitKmh = 100,
  convoySpreadKm,
  distanceAheadKm,
  distanceBehindKm,
  isStragglerAlert = false,
}) => {
  const speedCategory = getSpeedColorCategory(speedKmh);
  const compassText = getCompassHeading(heading);

  const speedColor =
    speedCategory === "overspeed"
      ? AppColors.danger
      : speedCategory === "expressway"
        ? AppColors.warning
        : AppColors.natureEmeraldLight;

  return (
    <View style={styles.container}>
      {/* Top Telemetry Header */}
      <View style={styles.topRow}>
        <View style={styles.compassContainer}>
          <Text style={styles.compassLabel}>HEADING</Text>
          <Text style={styles.compassValue}>
            🧭 {heading}° {compassText}
          </Text>
        </View>

        <View style={styles.speedLimitContainer}>
          <Text style={styles.speedLimitLabel}>EXPRESSWAY LIMIT</Text>
          <View style={styles.speedLimitBadge}>
            <Text style={styles.speedLimitText}>{speedLimitKmh}</Text>
          </View>
        </View>
      </View>

      {/* Main Giant Speedometer Dial */}
      <View style={styles.speedDialContainer}>
        <Text style={[styles.speedNumber, { color: speedColor }]}>
          {Math.round(speedKmh)}
        </Text>
        <Text style={styles.speedUnit}>KM/H</Text>

        {speedCategory === "overspeed" && (
          <Badge
            label="⚠️ OVERSPEED ADVISORY"
            variant="warning"
            size="small"
            style={styles.overspeedBadge}
          />
        )}
      </View>

      {/* Convoy Proximity Strip */}
      <View style={styles.proximityContainer}>
        <View style={styles.proximityCard}>
          <Text style={styles.proximityLabel}>LEAD VEHICLE</Text>
          <Text style={styles.proximityValue}>
            {distanceAheadKm !== undefined
              ? `▲ ${distanceAheadKm.toFixed(1)} km`
              : "👑 YOU ARE LEAD"}
          </Text>
        </View>

        <View style={styles.proximityDivider} />

        <View style={styles.proximityCard}>
          <Text style={styles.proximityLabel}>CONVOY SPREAD</Text>
          <Text
            style={[
              styles.proximityValue,
              isStragglerAlert && { color: AppColors.danger },
            ]}
          >
            📡 {convoySpreadKm.toFixed(1)} km
          </Text>
        </View>

        <View style={styles.proximityDivider} />

        <View style={styles.proximityCard}>
          <Text style={styles.proximityLabel}>TAIL VEHICLE</Text>
          <Text
            style={[
              styles.proximityValue,
              isStragglerAlert && { color: AppColors.offlineOrange },
            ]}
          >
            {distanceBehindKm !== undefined
              ? `▼ ${distanceBehindKm.toFixed(1)} km`
              : "🚗 LAST CAR"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.darkSurface,
    borderRadius: AppSpacing.cardBorderRadius,
    padding: AppSpacing.base,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    alignItems: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginBottom: AppSpacing.sm,
  },
  compassContainer: {
    alignItems: "flex-start",
  },
  compassLabel: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    letterSpacing: 1,
    fontWeight: "700",
  },
  compassValue: {
    ...AppTypography.bodyBold,
    color: AppColors.brandOceanLight,
    fontWeight: "700",
    marginTop: 2,
  },
  speedLimitContainer: {
    alignItems: "flex-end",
  },
  speedLimitLabel: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    letterSpacing: 1,
    fontWeight: "700",
  },
  speedLimitBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AppColors.danger,
    backgroundColor: AppColors.lightSurface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  speedLimitText: {
    fontSize: 13,
    fontWeight: "900",
    color: AppColors.textInverse,
  },
  speedDialContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: AppSpacing.md,
  },
  speedNumber: {
    fontSize: 76,
    lineHeight: 82,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  speedUnit: {
    ...AppTypography.caption,
    color: AppColors.textSecondary,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: -4,
  },
  overspeedBadge: {
    marginTop: AppSpacing.sm,
  },
  proximityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.badgeBorderRadius,
    paddingVertical: AppSpacing.md,
    paddingHorizontal: AppSpacing.sm,
    width: "100%",
    marginTop: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  proximityCard: {
    flex: 1,
    alignItems: "center",
  },
  proximityLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: AppColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  proximityValue: {
    ...AppTypography.caption,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  proximityDivider: {
    width: 1,
    height: 24,
    backgroundColor: AppColors.darkBorder,
  },
});
