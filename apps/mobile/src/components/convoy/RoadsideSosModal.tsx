import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { AppColors } from "../../theme/colors";
import { AppSpacing } from "../../theme/spacing";
import { AppTypography } from "../../theme/typography";
import { Badge } from "../ui/Badge";
import type { ConvoySosReason } from "@gala-ph/shared";
import type { ActiveSosState } from "../../services/convoy.service";

interface RoadsideSosModalProps {
  visible: boolean;
  onClose: () => void;
  onTriggerSos: (
    reason: ConvoySosReason,
    details?: string,
  ) => Promise<ActiveSosState>;
  onResolveSos: (alertId: string) => Promise<void>;
  activeSos: ActiveSosState | null;
  currentLocation?: { latitude: number; longitude: number };
}

const EMERGENCY_REASONS: Array<{
  key: ConvoySosReason;
  label: string;
  icon: string;
  desc: string;
}> = [
  {
    key: "FLAT_TIRE",
    label: "Flat Tire",
    icon: "🛞",
    desc: "Puncture / need jack or spare tire",
  },
  {
    key: "OVERHEAT",
    label: "Engine Overheat",
    icon: "🌡️",
    desc: "Radiator steam / coolant issue",
  },
  {
    key: "ACCIDENT",
    label: "Road Accident",
    icon: "💥",
    desc: "Collision or physical hazard",
  },
  {
    key: "POLICE_CHECKPOINT",
    label: "Checkpoint / LTO",
    icon: "👮",
    desc: "Inspection or citation hold",
  },
  {
    key: "MEDICAL_EMERGENCY",
    label: "Medical Crisis",
    icon: "🚑",
    desc: "Passenger injury or acute illness",
  },
  {
    key: "LOST_ROUTE",
    label: "Lost Route",
    icon: "🗺️",
    desc: "Took wrong exit / no cellular signal",
  },
  {
    key: "OTHER",
    label: "General Breakdown",
    icon: "⚠️",
    desc: "Battery drained or mechanical failure",
  },
];

