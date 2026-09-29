export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("galaph_auth_token", token);
    } else {
      localStorage.removeItem("galaph_auth_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("galaph_auth_token");
  }
  return authToken;
}

// Preset Philippine Road Trip Routes
export interface PresetRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  expressways: string[];
  description: string;
}

export const PRESET_ROUTES: PresetRoute[] = [
  {
    id: "MANILA_TO_LA_UNION",
    name: "Manila to San Juan, La Union (Elyu Surf Trip)",
    origin: "Balintawak Toll Plaza",
    destination: "Rosario / San Juan, La Union",
    distanceKm: 245,
    expressways: ["NLEX", "SCTEX", "TPLEX"],
    description:
      "Classic Northern road trip through NLEX (Easytrip), SCTEX (Easytrip), and TPLEX (Autosweep).",
  },
  {
    id: "MANILA_TO_BAGUIO",
    name: "Manila to Baguio City (Summer Capital)",
    origin: "Balintawak Toll Plaza",
    destination: "Baguio via TPLEX Rosario & Kennon Road",
    distanceKm: 250,
    expressways: ["NLEX", "SCTEX", "TPLEX"],
    description:
      "Express route to Baguio connecting NLEX, SCTEX, and TPLEX with Kennon / Marcos Highway ascent.",
  },
  {
    id: "MANILA_TO_BATANGAS_PORT",
    name: "Manila to Batangas Port (Puerto Galera Ferry)",
    origin: "Skyway Buendia / Magallanes",
    destination: "Batangas Port Interchange",
    distanceKm: 110,
    expressways: ["Skyway Stage 3", "SLEX", "STAR Tollway"],
    description:
      "Southern expressway artery via Skyway 3, SLEX, and STAR Tollway (100% Autosweep).",
  },
  {
    id: "MANILA_TO_TAGAYTAY",
    name: "Manila to Tagaytay via CALAX",
    origin: "Skyway / SLEX Nichols",
    destination: "CALAX Silang East / Tagaytay",
    distanceKm: 65,
    expressways: ["Skyway Stage 3", "SLEX", "CALAX"],
    description:
      "Scenic weekend getaway via SLEX (Autosweep) and CALAX (Easytrip).",
  },
  {
    id: "MANILA_TO_SUBIC",
    name: "Manila to Subic Bay Freeport",
    origin: "Balintawak Toll Plaza",
    destination: "Tipo / Subic Freeport",
    distanceKm: 125,
    expressways: ["NLEX", "SCTEX"],
    description:
      "Western central Luzon route via NLEX and SCTEX Subic Spur (100% Easytrip).",
  },
];

export interface TollSegment {
  expressway: string;
  rfidProvider: "AUTOSWEEP" | "EASYTRIP";
  entryPlaza: string;
  exitPlaza: string;
  amount: number;
}

export interface TollBreakdown {
  routeId: string;
  routeName: string;
  classType: number;
  autosweep: {
    total: number;
    recommendedReload: number;
    segments: TollSegment[];
  };
  easytrip: {
    total: number;
    recommendedReload: number;
    segments: TollSegment[];
  };
  combinedTollTotal: number;
  estimatedFuel: {
    distanceKm: number;
    litersNeeded: number;
    pricePerLiter: number;
    fuelCost: number;
    engineType: string;
  };
  totalEstimatedRoadCost: number;
}

export interface WeatherAlert {
  id: string;
  alertType: string;
  severity: "LOW" | "MODERATE" | "CRITICAL";
  headline: string;
  advisory: string;
  source: string;
  issuedAt: string;
}

export interface ItineraryItem {
  id: string;
  dayNumber: number;
  timeSlot: string;
  activity: string;
  location: string;
  latitude?: number;
  longitude?: number;
  estimatedCost?: number;
}

