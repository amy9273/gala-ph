import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import type { ActiveSosState } from "../../services/convoy.service";

interface ActiveSosEmergencyBannerProps {
  activeSos: ActiveSosState;
  onPressBanner: () => void;
  onCallDriver?: (phone: string) => void;
}

export const ActiveSosEmergencyBanner: React.FC<
  ActiveSosEmergencyBannerProps
> = ({ activeSos, onPressBanner, onCallDriver }) => {
  return (
    <TouchableOpacity
      style={styles.bannerContainer}
      activeOpacity={0.85}
      onPress={onPressBanner}
    >
      <View style={styles.leftCol}>
        <View style={styles.beaconCircle}>
          <Text style={styles.beaconIcon}>🚨</Text>
        </View>

        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={styles.bannerTitle}>CONVOY EMERGENCY SOS</Text>
            <Text style={styles.livePulse}>● ACTIVE</Text>
          </View>
          <Text style={styles.reasonText}>
            {activeSos.reason.replace(/_/g, " ")}: {activeSos.userName}
          </Text>
          <Text style={styles.locationText}>
            📍 {activeSos.latitude.toFixed(4)}° N,{" "}
            {activeSos.longitude.toFixed(4)}° E
          </Text>
        </View>
      </View>

      <View style={styles.actionCol}>
        {activeSos.userPhone && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onCallDriver?.(activeSos.userPhone!)}
          >
            <Text style={styles.callButtonText}>📞 CALL</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.detailsChevron}>DETAILS ❯</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    paddingVertical: AppSpacing.md,
    paddingHorizontal: AppSpacing.base,
    borderRadius: AppSpacing.badgeBorderRadius,
    borderWidth: 2,
    borderColor: "#FECACA",
    marginHorizontal: AppSpacing.base,
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.sm,
    shadowColor: AppColors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  leftCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: AppSpacing.sm,
  },
  beaconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: AppSpacing.md,
  },
  beaconIcon: {
    fontSize: 20,
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  livePulse: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FEF08A",
  },
  reasonText: {
    ...AppTypography.bodyBold,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 1,
  },
  locationText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 1,
  },
  actionCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  callButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 4,
    borderRadius: 6,
  },
  callButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: AppColors.danger,
  },
  detailsChevron: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