export const RoadsideSosModal: React.FC<RoadsideSosModalProps> = ({
  visible,
  onClose,
  onTriggerSos,
  onResolveSos,
  activeSos,
  currentLocation,
}) => {
  const [selectedReason, setSelectedReason] =
    useState<ConvoySosReason>("FLAT_TIRE");
  const [details, setDetails] = useState("");
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountingDown && countdownSeconds > 0) {
      timer = setTimeout(() => {
        setCountdownSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdownSeconds === 0) {
      executeTriggerSos();
    }
    return () => clearTimeout(timer);
  }, [isCountingDown, countdownSeconds]);

  const handleStartCountdown = () => {
    setIsCountingDown(true);
    setCountdownSeconds(3);
  };

  const handleCancelCountdown = () => {
    setIsCountingDown(false);
    setCountdownSeconds(3);
  };

  const executeTriggerSos = async () => {
    setIsCountingDown(false);
    setIsSubmitting(true);
    try {
      await onTriggerSos(selectedReason, details.trim() || undefined);
      setDetails("");
      onClose();
    } catch {
      Alert.alert("Error", "Failed to broadcast SOS. Please check signal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!activeSos) return;
    setIsSubmitting(true);
    try {
      await onResolveSos(activeSos.id);
      onClose();
    } catch {
      Alert.alert("Error", "Failed to resolve SOS.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {activeSos ? "🚨 ACTIVE SOS ALERT" : "🚨 EMERGENCY SOS BEACON"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {activeSos
                ? "Emergency in progress. All convoy members notified."
                : "Instantly alert all barkada convoy vehicles & drivers"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Active Alert Management View */}
          {activeSos ? (
            <View style={styles.activeSosCard}>
              <View style={styles.activeSosBadgeRow}>
                <Badge
                  label="STATUS: BROADCASTING ACTIVE"
                  variant="danger"
                  size="small"
                />
                <Text style={styles.activeSosTime}>
                  Issued: {new Date(activeSos.issuedAt).toLocaleTimeString()}
                </Text>
              </View>

              <Text style={styles.activeSosReasonTitle}>
                {activeSos.reason.replace(/_/g, " ")}
              </Text>
              <Text style={styles.activeSosVictim}>
                Triggered by: {activeSos.userName}{" "}
                {activeSos.userPhone ? `(${activeSos.userPhone})` : ""}
              </Text>

              {activeSos.details ? (
                <View style={styles.activeDetailsBox}>
                  <Text style={styles.activeDetailsText}>
                    "{activeSos.details}"
                  </Text>
                </View>
              ) : null}

              <View style={styles.locationBox}>
                <Text style={styles.locationLabel}>GPS COORDINATES:</Text>
                <Text style={styles.locationCoordinates}>
                  📍 {activeSos.latitude.toFixed(4)}° N,{" "}
                  {activeSos.longitude.toFixed(4)}° E
                </Text>
              </View>

              <TouchableOpacity
                style={styles.resolveButton}
                activeOpacity={0.8}
                onPress={handleResolveAlert}
                disabled={isSubmitting}
              >
                <Text style={styles.resolveButtonText}>
                  {isSubmitting ? "RESOLVING..." : "✅ RESOLVE & CLEAR SOS"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* GPS Coordinates Header */}
              {currentLocation && (
                <View style={styles.locationBox}>
                  <Text style={styles.locationLabel}>
                    YOUR CURRENT GPS LOCATION:
                  </Text>
                  <Text style={styles.locationCoordinates}>
                    📍 {currentLocation.latitude.toFixed(4)}° N,{" "}
                    {currentLocation.longitude.toFixed(4)}° E
                  </Text>
                </View>
              )}

              {/* Reason Grid */}
              <Text style={styles.sectionTitle}>SELECT EMERGENCY REASON</Text>
              <View style={styles.reasonGrid}>
                {EMERGENCY_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason.key;
                  return (
                    <TouchableOpacity
                      key={reason.key}
                      style={[
                        styles.reasonCard,
                        isSelected && styles.reasonCardSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedReason(reason.key)}
                    >
                      <Text style={styles.reasonIcon}>{reason.icon}</Text>
                      <View style={styles.reasonTextCol}>
                        <Text
                          style={[
                            styles.reasonLabel,
                            isSelected && styles.reasonLabelSelected,
                          ]}
                        >
                          {reason.label}
                        </Text>
                        <Text style={styles.reasonDesc}>{reason.desc}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedCheck}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional Custom Details Input */}
              <Text style={styles.sectionTitle}>
                ADDITIONAL NOTES (OPTIONAL)
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Near Shell San Fernando exit, need tire wrench 19mm"
                placeholderTextColor={AppColors.textMuted}
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={2}
              />

              {/* Safety Countdown Mode */}
              {isCountingDown ? (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownTitle}>
                    DISPATCHING SOS BEACON IN...
                  </Text>
                  <Text style={styles.countdownNumber}>{countdownSeconds}</Text>

                  <View style={styles.countdownActionRow}>
                    <TouchableOpacity
                      style={styles.cancelCountdownButton}
                      onPress={handleCancelCountdown}
                    >
                      <Text style={styles.cancelCountdownText}>CANCEL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.instantDispatchButton}
                      onPress={executeTriggerSos}
                    >
                      <Text style={styles.instantDispatchText}>
                        SEND IMMEDIATELY ❯
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.triggerSosButton}
                  activeOpacity={0.8}
                  onPress={handleStartCountdown}
                >
                  <Text style={styles.triggerSosIcon}>🚨</Text>
                  <Text style={styles.triggerSosText}>
                    BROADCAST SOS TO CONVOY
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.offlineNotice}>
                ⚡ Offline Resilience: In poor cell coverage, SOS is
                optimistically saved and queued into Outbox for instant sync.
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.darkBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: AppSpacing.xxl,
    paddingBottom: AppSpacing.base,
    paddingHorizontal: AppSpacing.base,
    backgroundColor: AppColors.darkSurface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.darkBorder,
  },
  headerLeft: {
    flex: 1,
    marginRight: AppSpacing.md,
  },
  headerTitle: {
    ...AppTypography.h2,
    fontWeight: "900",
    color: AppColors.danger,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.darkSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  closeButtonText: {
    ...AppTypography.bodyBold,
    color: AppColors.textPrimary,
    fontWeight: "700",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: AppSpacing.base,
    paddingBottom: AppSpacing.xxxl,
  },
  locationBox: {
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.badgeBorderRadius,
    padding: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    marginBottom: AppSpacing.base,
  },
  locationLabel: {
    ...AppTypography.tiny,
    fontWeight: "700",
    color: AppColors.textMuted,
    letterSpacing: 1,
  },
  locationCoordinates: {
    ...AppTypography.bodyBold,
    fontWeight: "700",
    color: AppColors.brandOceanLight,
    marginTop: 2,
  },
  sectionTitle: {
    ...AppTypography.tiny,
    fontWeight: "700",
    color: AppColors.textSecondary,
    letterSpacing: 1,
    marginBottom: AppSpacing.sm,
  },
  reasonGrid: {
    gap: AppSpacing.sm,
    marginBottom: AppSpacing.base,
  },
  reasonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.darkSurface,
    borderRadius: AppSpacing.badgeBorderRadius,
    padding: AppSpacing.md,
    borderWidth: 1.5,
    borderColor: AppColors.darkBorder,
  },
  reasonCardSelected: {
    borderColor: AppColors.danger,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  reasonIcon: {
    fontSize: 24,
    marginRight: AppSpacing.md,
  },
  reasonTextCol: {
    flex: 1,
  },
  reasonLabel: {
    ...AppTypography.bodyBold,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  reasonLabelSelected: {
    color: AppColors.danger,
  },
  reasonDesc: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 12,
  },
  textInput: {
    backgroundColor: AppColors.darkSurface,
    borderRadius: AppSpacing.badgeBorderRadius,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
    color: AppColors.textPrimary,
    padding: AppSpacing.md,
    ...AppTypography.body,
    marginBottom: AppSpacing.base,
  },
  triggerSosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    backgroundColor: AppColors.danger,
    borderRadius: AppSpacing.buttonBorderRadius,
    paddingHorizontal: AppSpacing.base,
    marginBottom: AppSpacing.md,
  },
  triggerSosIcon: {
    fontSize: 22,
    marginRight: AppSpacing.sm,
  },
  triggerSosText: {
    ...AppTypography.bodyBold,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  countdownContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 2,
    borderColor: AppColors.danger,
    borderRadius: AppSpacing.cardBorderRadius,
    padding: AppSpacing.base,
    alignItems: "center",
    marginBottom: AppSpacing.base,
  },
  countdownTitle: {
    ...AppTypography.tiny,
    fontWeight: "800",
    color: AppColors.danger,
    letterSpacing: 1,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: "900",
    color: AppColors.danger,
    marginVertical: AppSpacing.sm,
  },
  countdownActionRow: {
    flexDirection: "row",
    gap: AppSpacing.md,
    width: "100%",
  },
  cancelCountdownButton: {
    flex: 1,
    minHeight: 48,
    backgroundColor: AppColors.darkSurfaceSecondary,
    borderRadius: AppSpacing.badgeBorderRadius,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  cancelCountdownText: {
    ...AppTypography.bodyBold,
    fontWeight: "800",
    color: AppColors.textPrimary,
  },
  instantDispatchButton: {
    flex: 1.5,
    minHeight: 48,
    backgroundColor: AppColors.danger,
    borderRadius: AppSpacing.badgeBorderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  instantDispatchText: {
    ...AppTypography.bodyBold,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  activeSosCard: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 2,
    borderColor: AppColors.danger,
    borderRadius: AppSpacing.cardBorderRadius,
    padding: AppSpacing.base,
  },
  activeSosBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: AppSpacing.md,
  },
  activeSosTime: {
    ...AppTypography.tiny,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  activeSosReasonTitle: {
    ...AppTypography.h1,
    fontWeight: "900",
    color: AppColors.danger,
    marginBottom: 4,
  },
  activeSosVictim: {
    ...AppTypography.body,
    color: AppColors.textPrimary,
    fontWeight: "600",
    marginBottom: AppSpacing.md,
  },
  activeDetailsBox: {
    backgroundColor: AppColors.darkSurface,
    borderRadius: AppSpacing.badgeBorderRadius,
    padding: AppSpacing.md,
    marginBottom: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.darkBorder,
  },
  activeDetailsText: {
    ...AppTypography.body,
    color: AppColors.textPrimary,
    fontStyle: "italic",
  },
  resolveButton: {
    minHeight: 52,
    backgroundColor: AppColors.natureEmerald,
    borderRadius: AppSpacing.badgeBorderRadius,
    alignItems: "center",
    justifyContent: "center",
    marginTop: AppSpacing.sm,
  },
  resolveButtonText: {
    ...AppTypography.bodyBold,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  offlineNotice: {
    ...AppTypography.tiny,
    color: AppColors.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
});
