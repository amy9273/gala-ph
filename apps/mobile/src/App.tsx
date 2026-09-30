import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "./theme/colors";
import { NetworkStatusBar } from "./components/ui/NetworkStatusBar";
import { BottomTabBar, type TabKey } from "./navigation/BottomTabBar";
import { TripOverviewScreen } from "./screens/TripOverviewScreen";
import { ItineraryScreen } from "./screens/ItineraryScreen";
import { PackingScreen } from "./screens/PackingScreen";
import { ExpensesScreen } from "./screens/ExpensesScreen";
import { ReceiptScannerScreen } from "./screens/ReceiptScannerScreen";
import { ConvoyHudScreen } from "./screens/ConvoyHudScreen";
import { SyncQueueScreen } from "./screens/SyncQueueScreen";
import { outboxSyncService } from "./services/outbox-sync.service";
import type { NetworkConnectionState } from "./types";

type ScreenKey =
  | "overview"
  | "itinerary"
  | "convoy"
  | "expenses"
  | "packing"
  | "scanner"
  | "sync";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("overview");
  const [previousScreen, setPreviousScreen] = useState<ScreenKey>("overview");
  const [networkState, setNetworkState] = useState<NetworkConnectionState>(
    outboxSyncService.getNetworkState(),
  );

  useEffect(() => {
    // 1. Hydrate local SQLite with initial cache
    void outboxSyncService.hydrateInitialData();

    // 2. Subscribe to sync service network state
    const unsub = outboxSyncService.subscribe((state) => {
      setNetworkState(state);
    });

    return unsub;
  }, []);

  const navigateTo = (screen: ScreenKey) => {
    setPreviousScreen(activeScreen);
    setActiveScreen(screen);
  };

  const goBack = () => {
    setActiveScreen(
      previousScreen === activeScreen ? "overview" : previousScreen,
    );
  };

  // Determine which root bottom tab to highlight
  const getActiveTabKey = (): TabKey => {
    if (activeScreen === "itinerary") return "itinerary";
    if (activeScreen === "convoy") return "convoy";
    if (
      activeScreen === "expenses" ||
      activeScreen === "scanner" ||
      activeScreen === "sync"
    )
      return "expenses";
    return "overview";
  };

  const renderSecondaryHeader = (title: string) => (
    <View style={styles.subHeader}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={goBack}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={20} color={AppColors.textPrimary} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.subHeaderTitle}>{title}</Text>
      <View style={{ width: 50 }} />
    </View>
  );

  const renderScreen = () => {
    switch (activeScreen) {
      case "overview":
        return <TripOverviewScreen onNavigateTab={navigateTo} />;
      case "convoy":
        return <ConvoyHudScreen />;
      case "itinerary":
        return <ItineraryScreen />;
      case "expenses":
        return <ExpensesScreen />;
      case "packing":
        return (
          <View style={styles.screenFlex}>
            {renderSecondaryHeader("Bayanihan Packing")}
            <PackingScreen />
          </View>
        );
      case "scanner":
        return (
          <View style={styles.screenFlex}>
            {renderSecondaryHeader("Scan Receipt OCR")}
            <ReceiptScannerScreen
              onNavigateToLedger={() => setActiveScreen("expenses")}
            />
          </View>
        );
      case "sync":
        return (
          <View style={styles.screenFlex}>
            {renderSecondaryHeader("Offline Outbox Queue")}
            <SyncQueueScreen />
          </View>
        );
      default:
        return <TripOverviewScreen onNavigateTab={navigateTo} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.darkBackground}
      />
      <View style={styles.container}>
        {/* Network & Offline Outbox Status Bar */}
        <NetworkStatusBar
          state={networkState}
          onSyncPress={() => navigateTo("sync")}
          onToggleSimulatedOffline={() => {
            outboxSyncService.setOnlineStatus(!networkState.isOnline);
          }}
        />

        {/* Main Content Area */}
        <View style={styles.screenContainer}>{renderScreen()}</View>

        {/* Bottom Tab Navigation Dock (4 Root Tabs) */}
        <BottomTabBar
          activeTab={getActiveTabKey()}
          onSelectTab={(tab) => setActiveScreen(tab)}
          pendingCount={networkState.pendingOutboxCount}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.darkBackground,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.darkBackground,
  },
  screenContainer: {
    flex: 1,
  },
  screenFlex: {
    flex: 1,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.darkSurface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.darkBorder,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  subHeaderTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