export interface TripDetail {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelMode: string;
  inviteCode: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    isDriver: boolean;
    isNonDrinker: boolean;
    vehicleId?: string | null;
    user: {
      id: string;
      name: string;
      avatarUrl?: string | null;
      email: string;
    };
  }>;
  itineraryItems: ItineraryItem[];
  weatherAlerts: WeatherAlert[];
  packingItemsSummary?: {
    total: number;
    packed: number;
  };
}

// Fuel economy presets in km per liter
export const FUEL_ECONOMY_PRESETS = {
  SEDAN_1_5L: { name: "1.5L Gasoline Sedan / Hatchback", kmPerLiter: 14.0 },
  SUV_DIESEL_2_8L: { name: "2.8L Turbo Diesel SUV / Pickup", kmPerLiter: 11.5 },
  COMMUTER_VAN: { name: "Diesel Commuter Van (12-15 seater)", kmPerLiter: 9.0 },
  MOTORCYCLE_150CC: { name: "150cc Scooter / Motorcycle", kmPerLiter: 40.0 },
  CUSTOM: { name: "Custom Consumption", kmPerLiter: 12.0 },
};

/**
 * Calculates toll breakdown for a route.
 */
export function calculateLocalTollBreakdown(
  routeId: string,
  classType: number = 1,
  engineType: keyof typeof FUEL_ECONOMY_PRESETS = "SEDAN_1_5L",
  fuelPricePerLiter: number = 62.0,
): TollBreakdown {
  const route =
    PRESET_ROUTES.find((r) => r.id === routeId) || PRESET_ROUTES[0]!;

  let autosweepSegments: TollSegment[] = [];
  let easytripSegments: TollSegment[] = [];

  const multiplier = classType === 2 ? 2.0 : classType === 3 ? 2.4 : 1.0;

  if (route.id === "MANILA_TO_LA_UNION" || route.id === "MANILA_TO_BAGUIO") {
    easytripSegments = [
      {
        expressway: "NLEX",
        rfidProvider: "EASYTRIP",
        entryPlaza: "Balintawak Toll Plaza",
        exitPlaza: "SCTEX Interchange (Mabalacat)",
        amount: Math.round(331 * multiplier),
      },
      {
        expressway: "SCTEX",
        rfidProvider: "EASYTRIP",
        entryPlaza: "Mabalacat Interchange",
        exitPlaza: "Tarlac City Plaza",
        amount: Math.round(151 * multiplier),
      },
    ];

    autosweepSegments = [
      {
        expressway: "TPLEX",
        rfidProvider: "AUTOSWEEP",
        entryPlaza: "Tarlac Central Plaza",
        exitPlaza: "Rosario Main Plaza",
        amount: Math.round(346 * multiplier),
      },
    ];
  } else if (route.id === "MANILA_TO_BATANGAS_PORT") {
    autosweepSegments = [
      {
        expressway: "Skyway Stage 3",
        rfidProvider: "AUTOSWEEP",
        entryPlaza: "Buendia Entry Ramp",
        exitPlaza: "Nichols Toll Plaza",
        amount: Math.round(129 * multiplier),
      },
      {
        expressway: "SLEX",
        rfidProvider: "AUTOSWEEP",
        entryPlaza: "Nichols Plaza",
        exitPlaza: "Calamba Interchange",
        amount: Math.round(214 * multiplier),
      },
      {
        expressway: "STAR Tollway",
        rfidProvider: "AUTOSWEEP",
        entryPlaza: "Santo Tomas Plaza",
        exitPlaza: "Batangas City Exit",
        amount: Math.round(142 * multiplier),
      },
    ];
  } else if (route.id === "MANILA_TO_TAGAYTAY") {
    autosweepSegments = [
      {
        expressway: "SLEX",
        rfidProvider: "AUTOSWEEP",
        entryPlaza: "Magallanes",
        exitPlaza: "Mamplasan Interchange",
        amount: Math.round(180 * multiplier),
      },
    ];
    easytripSegments = [
      {
        expressway: "CALAX",
        rfidProvider: "EASYTRIP",
        entryPlaza: "Mamplasan Entry",
        exitPlaza: "Silang East (Tagaytay) Exit",
        amount: Math.round(195 * multiplier),
      },
    ];
  } else {
    easytripSegments = [
      {
        expressway: "NLEX",
        rfidProvider: "EASYTRIP",
        entryPlaza: "Balintawak",
        exitPlaza: "SCTEX Interchange",
        amount: Math.round(331 * multiplier),
      },
      {
        expressway: "SCTEX",
        rfidProvider: "EASYTRIP",
        entryPlaza: "Mabalacat",
        exitPlaza: "Tipo Toll Barrier (Subic)",
        amount: Math.round(197 * multiplier),
      },
    ];
  }

  const autosweepTotal = autosweepSegments.reduce(
    (sum, s) => sum + s.amount,
    0,
  );
  const easytripTotal = easytripSegments.reduce((sum, s) => sum + s.amount, 0);

  // Reload buffer to nearest ₱50
  const autosweepReload =
    autosweepTotal > 0 ? Math.ceil(autosweepTotal / 50) * 50 : 0;
  const easytripReload =
    easytripTotal > 0 ? Math.ceil(easytripTotal / 50) * 50 : 0;

  const combinedTollTotal = autosweepTotal + easytripTotal;

  const kmPerLiter = FUEL_ECONOMY_PRESETS[engineType]?.kmPerLiter || 14.0;
  const litersNeeded = Math.round((route.distanceKm / kmPerLiter) * 10) / 10;
  const fuelCost = Math.round(litersNeeded * fuelPricePerLiter);

  return {
    routeId: route.id,
    routeName: route.name,
    classType,
    autosweep: {
      total: autosweepTotal,
      recommendedReload: autosweepReload,
      segments: autosweepSegments,
    },
    easytrip: {
      total: easytripTotal,
      recommendedReload: easytripReload,
      segments: easytripSegments,
    },
    combinedTollTotal,
    estimatedFuel: {
      distanceKm: route.distanceKm,
      litersNeeded,
      pricePerLiter: fuelPricePerLiter,
      fuelCost,
      engineType,
    },
    totalEstimatedRoadCost: combinedTollTotal + fuelCost,
  };
}

