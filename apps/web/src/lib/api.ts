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
