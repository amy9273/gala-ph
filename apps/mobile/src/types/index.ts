import type {
  TravelMode,
  ExpenseCategory,
  PackingCategory,
  UserRole,
} from "@gala-ph/shared";

// ==========================================
// 1. Local Offline Trip Models
// ==========================================

export interface LocalTripMember {
  id: string;
  userId: string;
  name: string;
  role: UserRole;
  isDriver: boolean;
  isNonDrinker: boolean;
  avatarUrl?: string;
  phone?: string;
  gcashNumber?: string;
  mayaNumber?: string;
}

export interface LocalTrip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelMode: TravelMode;
  inviteCode: string;
  coverImageUrl?: string;
  isOfflineCached: boolean;
  members: LocalTripMember[];
  updatedAt: string;
}

// ==========================================
// 2. Local Itinerary Models
// ==========================================

export interface LocalItineraryItem {
  id: string;
  tripId: string;
  dayNumber: number;
  timeSlot: string;
  activity: string;
  location: string;
  latitude?: number;
  longitude?: number;
  estimatedCostCentavos: number;
  isSynced: boolean;
}

// ==========================================
// 3. Local Bayanihan Packing Checklist Models
// ==========================================

export interface LocalPackingItem {
  id: string;
  tripId: string;
  itemName: string;
  category: PackingCategory;
  quantity: number;
  assignedToId?: string;
  assignedToName?: string;
  isPacked: boolean;
  packedAt?: string;
  isSynced: boolean;
  isLocalDraft: boolean;
}

// ==========================================
// 4. Local KKB Expense & Split Models
// ==========================================

export interface LocalExpenseItem {
  id: string;
  expenseId: string;
  name: string;
  priceCentavos: number;
  quantity: number;
  consumerIds: string[];
}

export interface LocalExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  userName: string;
  amountCentavos: number;
  isSettled: boolean;
}

export interface LocalExpense {
  id: string;
  tripId: string;
  paidById: string;
  paidByName: string;
  title: string;
  category: ExpenseCategory;
  totalCentavos: number;
  serviceTaxCentavos: number;
  receiptUrl?: string;
  items: LocalExpenseItem[];
  splits: LocalExpenseSplit[];
  isSynced: boolean;
  createdAt: string;
}

// ==========================================
// 5. Outbox Mutation Queue Models
// ==========================================

export type OutboxMutationType =
  | "ADD_EXPENSE"
  | "TOGGLE_PACKING_ITEM"
  | "ADD_PACKING_ITEM"
  | "UPDATE_ITINERARY_ITEM"
  | "ADD_ITINERARY_ITEM";

export type OutboxStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

export interface OutboxMutation<T = Record<string, unknown>> {
  id: string;
  tripId: string;
  mutationType: OutboxMutationType;
  payload: T;
  status: OutboxStatus;
  retryCount: number;
  createdAt: string;
  idempotencyKey: string;
  lastError?: string;
}

// ==========================================
// 6. Network & Sync State
// ==========================================

export interface NetworkConnectionState {
  isOnline: boolean;
  isInternetReachable: boolean;
  pendingOutboxCount: number;
  lastSyncTimestamp?: string;
}

export interface SyncResult {
  successful: number;
  failed: number;
  remainingPending: number;
  errors: Array<{ mutationId: string; error: string }>;
}
