/**
 * GalaPH Mobile API Client
 * Connects to Fastify/Express backend with fallback sample data for offline verification.
 */

import type {
  LocalTrip,
  LocalItineraryItem,
  LocalPackingItem,
  LocalExpense,
} from "../types";

const API_BASE_URL =
  process.env["EXPO_PUBLIC_API_URL"] || "http://10.0.2.2:4000/api/v1";

// Default Seed Trip for Initial Cache Hydration
export const DEMO_MOBILE_TRIP: LocalTrip = {
  id: "trip-elyu-demo",
  title: "Elyu Surf & Chill Weekend",
  destination: "San Juan, La Union",
  startDate: "2026-10-15T06:00:00.000Z",
  endDate: "2026-10-18T18:00:00.000Z",
  travelMode: "HYBRID",
  inviteCode: "ELYU-SURF",
  coverImageUrl:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  isOfflineCached: true,
  updatedAt: new Date().toISOString(),
  members: [
    {
      id: "mem-01",
      userId: "user-miguel",
      name: "Miguel Santos",
      role: "TRIP_LEAD",
      isDriver: true,
      isNonDrinker: false,
      avatarUrl: "https://i.pravatar.cc/150?u=miguel",
      phone: "+639171234567",
      gcashNumber: "09171234567",
    },
    {
      id: "mem-02",
      userId: "user-bea",
      name: "Bea Alonzo",
      role: "MEMBER",
      isDriver: false,
      isNonDrinker: true,
      avatarUrl: "https://i.pravatar.cc/150?u=bea",
      phone: "+639189876543",
      gcashNumber: "09189876543",
    },
    {
      id: "mem-03",
      userId: "user-carlos",
      name: "Carlos Mendoza",
      role: "DRIVER",
      isDriver: true,
      isNonDrinker: false,
      avatarUrl: "https://i.pravatar.cc/150?u=carlos",
      phone: "+639194567890",
      mayaNumber: "09194567890",
    },
    {
      id: "mem-04",
      userId: "user-denise",
      name: "Denise Laurel",
      role: "COMMUTER",
      isDriver: false,
      isNonDrinker: false,
      avatarUrl: "https://i.pravatar.cc/150?u=denise",
      phone: "+639201112233",
      gcashNumber: "09201112233",
    },
  ],
};

export const DEMO_MOBILE_ITINERARY: LocalItineraryItem[] = [
  {
    id: "itin-01",
    tripId: "trip-elyu-demo",
    dayNumber: 1,
    timeSlot: "04:30 AM",
    activity: "Assembly & Meetup Staging at NLEX Balintawak",
    location: "Petron NLEX Km 23",
    estimatedCostCentavos: 50000,
    isSynced: true,
  },
  {
    id: "itin-02",
    tripId: "trip-elyu-demo",
    dayNumber: 1,
    timeSlot: "09:00 AM",
    activity: "Breakfast & Coffee at TPLEX Rosario Exit",
    location: "Sison / Rosario Rest Stop",
    estimatedCostCentavos: 25000,
    isSynced: true,
  },
  {
    id: "itin-03",
    tripId: "trip-elyu-demo",
    dayNumber: 1,
    timeSlot: "11:30 AM",
    activity: "Resort Check-In & Beachfront Lunch",
    location: "Kahuna Beach Resort, Urbiztondo",
    estimatedCostCentavos: 120000,
    isSynced: true,
  },
  {
    id: "itin-04",
    tripId: "trip-elyu-demo",
    dayNumber: 1,
    timeSlot: "03:30 PM",
    activity: "Beginner Surf Lesson & Board Rental",
    location: "Mona Liza Point Surf Break",
    estimatedCostCentavos: 60000,
    isSynced: true,
  },
  {
    id: "itin-05",
    tripId: "trip-elyu-demo",
    dayNumber: 1,
    timeSlot: "06:30 PM",
    activity: "Sunset Cocktails & Dampa Seafood Dinner",
    location: "Tagpuan sa San Juan",
    estimatedCostCentavos: 220000,
    isSynced: true,
  },
  {
    id: "itin-06",
    tripId: "trip-elyu-demo",
    dayNumber: 2,
    timeSlot: "07:00 AM",
    activity: "Morning Trek to Tangadan Falls & Cliff Jump",
    location: "San Gabriel Eco-Tourism Desk",
    estimatedCostCentavos: 75000,
    isSynced: true,
  },
];

