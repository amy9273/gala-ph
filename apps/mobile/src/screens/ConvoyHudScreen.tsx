import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { AppColors } from "../theme/colors";
import { AppSpacing } from "../theme/spacing";
import { AppTypography } from "../theme/typography";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ConvoySpeedometer } from "../components/convoy/ConvoySpeedometer";
import { ConvoyRadarView } from "../components/convoy/ConvoyRadarView";
import { VehicleRosterCard } from "../components/convoy/VehicleRosterCard";
import { QuickDriverStatusDock } from "../components/convoy/QuickDriverStatusDock";
import { RoadsideSosModal } from "../components/convoy/RoadsideSosModal";
import { ActiveSosEmergencyBanner } from "../components/convoy/ActiveSosEmergencyBanner";
import { convoyService, type ActiveSosState } from "../services/convoy.service";
import type {
  ConvoyVehicleState,
  ConvoyTelemetrySummary,
  DriverQuickStatus,
} from "../types";
import type { ConvoySosReason } from "@gala-ph/shared";

type ViewMode = "hud" | "radar";

export const ConvoyHudScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("hud");
  const [summary, setSummary] = useState<ConvoyTelemetrySummary>(() =>
    convoyService.recalculateTelemetrySummary(),
  );
  const [vehicles, setVehicles] = useState<ConvoyVehicleState[]>(() =>
    convoyService.getVehicles(),
  );
  const [myStatus, setMyStatus] = useState<DriverQuickStatus>("CRUISING");
  const [isSosModalVisible, setIsSosModalVisible] = useState(false);
  const [activeSos, setActiveSos] = useState<ActiveSosState | null>(() =>
    convoyService.getActiveSos(),
  );
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);

  // My current simulated coordinates
  const [mySpeed, setMySpeed] = useState(84);
  const [myHeading, setMyHeading] = useState(350);
  const [myLat, setMyLat] = useState(16.468);
  const [myLon, setMyLon] = useState(120.318);

  const refreshTelemetry = useCallback(() => {
    const s = convoyService.recalculateTelemetrySummary();
    setSummary(s);
    setVehicles(convoyService.getVehicles());
    setActiveSos(convoyService.getActiveSos());
  }, []);

  // Periodic simulation tick for live speed & convoy drift
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulatingDrive) {
      interval = setInterval(() => {
        // Vary speed slightly around 80-92 km/h
        const jitter = (Math.random() - 0.5) * 4;
        const newSpeed = Math.max(60, Math.min(110, mySpeed + jitter));
        setMySpeed(newSpeed);

        // Advance latitude northward along TPLEX/MacArthur Highway
        const newLat = myLat + 0.0005;
        setMyLat(newLat);

        convoyService.updateMyTelemetry({
          latitude: newLat,
          longitude: myLon,
          speedKmh: newSpeed,
          heading: myHeading,
          quickStatus: myStatus,
        });

        refreshTelemetry();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [
    isSimulatingDrive,
    mySpeed,
    myLat,
    myLon,
    myHeading,
    myStatus,
    refreshTelemetry,
  ]);

  const handleSelectStatus = async (status: DriverQuickStatus) => {
    setMyStatus(status);
    await convoyService.updateMyQuickStatus("trip-elyu-001", status);
    refreshTelemetry();
  };

  const handleTriggerSos = async (
    reason: ConvoySosReason,
    details?: string,
  ): Promise<ActiveSosState> => {
    const alert = await convoyService.triggerSos({
      tripId: "trip-elyu-001",
      userId: "usr-sarah-002",
      userName: "Sarah (Me)",
      userPhone: "+639189876543",
      reason,
      latitude: myLat,
      longitude: myLon,
      details,
    });
    setActiveSos(alert);
    setMyStatus("EMERGENCY_STOP");
    refreshTelemetry();
    return alert;
  };

  const handleResolveSos = async (alertId: string) => {
    await convoyService.resolveSos(
      "trip-elyu-001",
      alertId,
      "Sarah (Resolved by driver)",
    );
    setActiveSos(null);
    setMyStatus("CRUISING");
    refreshTelemetry();
  };

  const handleCallDriver = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Call Driver", `Dialing ${phone}`);
    });
  };

  const leadVehicle = summary.leadVehicle;
  const trailingVehicle = summary.trailingVehicle;

  const distanceAheadKm =
    leadVehicle && leadVehicle.vehicleId !== summary.myVehicleId
      ? leadVehicle.distanceFromMeKm
      : undefined;

  const distanceBehindKm =
    trailingVehicle && trailingVehicle.vehicleId !== summary.myVehicleId
      ? trailingVehicle.distanceFromMeKm
      : undefined;

  const hasStraggler = summary.stragglers.length > 0;

  return (
    <View style={styles.container}>
      {/* Top HUD Mode Switcher */}
      <View style={styles.topBar}>
        <View style={styles.tripBadgeCol}>
          <Text style={styles.topBarTitle}>🚘 CONVOY COCKPIT</Text>
          <Text style={styles.topBarSub}>Elyu Surf Weekend • TPLEX North</Text>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              viewMode === "hud" && styles.modeButtonActive,
            ]}
            onPress={() => setViewMode("hud")}
          >
            <Text
              style={[
                styles.modeButtonText,
                viewMode === "hud" && styles.modeButtonTextActive,
              ]}
            >
              HUD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              viewMode === "radar" && styles.modeButtonActive,
            ]}
            onPress={() => setViewMode("radar")}
          >
            <Text
              style={[
                styles.modeButtonText,
                viewMode === "radar" && styles.modeButtonTextActive,
              ]}
            >
              RADAR
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active SOS Emergency Banner (if any) */}
      {activeSos && (
        <ActiveSosEmergencyBanner
          activeSos={activeSos}
          onPressBanner={() => setIsSosModalVisible(true)}
          onCallDriver={handleCallDriver}
        />
      )}

      {/* Straggler Proximity Warning Banner */}
      {hasStraggler && !activeSos && (
        <View style={styles.stragglerBanner}>
          <Text style={styles.stragglerIcon}>⚠️</Text>
          <View style={styles.stragglerTextCol}>
            <Text style={styles.stragglerTitle}>STRAGGLER ADVISORY</Text>
            <Text style={styles.stragglerDesc}>
              {summary.stragglers.map((s) => s.userName).join(", ")} lagging
              &gt; 5 km behind pack. Slow down to maintain convoy formation.
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === "hud" ? (
          <>
            {/* Giant Speedometer & In-Car Dashboard */}
            <ConvoySpeedometer
              speedKmh={mySpeed}
              heading={myHeading}
              speedLimitKmh={100}
              convoySpreadKm={summary.convoySpreadKm}
              distanceAheadKm={distanceAheadKm}
              distanceBehindKm={distanceBehindKm}
              isStragglerAlert={hasStraggler}
            />

            {/* Quick Status & SOS Bottom Action Zone */}
            <QuickDriverStatusDock
              currentStatus={myStatus}
              onSelectStatus={handleSelectStatus}
              onTriggerSosModal={() => setIsSosModalVisible(true)}
              isSosActive={!!activeSos}
            />

            {/* Compact Radar Preview */}
            <ConvoyRadarView
              vehicles={vehicles}
              myVehicleId={summary.myVehicleId}
              onSelectVehicle={(v) => {
                if (v.driverPhone && v.vehicleId !== summary.myVehicleId) {
                  handleCallDriver(v.driverPhone);
                }
              }}
            />
          </>
        ) : (
          <>
            {/* Full Radar & Spatial View */}
            <ConvoyRadarView
              vehicles={vehicles}
              myVehicleId={summary.myVehicleId}
              onSelectVehicle={(v) => {
                if (v.driverPhone && v.vehicleId !== summary.myVehicleId) {
                  handleCallDriver(v.driverPhone);
                }
              }}
            />

            {/* Full Vehicle Roster */}
            <VehicleRosterCard
              vehicles={vehicles}
              myVehicleId={summary.myVehicleId}
              onCallDriver={handleCallDriver}
            />

            {/* Quick Driver Status */}
            <QuickDriverStatusDock
              currentStatus={myStatus}
              onSelectStatus={handleSelectStatus}
              onTriggerSosModal={() => setIsSosModalVisible(true)}
              isSosActive={!!activeSos}
            />
          </>
        )}

        {/* Simulation Sandbox Card */}
        <Card style={styles.simCard}>
          <View style={styles.simHeader}>
            <Text style={styles.simTitle}>
              🧪 CONVOY SIMULATION TEST CONTROLS
            </Text>
            <Badge
              label={isSimulatingDrive ? "DRIVING ON" : "DRIVING OFF"}
              variant={isSimulatingDrive ? "success" : "neutral"}
              size="small"
            />
          </View>

          <Text style={styles.simSub}>
            Simulate live GPS streaming, speed fluctuations, and straggler
            scenarios on TPLEX / MacArthur Highway.
          </Text>

          <View style={styles.simButtonRow}>
            <TouchableOpacity
              style={[
                styles.simToggleBtn,
                isSimulatingDrive && styles.simToggleBtnActive,
              ]}
              onPress={() => setIsSimulatingDrive(!isSimulatingDrive)}
            >
              <Text style={styles.simToggleText}>
                {isSimulatingDrive
                  ? "⏹️ PAUSE SIMULATION"
                  : "▶️ START DRIVE SIM"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.simResetBtn}
              onPress={() => {
                convoyService.loadPreset("ELYU_CORRIDOR");
                setMySpeed(84);
                setMyHeading(350);
                setMyLat(16.468);
                setMyLon(120.318);
                setMyStatus("CRUISING");
                refreshTelemetry();
              }}
            >
              <Text style={styles.simResetText}>🔄 RESET</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* Roadside Emergency SOS Modal */}
      <RoadsideSosModal
        visible={isSosModalVisible}
        onClose={() => setIsSosModalVisible(false)}
        onTriggerSos={handleTriggerSos}
        onResolveSos={handleResolveSos}
        activeSos={activeSos}
        currentLocation={{ latitude: myLat, longitude: myLon }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.darkBackground,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: AppSpacing.xxl,
    paddingBottom: AppSpacing.md,
    paddingHorizontal: AppSpacing.base,
    backgroundColor: AppColors.darkSurface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.darkBorder,
  },
  tripBadgeCol: {
    flex: 1,
  },
  topBarTitle: {
    ...AppTypography.bodyBold,
    fontWeight: "900",
    color: AppColors.textPrimary,
    letterSpacing: 0.5,
  },
  topBarSub: {
    ...AppTypography.tiny,
    color: AppColors.brandOceanLight,
    marginTop: 1,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.badgeBorderRadius,
    padding: 2,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  modeButton: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: AppColors.brandOcean,
  },
  modeButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: AppColors.textMuted,
  },
  modeButtonTextActive: {
    color: "#FFFFFF",
  },
  stragglerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1.5,
    borderColor: AppColors.warning,
    borderRadius: AppSpacing.badgeBorderRadius,
    padding: AppSpacing.md,
    marginHorizontal: AppSpacing.base,
    marginTop: AppSpacing.sm,
  },
  stragglerIcon: {
    fontSize: 22,
    marginRight: AppSpacing.md,
  },
  stragglerTextCol: {
    flex: 1,
  },
  stragglerTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: AppColors.warning,
    letterSpacing: 0.5,
  },
  stragglerDesc: {
    ...AppTypography.tiny,
    color: AppColors.textPrimary,
    marginTop: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl,
    gap: AppSpacing.md,
  },
  simCard: {
    marginTop: AppSpacing.sm,
  },
  simHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  simTitle: {
    ...AppTypography.tiny,
    fontWeight: "800",
    color: AppColors.textSecondary,
    letterSpacing: 0.5,
  },
  simSub: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    marginBottom: AppSpacing.md,
  },
  simButtonRow: {
    flexDirection: "row",
    gap: AppSpacing.sm,
  },
  simToggleBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.badgeBorderRadius,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.natureEmerald,
  },
  simToggleBtnActive: {
    backgroundColor: "rgba(5, 150, 105, 0.2)",
  },
  simToggleText: {
    ...AppTypography.tiny,
    fontWeight: "800",
    color: AppColors.natureEmeraldLight,
  },
  simResetBtn: {
    minHeight: 44,
    paddingHorizontal: AppSpacing.base,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.badgeBorderRadius,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  simResetText: {
    ...AppTypography.tiny,
    fontWeight: "800",
    color: AppColors.textSecondary,
  },
});
