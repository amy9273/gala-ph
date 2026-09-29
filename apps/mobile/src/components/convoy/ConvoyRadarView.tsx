import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Badge } from "../ui/Badge";
import type { ConvoyVehicleState } from "../../types";

interface ConvoyRadarViewProps {
  vehicles: ConvoyVehicleState[];
  myVehicleId: string;
  onSelectVehicle?: (vehicle: ConvoyVehicleState) => void;
}

export const ConvoyRadarView: React.FC<ConvoyRadarViewProps> = ({
  vehicles,
  myVehicleId,
  onSelectVehicle,
}) => {
  // Sort vehicles from Lead (highest latitude) to Tail (lowest latitude)
  const sortedVehicles = [...vehicles].sort((a, b) => b.latitude - a.latitude);

  const getStatusBadge = (status: ConvoyVehicleState["quickStatus"]) => {
    switch (status) {
      case "EMERGENCY_STOP":
        return <Badge label="🚨 SOS STOP" variant="danger" size="small" />;
      case "REFUEL":
        return <Badge label="⛽ REFUEL" variant="warning" size="small" />;
      case "RESTROOM":
        return <Badge label="🚻 RESTROOM" variant="info" size="small" />;
      case "PULLING_OVER":
        return <Badge label="🛑 STOPPING" variant="warning" size="small" />;
      default:
        return <Badge label="🚗 CRUISING" variant="success" size="small" />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛰️ LIVE CONVOY RADAR</Text>
        <Text style={styles.headerSubtitle}>
          {vehicles.length} active vehicles on corridor
        </Text>
      </View>

      <View style={styles.radarTrack}>
        {/* Central Northbound Road Guide */}
        <View style={styles.roadCenterLine} />

        {sortedVehicles.map((vehicle, index) => {
          const isMe = vehicle.vehicleId === myVehicleId;
          const isLead = index === 0;
          const isTail = index === sortedVehicles.length - 1;
          const nextVehicle = sortedVehicles[index + 1];

          // Calculate gap between current and next vehicle
          const gapKm = nextVehicle
            ? Math.abs(vehicle.distanceFromMeKm - nextVehicle.distanceFromMeKm)
            : 0;

          return (
            <React.Fragment key={vehicle.vehicleId}>
              {/* Vehicle Node */}
              <TouchableOpacity
                style={[
                  styles.vehicleNode,
                  isMe && styles.myVehicleNode,
                  vehicle.isStraggler && styles.stragglerNode,
                  vehicle.quickStatus === "EMERGENCY_STOP" && styles.sosNode,
                ]}
                activeOpacity={0.8}
                onPress={() => onSelectVehicle?.(vehicle)}
              >
                {/* Avatar / Role Icon */}
                <View
                  style={[
                    styles.avatarCircle,
                    isMe && styles.myAvatarCircle,
                    vehicle.isStraggler && styles.stragglerAvatarCircle,
                  ]}
                >
                  <Text style={styles.avatarEmoji}>
                    {vehicle.quickStatus === "EMERGENCY_STOP"
                      ? "🚨"
                      : isLead
                        ? "👑"
                        : isMe
                          ? "🚘"
                          : "🚗"}
                  </Text>
                </View>

                {/* Info Column */}
                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.driverName, isMe && styles.myDriverName]}
                      numberOfLines={1}
                    >
                      {vehicle.userName}
                    </Text>
                    {isLead && (
                      <Badge label="LEAD" variant="info" size="small" />
                    )}
                    {isTail && !isLead && (
                      <Badge label="TAIL" variant="neutral" size="small" />
                    )}
                    {vehicle.isStraggler && (
                      <Badge
                        label="⚠️ STRAGGLER"
                        variant="warning"
                        size="small"
                      />
                    )}
                  </View>

                  <Text style={styles.vehicleDetails} numberOfLines={1}>
                    {vehicle.vehicleName} • ⚡ {Math.round(vehicle.speedKmh)}{" "}
                    km/h
                    {vehicle.batteryLevel !== undefined &&
                      ` • 🔋 ${vehicle.batteryLevel}%`}
                  </Text>
                </View>

                {/* Right Status / Distance */}
                <View style={styles.statusCol}>
                  {getStatusBadge(vehicle.quickStatus)}
                  <Text style={styles.distanceText}>
                    {isMe
                      ? "YOU"
                      : vehicle.relativePosition === "AHEAD"
                        ? `▲ +${vehicle.distanceFromMeKm.toFixed(1)} km`
                        : `▼ -${vehicle.distanceFromMeKm.toFixed(1)} km`}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Inter-Vehicle Distance Link */}
              {nextVehicle && (
                <View style={styles.interVehicleGap}>
                  <View style={styles.gapDashedLine} />
                  <View
                    style={[
                      styles.gapBadge,
                      gapKm >= 5.0 && styles.gapBadgeWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.gapText,
                        gapKm >= 5.0 && styles.gapTextWarning,
                      ]}
                    >
                      {gapKm >= 5.0 ? "⚠️ " : "↕ "}
                      {gapKm.toFixed(1)} km separation
                    </Text>
                  </View>
                </View>
              )}
            </React.Fragment>
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
  },
  header: {
    marginBottom: AppSpacing.md,
  },
  headerTitle: {
    ...AppTypography.bodyBold,
    fontWeight: "800",
    color: AppColors.brandOceanLight,
    letterSpacing: 1,
  },
  headerSubtitle: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  radarTrack: {
    position: "relative",
    paddingVertical: AppSpacing.sm,
  },
  roadCenterLine: {
    position: "absolute",
    left: 28,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: AppColors.darkBorder,
    zIndex: 0,
  },
  vehicleNode: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.buttonBorderRadius,
    padding: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    zIndex: 1,
  },
  myVehicleNode: {
    borderColor: AppColors.brandOceanLight,
    borderWidth: 1.5,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
  },
  stragglerNode: {
    borderColor: AppColors.warning,
  },
  sosNode: {
    borderColor: AppColors.danger,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.darkSurface,
    borderWidth: 1.5,
    borderColor: AppColors.darkBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: AppSpacing.md,
  },
  myAvatarCircle: {
    borderColor: AppColors.brandOceanLight,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
  },
  stragglerAvatarCircle: {
    borderColor: AppColors.warning,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  infoCol: {
    flex: 1,
    marginRight: AppSpacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  driverName: {
    ...AppTypography.bodyBold,
    fontWeight: "700",
    color: AppColors.textPrimary,
    flexShrink: 1,
  },
  myDriverName: {
    color: AppColors.brandOceanLight,
  },
  vehicleDetails: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  statusCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  distanceText: {
    ...AppTypography.tiny,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  interVehicleGap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: AppSpacing.sm,
    position: "relative",
  },
  gapDashedLine: {
    position: "absolute",
    left: 28,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: AppColors.darkBorder,
  },
  gapBadge: {
    backgroundColor: AppColors.darkSurface,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    borderRadius: 12,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 2,
    zIndex: 2,
  },
  gapBadgeWarning: {
    borderColor: AppColors.warning,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  gapText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  gapTextWarning: {
    color: AppColors.warning,
  },
});