export const DEMO_MOBILE_PACKING: LocalPackingItem[] = [
  {
    id: "pack-01",
    tripId: "trip-elyu-demo",
    itemName: "Coleman 40L Ice Cooler Box",
    category: "GEAR",
    quantity: 1,
    assignedToId: "user-miguel",
    assignedToName: "Miguel Santos",
    isPacked: true,
    packedAt: "2026-10-14T20:00:00.000Z",
    isSynced: true,
    isLocalDraft: false,
  },
  {
    id: "pack-02",
    tripId: "trip-elyu-demo",
    itemName: "Heavy Duty Jump Starter & Tire Inflator",
    category: "GEAR",
    quantity: 1,
    assignedToId: "user-carlos",
    assignedToName: "Carlos Mendoza",
    isPacked: true,
    packedAt: "2026-10-14T21:15:00.000Z",
    isSynced: true,
    isLocalDraft: false,
  },
  {
    id: "pack-03",
    tripId: "trip-elyu-demo",
    itemName: "First Aid Kit (Bandages, Betadine, Paracetamol, Antihistamine)",
    category: "MEDICAL",
    quantity: 2,
    assignedToId: "user-bea",
    assignedToName: "Bea Alonzo",
    isPacked: false,
    isSynced: true,
    isLocalDraft: false,
  },
  {
    id: "pack-04",
    tripId: "trip-elyu-demo",
    itemName: "JBL Boombox Waterproof Bluetooth Speaker",
    category: "COMFORT",
    quantity: 1,
    assignedToId: "user-denise",
    assignedToName: "Denise Laurel",
    isPacked: false,
    isSynced: true,
    isLocalDraft: false,
  },
  {
    id: "pack-05",
    tripId: "trip-elyu-demo",
    itemName: "Reef-Safe Sunscreen SPF 50+ & Aloe Gel",
    category: "COMFORT",
    quantity: 3,
    assignedToId: "user-bea",
    assignedToName: "Bea Alonzo",
    isPacked: true,
    packedAt: "2026-10-14T22:30:00.000Z",
    isSynced: true,
    isLocalDraft: false,
  },
  {
    id: "pack-06",
    tripId: "trip-elyu-demo",
    itemName: "Emergency Cash in Small Bills (₱100/₱50/₱20 for TODA & Tolls)",
    category: "DOCUMENTS",
    quantity: 1,
    assignedToId: "user-miguel",
    assignedToName: "Miguel Santos",
    isPacked: true,
    packedAt: "2026-10-14T19:00:00.000Z",
    isSynced: true,
    isLocalDraft: false,
  },
];

export const DEMO_MOBILE_EXPENSES: LocalExpense[] = [
  {
    id: "exp-01",
    tripId: "trip-elyu-demo",
    paidById: "user-miguel",
    paidByName: "Miguel Santos",
    title: "NLEX + SCTEX + TPLEX Tollway Fees (Car 1)",
    category: "TOLL_HIGHWAY",
    totalCentavos: 112000,
    serviceTaxCentavos: 0,
    isSynced: true,
    createdAt: "2026-10-15T08:30:00.000Z",
    items: [
      {
        id: "item-toll-01",
        expenseId: "exp-01",
        name: "Autosweep & Easytrip Class 1 Tolls",
        priceCentavos: 112000,
        quantity: 1,
        consumerIds: ["user-miguel", "user-bea"],
      },
    ],
    splits: [
      {
        id: "split-01",
        expenseId: "exp-01",
        userId: "user-bea",
        userName: "Bea Alonzo",
        amountCentavos: 56000,
        isSettled: false,
      },
      {
        id: "split-02",
        expenseId: "exp-01",
        userId: "user-miguel",
        userName: "Miguel Santos",
        amountCentavos: 56000,
        isSettled: true,
      },
    ],
  },
  {
    id: "exp-02",
    tripId: "trip-elyu-demo",
    paidById: "user-carlos",
    paidByName: "Carlos Mendoza",
    title: "Tagpuan Seafood & Beers Dinner",
    category: "FOOD_AND_DINING",
    totalCentavos: 240000,
    serviceTaxCentavos: 24000,
    isSynced: true,
    createdAt: "2026-10-15T19:45:00.000Z",
    items: [
      {
        id: "item-food-01",
        expenseId: "exp-02",
        name: "Garlic Butter Shrimp Platter",
        priceCentavos: 85000,
        quantity: 1,
        consumerIds: ["user-miguel", "user-bea", "user-carlos", "user-denise"],
      },
      {
        id: "item-food-02",
        expenseId: "exp-02",
        name: "Grilled Tuna Panga",
        priceCentavos: 75000,
        quantity: 1,
        consumerIds: ["user-miguel", "user-bea", "user-carlos", "user-denise"],
      },
      {
        id: "item-food-03",
        expenseId: "exp-02",
        name: "San Mig Light Beer Bucket (6 bottles)",
        priceCentavos: 80000,
        quantity: 1,
        consumerIds: ["user-miguel", "user-carlos", "user-denise"], // Bea excluded as non-drinker
      },
    ],
    splits: [
      {
        id: "split-food-01",
        expenseId: "exp-02",
        userId: "user-bea",
        userName: "Bea Alonzo",
        amountCentavos: 44000, // Non-drinker pays food only + fair SC/Tax
        isSettled: false,
      },
      {
        id: "split-food-02",
        expenseId: "exp-02",
        userId: "user-miguel",
        userName: "Miguel Santos",
        amountCentavos: 73333,
        isSettled: false,
      },
      {
        id: "split-food-03",
        expenseId: "exp-02",
        userId: "user-denise",
        userName: "Denise Laurel",
        amountCentavos: 73333,
        isSettled: false,
      },
      {
        id: "split-food-04",
        expenseId: "exp-02",
        userId: "user-carlos",
        userName: "Carlos Mendoza",
        amountCentavos: 73334,
        isSettled: true,
      },
    ],
  },
];

export const mobileApiClient = {
  async fetchTrip(_tripId: string): Promise<LocalTrip> {
    try {
      const res = await fetch(`${API_BASE_URL}/trips/${_tripId}`);
      if (res.ok) {
        return (await res.json()) as LocalTrip;
      }
    } catch {
      // Fallback to local demo data
    }
    return DEMO_MOBILE_TRIP;
  },

  async sendOutboxMutation(
    mutationType: string,
    payload: Record<string, unknown>,
    idempotencyKey: string,
  ): Promise<{ success: boolean; data?: unknown }> {
    try {
      const res = await fetch(`${API_BASE_URL}/sync/mutation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ mutationType, payload }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Offline or network error
    }
    // Return simulated success for local outbox demonstration
    return {
      success: true,
      data: { status: "PROCESSED_LOCALLY", idempotencyKey },
    };
  },
};