export type ExpenseCategory =
  | "FOOD_AND_DINING"
  | "ALCOHOL_AND_BAR"
  | "TOLL_HIGHWAY"
  | "FUEL_AND_GAS"
  | "COMMUTE_TICKET"
  | "LODGING_RESORT"
  | "LOCAL_TOUR_GUIDE"
  | "ENVIRONMENTAL_FEE"
  | "SHARED_GROCERY"
  | "MISCELLANEOUS";

export const EXPENSE_CATEGORY_LABELS: Record<
  ExpenseCategory,
  { label: string; icon: string }
> = {
  FOOD_AND_DINING: { label: "Food & Dining", icon: "🍽️" },
  ALCOHOL_AND_BAR: { label: "Alcohol & Bar Tab", icon: "🍻" },
  TOLL_HIGHWAY: { label: "Expressway Tolls", icon: "🛣️" },
  FUEL_AND_GAS: { label: "Fuel & Gas", icon: "⛽" },
  COMMUTE_TICKET: { label: "Bus & Commute Tickets", icon: "🚌" },
  LODGING_RESORT: { label: "Lodging & Resort", icon: "🏨" },
  LOCAL_TOUR_GUIDE: { label: "Tricycle / Tour Guide", icon: "🛺" },
  ENVIRONMENTAL_FEE: { label: "Environmental & Tourism Fee", icon: "🌿" },
  SHARED_GROCERY: { label: "Shared Groceries", icon: "🛒" },
  MISCELLANEOUS: { label: "Miscellaneous", icon: "📦" },
};

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  priceCentavos: number;
  quantity: number;
  subtotal: number;
  subtotalCentavos: number;
  consumerIds: string[];
}

