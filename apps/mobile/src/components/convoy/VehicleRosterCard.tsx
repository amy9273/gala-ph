import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Badge } from "../ui/Badge";
import type { ConvoyVehicleState } from "../../types";

interface VehicleRosterCardProps {
  vehicles: ConvoyVehicleState[];
  myVehicleId: string;
  onCallDriver?: (phone: string) => void;
}

export const VehicleRosterCard: React.FC<VehicleRosterCardProps> = ({
  vehicles,
  myVehicleId,
  onCallDriver,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.cardTitle}>🚗 CONVOY VEHICLE ROSTER</Text>

      <View style={styles.vehicleList}>
        {vehicles.map((v) => {
          const isMe = v.vehicleId === myVehicleId;
          return (
            <View
              key={v.vehicleId}
              style={[styles.vehicleRow, isMe && styles.myVehicleRow]}
            >
              <View style={styles.leftInfo}>
                <View style={styles.nameHeader}>
                  <Text
                    style={[styles.driverName, isMe && styles.myDriverName]}
                  >
                    {v.userName}
                  </Text>
                  {isMe && <Badge label="ME" variant="info" size="small" />}
                  {v.isStraggler && (
                    <Badge label="STRAGGLER" variant="warning" size="small" />
                  )}
                </View>

                <Text style={styles.vehicleModel}>{v.vehicleName}</Text>

                <View style={styles.telemetryPills}>
                  <Text style={styles.telemetryPillText}>
                    ⚡ {Math.round(v.speedKmh)} km/h
                  </Text>
                  {v.batteryLevel !== undefined && (
                    <Text style={styles.telemetryPillText}>
                      🔋 {v.batteryLevel}%
                    </Text>
                  )}
                  <Text style={styles.telemetryPillText}>
                    {isMe
                      ? "📍 Lead reference"
                      : v.relativePosition === "AHEAD"
                        ? `▲ +${v.distanceFromMeKm.toFixed(1)} km`
                        : `▼ -${v.distanceFromMeKm.toFixed(1)} km`}
                  </Text>
                </View>
              </View>

              <View style={styles.rightActions}>
                {v.driverPhone && !isMe && (
                  <TouchableOpacity
                    style={styles.callIconBtn}
                    onPress={() => onCallDriver?.(v.driverPhone!)}
                  >
                    <Text style={styles.callIconText}>📞</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
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
    marginTop: AppSpacing.md,
  },
  cardTitle: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: AppSpacing.md,
  },
  vehicleList: {
    gap: AppSpacing.sm,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.buttonBorderRadius,
    padding: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  myVehicleRow: {
    borderColor: AppColors.brandOceanLight,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
  },
  leftInfo: {
    flex: 1,
  },
  nameHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  driverName: {
    ...AppTypography.bodyBold,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  myDriverName: {
    color: AppColors.brandOceanLight,
  },
  vehicleModel: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  telemetryPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  telemetryPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: AppColors.textMuted,
    backgroundColor: AppColors.darkSurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rightActions: {
    marginLeft: AppSpacing.sm,
  },
  callIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(5, 150, 105, 0.2)",
    borderWidth: 1,
    borderColor: AppColors.natureEmerald,
    alignItems: "center",
    justifyContent: "center",
  },
  callIconText: {
    fontSize: 16,
  },
});
