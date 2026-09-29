import { useEffect, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { AppColors } from "./theme/colors";
import { NetworkStatusBar } from "./components/ui/NetworkStatusBar";
import { BottomTabBar, type TabKey } from "./navigation/BottomTabBar";
import { TripOverviewScreen } from "./screens/TripOverviewScreen";
import { ItineraryScreen } from "./screens/ItineraryScreen";
import { PackingScreen } from "./screens/PackingScreen";
import { ExpensesScreen } from "./screens/ExpensesScreen";
import { ReceiptScannerScreen } from "./screens/ReceiptScannerScreen";
import { SyncQueueScreen } from "./screens/SyncQueueScreen";
import { outboxSyncService } from "./services/outbox-sync.service";
import type { NetworkConnectionState } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
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

  const renderScreen = () => {
    switch (activeTab) {
      case "overview":
        return <TripOverviewScreen onNavigateTab={setActiveTab} />;
      case "itinerary":
        return <ItineraryScreen />;
      case "scanner":
        return (
          <ReceiptScannerScreen
            onNavigateToLedger={() => setActiveTab("expenses")}
          />
        );
      case "packing":
        return <PackingScreen />;
      case "expenses":
        return <ExpensesScreen />;
      case "sync":
        return <SyncQueueScreen />;
      default:
        return <TripOverviewScreen onNavigateTab={setActiveTab} />;
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
          onSyncPress={() => setActiveTab("sync")}
          onToggleSimulatedOffline={() => {
            outboxSyncService.setOnlineStatus(!networkState.isOnline);
          }}
        />

        {/* Main Content Area */}
        <View style={styles.screenContainer}>{renderScreen()}</View>

        {/* Bottom Tab Navigation Dock */}
        <BottomTabBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
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
});