export interface ExpenseSplit {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  baseAmount: number;
  serviceChargeShare: number;
  taxShare: number;
  totalOwed: number;
  totalOwedCentavos: number;
  isSettled: boolean;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  category: ExpenseCategory;
  totalAmount: number;
  totalAmountCentavos: number;
  serviceChargeAmount: number;
  taxAmount: number;
  serviceChargePercent: number;
  taxPercent: number;
  paidById: string;
  paidByName: string;
  paidByAvatar?: string | null;
  items: ExpenseItem[];
  splits: ExpenseSplit[];
  notes?: string | null;
  createdAt: string;
}

export interface MemberBalance {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  isNonDrinker: boolean;
  isDriver: boolean;
  gcashNumber?: string | null;
  mayaNumber?: string | null;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface DebtSettlement {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  amountCentavos: number;
  recipientGcash?: string | null;
  recipientMaya?: string | null;
  paymentRefCode: string;
  isSettled: boolean;
}

// Seed Demo Trip
export const DEMO_TRIP: TripDetail = {
  id: "trip-elyu-01",
  title: "Elyu Surf & Chill Weekend 🏄‍♂️",
  destination: "San Juan, La Union",
  startDate: "2026-10-30T00:00:00.000Z",
  endDate: "2026-11-01T23:59:59.000Z",
  travelMode: "HYBRID",
  inviteCode: "ELYU-9X2Y",
  members: [
    {
      id: "m1",
      userId: "u1",
      role: "TRIP_LEAD",
      isDriver: true,
      isNonDrinker: false,
      vehicleId: "CAR-01",
      user: {
        id: "u1",
        name: "Juan Dela Cruz (Organizer)",
        email: "juan@gala-ph.dev",
      },
    },
    {
      id: "m2",
      userId: "u2",
      role: "DRIVER",
      isDriver: true,
      isNonDrinker: false,
      vehicleId: "CAR-02",
      user: {
        id: "u2",
        name: "Maria Santos",
        email: "maria@gala-ph.dev",
      },
    },
    {
      id: "m3",
      userId: "u3",
      role: "MEMBER",
      isDriver: false,
      isNonDrinker: true,
      vehicleId: "CAR-01",
      user: {
        id: "u3",
        name: "Bea Alonzo (Non-Drinker)",
        email: "bea@gala-ph.dev",
      },
    },
    {
      id: "m4",
      userId: "u4",
      role: "COMMUTER",
      isDriver: false,
      isNonDrinker: false,
      user: {
        id: "u4",
        name: "Carlo Reyes (JoyBus Commuter)",
        email: "carlo@gala-ph.dev",
      },
    },
  ],
  itineraryItems: [
    {
      id: "itin-1",
      dayNumber: 1,
      timeSlot: "04:30 AM",
      activity: "Convoy Assembly & Coffee at NLEX Balintawak Petron",
      location: "NLEX Balintawak Km 12",
      estimatedCost: 250.0,
    },
    {
      id: "itin-2",
      dayNumber: 1,
      timeSlot: "08:30 AM",
      activity: "Breakfast & Rest Stop at TPLEX Pura Shell Station",
      location: "TPLEX Pura Interchange",
      estimatedCost: 350.0,
    },
    {
      id: "itin-3",
      dayNumber: 1,
      timeSlot: "11:30 AM",
      activity: "Check-in at San Juan Surf Resort & Lunch at Tagpuan",
      location: "Urbiztondo Beach, San Juan",
      estimatedCost: 650.0,
    },
    {
      id: "itin-4",
      dayNumber: 1,
      timeSlot: "04:00 PM",
      activity: "Sunset Surfing Lesson & Beach Volleyball",
      location: "San Juan Beach Point Break",
      estimatedCost: 500.0,
    },
    {
      id: "itin-5",
      dayNumber: 1,
      timeSlot: "07:30 PM",
      activity: "Seafood Dampa Dinner & Acoustic Inuman at Flotsam",
      location: "Flotsam and Jetsam Hostel",
      estimatedCost: 850.0,
    },
    {
      id: "itin-6",
      dayNumber: 2,
      timeSlot: "08:00 AM",
      activity: "TODA Tricycle Trip to Tangadan Falls Cliff Jump",
      location: "San Gabriel, La Union",
      estimatedCost: 400.0,
    },
  ],
  weatherAlerts: [
    {
      id: "w1",
      alertType: "MONSOON_ADVISORY",
      severity: "LOW",
      headline: "Southwest Monsoon (Habagat) Light Scattered Showers",
      advisory:
        "DOST-PAGASA: Light to moderate afternoon showers expected over La Union & Pangasinan coastlines. Road surfaces wet along TPLEX Rosario. Safe for travel.",
      source: "DOST-PAGASA",
      issuedAt: new Date().toISOString(),
    },
  ],
  packingItemsSummary: {
    total: 8,
    packed: 5,
  },
};

// Seed Demo Expenses for Elyu Trip
export const DEMO_EXPENSES: Expense[] = [
  {
    id: "exp-01",
    tripId: "trip-elyu-01",
    title: "San Fernando Dampa Seafood Dinner",
    category: "FOOD_AND_DINING",
    totalAmount: 2750.0,
    totalAmountCentavos: 275000,
    serviceChargePercent: 10,
    serviceChargeAmount: 250.0,
    taxPercent: 0,
    taxAmount: 0,
    paidById: "u1",
    paidByName: "Juan Dela Cruz",
    notes: "Official welcome dinner at San Fernando Seafood Wharf.",
    createdAt: "2026-10-30T19:30:00.000Z",
    items: [
      {
        id: "item-1",
        name: "1kg Garlic Butter Tiger Prawns",
        price: 1200.0,
        priceCentavos: 120000,
        quantity: 1,
        subtotal: 1200.0,
        subtotalCentavos: 120000,
        consumerIds: ["u1", "u2", "u3", "u4"],
      },
      {
        id: "item-2",
        name: "Inihaw na Boneless Bangus (Large)",
        price: 450.0,
        priceCentavos: 45000,
        quantity: 1,
        subtotal: 450.0,
        subtotalCentavos: 45000,
        consumerIds: ["u1", "u2", "u3", "u4"],
      },
      {
        id: "item-3",
        name: "Sinigang na Hipon sa Sampalok",
        price: 550.0,
        priceCentavos: 55000,
        quantity: 1,
        subtotal: 550.0,
        subtotalCentavos: 55000,
        consumerIds: ["u1", "u2", "u3", "u4"],
      },
      {
        id: "item-4",
        name: "Garlic Rice Platters",
        price: 150.0,
        priceCentavos: 15000,
        quantity: 2,
        subtotal: 300.0,
        subtotalCentavos: 30000,
        consumerIds: ["u1", "u2", "u3", "u4"],
      },
    ],
    splits: [
      {
        userId: "u1",
        userName: "Juan Dela Cruz",
        baseAmount: 625.0,
        serviceChargeShare: 62.5,
        taxShare: 0,
        totalOwed: 687.5,
        totalOwedCentavos: 68750,
        isSettled: true,
      },
      {
        userId: "u2",
        userName: "Maria Santos",
        baseAmount: 625.0,
        serviceChargeShare: 62.5,
        taxShare: 0,
        totalOwed: 687.5,
        totalOwedCentavos: 68750,
        isSettled: false,
      },
      {
        userId: "u3",
        userName: "Bea Alonzo",
        baseAmount: 625.0,
        serviceChargeShare: 62.5,
        taxShare: 0,
        totalOwed: 687.5,
        totalOwedCentavos: 68750,
        isSettled: false,
      },
      {
        userId: "u4",
        userName: "Carlo Reyes",
        baseAmount: 625.0,
        serviceChargeShare: 62.5,
        taxShare: 0,
        totalOwed: 687.5,
        totalOwedCentavos: 68750,
        isSettled: false,
      },
    ],
  },
  {
    id: "exp-02",
    tripId: "trip-elyu-01",
    title: "Flotsam & Jetsam Acoustic Inuman Bar Tab",
    category: "ALCOHOL_AND_BAR",
    totalAmount: 1920.0,
    totalAmountCentavos: 192000,
    serviceChargePercent: 0,
    serviceChargeAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    paidById: "u2",
    paidByName: "Maria Santos",
    notes:
      "Non-drinker Bea excluded from beers/cocktails! Only charged for mango shake & nachos.",
    createdAt: "2026-10-30T22:15:00.000Z",
    items: [
      {
        id: "item-b1",
        name: "San Miguel Pale Pilsen Bucket (6 bottles)",
        price: 720.0,
        priceCentavos: 72000,
        quantity: 1,
        subtotal: 720.0,
        subtotalCentavos: 72000,
        consumerIds: ["u1", "u2", "u4"], // Non-drinker u3 (Bea) excluded
      },
      {
        id: "item-b2",
        name: "Beach Rum Sunset Cocktails",
        price: 320.0,
        priceCentavos: 32000,
        quantity: 2,
        subtotal: 640.0,
        subtotalCentavos: 64000,
        consumerIds: ["u1", "u2", "u4"], // Bea excluded
      },
      {
        id: "item-b3",
        name: "Flotsam Loaded Nachos Supreme",
        price: 380.0,
        priceCentavos: 38000,
        quantity: 1,
        subtotal: 380.0,
        subtotalCentavos: 38000,
        consumerIds: ["u1", "u2", "u3", "u4"], // Everyone shared
      },
      {
        id: "item-b4",
        name: "Fresh Mango Shake (Non-Alcoholic)",
        price: 180.0,
        priceCentavos: 18000,
        quantity: 1,
        subtotal: 180.0,
        subtotalCentavos: 18000,
        consumerIds: ["u3"], // Bea only
      },
    ],
    splits: [
      {
        userId: "u1",
        userName: "Juan Dela Cruz",
        baseAmount: 548.33,
        serviceChargeShare: 0,
        taxShare: 0,
        totalOwed: 548.33,
        totalOwedCentavos: 54833,
        isSettled: false,
      },
      {
        userId: "u2",
        userName: "Maria Santos",
        baseAmount: 548.33,
        serviceChargeShare: 0,
        taxShare: 0,
        totalOwed: 548.33,
        totalOwedCentavos: 54833,
        isSettled: true,
      },
      {
        userId: "u3",
        userName: "Bea Alonzo",
        baseAmount: 275.0,
        serviceChargeShare: 0,
        taxShare: 0,
        totalOwed: 275.0,
        totalOwedCentavos: 27500,
        isSettled: false,
      },
      {
        userId: "u4",
        userName: "Carlo Reyes",
        baseAmount: 548.34,
        serviceChargeShare: 0,
        taxShare: 0,
        totalOwed: 548.34,
        totalOwedCentavos: 54834,
        isSettled: false,
      },
    ],
  },
  {
    id: "exp-03",
    tripId: "trip-elyu-01",
    title: "NLEX/TPLEX Tolls & Diesel Fuel",
    category: "TOLL_HIGHWAY",
    totalAmount: 2028.0,
    totalAmountCentavos: 202800,
    serviceChargePercent: 0,
    serviceChargeAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    paidById: "u1",
    paidByName: "Juan Dela Cruz",
    notes: "Expressway tolls (₱828) + Diesel (₱1,200). Juan driver exempted.",
    createdAt: "2026-10-30T10:00:00.000Z",
    items: [
      {
        id: "item-t1",
        name: "Expressway Tolls (NLEX + SCTEX + TPLEX)",
        price: 828.0,
        priceCentavos: 82800,
        quantity: 1,
        subtotal: 828.0,
        subtotalCentavos: 82800,
        consumerIds: ["u2", "u3", "u4"],
      },
      {
        id: "item-t2",
        name: "Shell V-Power Diesel Top-up",
        price: 1200.0,
        priceCentavos: 120000,
        quantity: 1,
        subtotal: 1200.0,
        subtotalCentavos: 120000,
        consumerIds: ["u2", "u3", "u4"],
      },
    ],
    splits: [
      {
        userId: "u1",
        userName: "Juan Dela Cruz",
        baseAmount: 0,
        serviceChargeShare: 0,
        taxShare: 0,
        totalOwed: 0,
        totalOwedCentavos: 0,
        isSettled: true,
      },
      {
        userId: "u2",
        userName: "Maria Santos",
        baseAmount: 676.0,
        serviceChargeShare: 0,
        taxShare: 0,
        totalOwed: 676.0,
        totalOwedCentavos: 67600,
        isSettled: false,
      },
      {
        userId: "u3",
        userName: "Bea Alonzo",
        baseAmount: 676.0,
        serviceChargeShare: 0,
        taxShare: 0,
        totalOwed: 676.0,
        totalOwedCentavos: 67600,
        isSettled: false,
      },
      {
        userId: "u4",
        userName: "Carlo Reyes",
        baseAmount: 676.0,
        serviceChargeShare: 0,
        taxShare: 0,
        totalOwed: 676.0,
        totalOwedCentavos: 67600,
        isSettled: false,
      },
    ],
  },
];

/**
 * Calculates itemized splits with proportional SC/tax and exact integer centavos.
 */
export function calculateItemizedSplits(
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    consumerIds: string[];
  }>,
  serviceChargePercent: number = 0,
  taxPercent: number = 0,
  members: TripDetail["members"],
): {
  subtotal: number;
  serviceChargeAmount: number;
  taxAmount: number;
  totalAmount: number;
  splits: ExpenseSplit[];
} {
  const memberSubtotalsCentavos: Record<string, number> = {};
  for (const m of members) {
    memberSubtotalsCentavos[m.userId] = 0;
  }

  let totalItemsSubtotalCentavos = 0;

  for (const item of items) {
    const itemSubtotalCentavos = Math.round(item.price * item.quantity * 100);
    totalItemsSubtotalCentavos += itemSubtotalCentavos;

    const consumerCount = item.consumerIds.length;
    if (consumerCount > 0) {
      const basePerConsumer = Math.floor(itemSubtotalCentavos / consumerCount);
      const remainder = itemSubtotalCentavos % consumerCount;

      item.consumerIds.forEach((cId, idx) => {
        const share = basePerConsumer + (idx < remainder ? 1 : 0);
        memberSubtotalsCentavos[cId] =
          (memberSubtotalsCentavos[cId] || 0) + share;
      });
    }
  }

  const serviceChargeAmountCentavos = Math.round(
    totalItemsSubtotalCentavos * (serviceChargePercent / 100),
  );
  const taxAmountCentavos = Math.round(
    totalItemsSubtotalCentavos * (taxPercent / 100),
  );
  const totalAmountCentavos =
    totalItemsSubtotalCentavos +
    serviceChargeAmountCentavos +
    taxAmountCentavos;

  const splits: ExpenseSplit[] = members.map((m) => {
    const memberBaseCentavos = memberSubtotalsCentavos[m.userId] || 0;
    const proportion =
      totalItemsSubtotalCentavos > 0
        ? memberBaseCentavos / totalItemsSubtotalCentavos
        : 0;

    const memberScCentavos = Math.round(
      serviceChargeAmountCentavos * proportion,
    );
    const memberTaxCentavos = Math.round(taxAmountCentavos * proportion);
    const memberTotalCentavos =
      memberBaseCentavos + memberScCentavos + memberTaxCentavos;

    return {
      userId: m.userId,
      userName: m.user.name,
      userAvatar: m.user.avatarUrl,
      baseAmount: memberBaseCentavos / 100,
      serviceChargeShare: memberScCentavos / 100,
      taxShare: memberTaxCentavos / 100,
      totalOwed: memberTotalCentavos / 100,
      totalOwedCentavos: memberTotalCentavos,
      isSettled: false,
    };
  });

  return {
    subtotal: totalItemsSubtotalCentavos / 100,
    serviceChargeAmount: serviceChargeAmountCentavos / 100,
    taxAmount: taxAmountCentavos / 100,
    totalAmount: totalAmountCentavos / 100,
    splits,
  };
}

/**
 * Solves net balances and simplifies bilateral debts using greedy graph solver.
 */
export function solveDebtGraph(
  members: TripDetail["members"],
  expenses: Expense[],
): {
  balances: MemberBalance[];
  settlements: DebtSettlement[];
} {
  const paidCentavos: Record<string, number> = {};
  const owedCentavos: Record<string, number> = {};

  for (const m of members) {
    paidCentavos[m.userId] = 0;
    owedCentavos[m.userId] = 0;
  }

  for (const exp of expenses) {
    paidCentavos[exp.paidById] =
      (paidCentavos[exp.paidById] || 0) + exp.totalAmountCentavos;

    for (const split of exp.splits) {
      owedCentavos[split.userId] =
        (owedCentavos[split.userId] || 0) + split.totalOwedCentavos;
    }
  }

  const balances: MemberBalance[] = members.map((m) => {
    const paid = (paidCentavos[m.userId] || 0) / 100;
    const owed = (owedCentavos[m.userId] || 0) / 100;
    const net = paid - owed;

    return {
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      isNonDrinker: m.isNonDrinker,
      isDriver: m.isDriver,
      gcashNumber: "0917" + Math.floor(1000000 + Math.random() * 9000000),
      mayaNumber: "0918" + Math.floor(1000000 + Math.random() * 9000000),
      totalPaid: paid,
      totalOwed: owed,
      netBalance: net,
    };
  });

  // Partition into Creditors (net > 0) and Debtors (net < 0)
  interface Party {
    userId: string;
    userName: string;
    amountCentavos: number;
  }

  const creditors: Party[] = [];
  const debtors: Party[] = [];

  for (const m of members) {
    const netCentavos =
      (paidCentavos[m.userId] || 0) - (owedCentavos[m.userId] || 0);
    if (netCentavos > 0) {
      creditors.push({
        userId: m.userId,
        userName: m.user.name,
        amountCentavos: netCentavos,
      });
    } else if (netCentavos < 0) {
      debtors.push({
        userId: m.userId,
        userName: m.user.name,
        amountCentavos: -netCentavos,
      });
    }
  }

  creditors.sort((a, b) => b.amountCentavos - a.amountCentavos);
  debtors.sort((a, b) => b.amountCentavos - a.amountCentavos);

  const settlements: DebtSettlement[] = [];
  let cIdx = 0;
  let dIdx = 0;
  let sCount = 1;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx]!;
    const debtor = debtors[dIdx]!;

    const settledCentavos = Math.min(
      creditor.amountCentavos,
      debtor.amountCentavos,
    );

    settlements.push({
      id: `stl-${sCount++}`,
      fromUserId: debtor.userId,
      fromUserName: debtor.userName,
      toUserId: creditor.userId,
      toUserName: creditor.userName,
      amount: settledCentavos / 100,
      amountCentavos: settledCentavos,
      recipientGcash: "0917-123-4567",
      recipientMaya: "0917-123-4567",
      paymentRefCode: `GALA-KKB-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      isSettled: false,
    });

    creditor.amountCentavos -= settledCentavos;
    debtor.amountCentavos -= settledCentavos;

    if (creditor.amountCentavos === 0) cIdx++;
    if (debtor.amountCentavos === 0) dIdx++;
  }

  return { balances, settlements };
}
