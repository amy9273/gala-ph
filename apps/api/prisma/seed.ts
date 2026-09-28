import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import {
  PrismaClient,
  Role,
  TravelMode,
  ExpenseCategory,
  RfidProvider,
} from "@prisma/client";

// Load .env from workspace or monorepo root
dotenv.config();
const monorepoRootEnv = path.resolve(process.cwd(), "../../.env");
if (fs.existsSync(monorepoRootEnv)) {
  dotenv.config({ path: monorepoRootEnv });
}

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting GalaPH Philippine Travel & Transit Seed...");

  // Clean existing tables in reverse dependency order
  await prisma.expenseSplit.deleteMany();
  await prisma.itemConsumer.deleteMany();
  await prisma.expenseItem.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.packingItem.deleteMany();
  await prisma.tripWeatherAlert.deleteMany();
  await prisma.transitLeg.deleteMany();
  await prisma.tollEstimate.deleteMany();
  await prisma.itineraryItem.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();
  await prisma.provincialBusRoute.deleteMany();
  await prisma.provincialTransitHub.deleteMany();
  await prisma.expresswayTollRate.deleteMany();

  console.log("🧹 Cleaned existing records.");

  // ==========================================
  // 1. MASTER PHILIPPINE EXPRESSWAY TOLL RATES
  // ==========================================
  const tollRatesData = [
    // NLEX (EASYTRIP)
    {
      expressway: "NLEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Balintawak",
      exitPlaza: "San Fernando",
      class1Fee: 157.0,
      class2Fee: 392.0,
      class3Fee: 470.0,
    },
    {
      expressway: "NLEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Balintawak",
      exitPlaza: "Dau",
      class1Fee: 302.0,
      class2Fee: 755.0,
      class3Fee: 906.0,
    },
    {
      expressway: "NLEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Balintawak",
      exitPlaza: "Sta. Ines",
      class1Fee: 344.0,
      class2Fee: 860.0,
      class3Fee: 1032.0,
    },
    {
      expressway: "NLEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Mindanao Ave",
      exitPlaza: "San Fernando",
      class1Fee: 157.0,
      class2Fee: 392.0,
      class3Fee: 470.0,
    },
    {
      expressway: "NLEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Mindanao Ave",
      exitPlaza: "Dau",
      class1Fee: 302.0,
      class2Fee: 755.0,
      class3Fee: 906.0,
    },

    // SCTEX (EASYTRIP)
    {
      expressway: "SCTEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Clark South",
      exitPlaza: "Subic (Tipo)",
      class1Fee: 145.0,
      class2Fee: 290.0,
      class3Fee: 435.0,
    },
    {
      expressway: "SCTEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Clark South",
      exitPlaza: "Tarlac Central",
      class1Fee: 114.0,
      class2Fee: 228.0,
      class3Fee: 342.0,
    },
    {
      expressway: "SCTEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Subic (Tipo)",
      exitPlaza: "Tarlac Central",
      class1Fee: 259.0,
      class2Fee: 518.0,
      class3Fee: 777.0,
    },

    // TPLEX (AUTOSWEEP)
    {
      expressway: "TPLEX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Tarlac Central",
      exitPlaza: "Urdaneta",
      class1Fee: 165.0,
      class2Fee: 413.0,
      class3Fee: 495.0,
    },
    {
      expressway: "TPLEX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Tarlac Central",
      exitPlaza: "Pozorrubio",
      class1Fee: 240.0,
      class2Fee: 600.0,
      class3Fee: 720.0,
    },
    {
      expressway: "TPLEX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Tarlac Central",
      exitPlaza: "Rosario (La Union)",
      class1Fee: 311.0,
      class2Fee: 778.0,
      class3Fee: 933.0,
    },

    // Skyway Stage 3 (AUTOSWEEP)
    {
      expressway: "SKYWAY_3",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Buendia",
      exitPlaza: "Balintawak",
      class1Fee: 264.0,
      class2Fee: 528.0,
      class3Fee: 792.0,
    },
    {
      expressway: "SKYWAY_3",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Buendia",
      exitPlaza: "Plaza Dilao",
      class1Fee: 105.0,
      class2Fee: 210.0,
      class3Fee: 315.0,
    },
    {
      expressway: "SKYWAY_3",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Quezon Ave",
      exitPlaza: "Balintawak",
      class1Fee: 129.0,
      class2Fee: 258.0,
      class3Fee: 387.0,
    },

    // SLEX (AUTOSWEEP)
    {
      expressway: "SLEX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Magallanes",
      exitPlaza: "Alabang",
      class1Fee: 88.0,
      class2Fee: 176.0,
      class3Fee: 264.0,
    },
    {
      expressway: "SLEX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Magallanes",
      exitPlaza: "Santa Rosa",
      class1Fee: 164.0,
      class2Fee: 328.0,
      class3Fee: 492.0,
    },
    {
      expressway: "SLEX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Magallanes",
      exitPlaza: "Calamba",
      class1Fee: 214.0,
      class2Fee: 428.0,
      class3Fee: 642.0,
    },
    {
      expressway: "SLEX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Magallanes",
      exitPlaza: "Sto. Tomas",
      class1Fee: 260.0,
      class2Fee: 520.0,
      class3Fee: 780.0,
    },

    // CALAX (EASYTRIP)
    {
      expressway: "CALAX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Mamplasan",
      exitPlaza: "Santa Rosa",
      class1Fee: 47.0,
      class2Fee: 94.0,
      class3Fee: 141.0,
    },
    {
      expressway: "CALAX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Mamplasan",
      exitPlaza: "Silang East",
      class1Fee: 148.0,
      class2Fee: 296.0,
      class3Fee: 444.0,
    },
    {
      expressway: "CALAX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Mamplasan",
      exitPlaza: "Aguinaldo Highway",
      class1Fee: 210.0,
      class2Fee: 420.0,
      class3Fee: 630.0,
    },

    // CAVITEX (EASYTRIP)
    {
      expressway: "CAVITEX",
      rfidProvider: RfidProvider.EASYTRIP,
      entryPlaza: "Longos",
      exitPlaza: "Kawit",
      class1Fee: 73.0,
      class2Fee: 146.0,
      class3Fee: 219.0,
    },

    // MCX (AUTOSWEEP)
    {
      expressway: "MCX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Susana Heights",
      exitPlaza: "Daang Hari",
      class1Fee: 17.0,
      class2Fee: 34.0,
      class3Fee: 51.0,
    },

    // CCLEX (Cebu)
    {
      expressway: "CCLEX",
      rfidProvider: RfidProvider.AUTOSWEEP,
      entryPlaza: "Cordova",
      exitPlaza: "Cebu City",
      class1Fee: 90.0,
      class2Fee: 180.0,
      class3Fee: 270.0,
    },
  ];

  await prisma.expresswayTollRate.createMany({
    data: tollRatesData,
  });

  console.log(
    `✅ Seeded ${tollRatesData.length} expressway toll rate segments.`,
  );

  // ==========================================
  // 2. PROVINCIAL TRANSIT HUBS & BUS ROUTES
  // ==========================================
  await prisma.provincialTransitHub.create({
    data: {
      name: "PITX (Parañaque Integrated Terminal Exchange)",
      city: "Parañaque, Metro Manila",
      latitude: 14.5105,
      longitude: 120.9912,
      destinations: "Batangas, Cavite, Laguna, Quezon, Bicol",
      routes: {
        create: [
          {
            operatorName: "DLTB / JAM Liner",
            origin: "PITX",
            destination: "Batangas Grand Terminal",
            serviceType: "Air-Conditioned Express",
            estimatedHours: 2.5,
            baseFare: 197.0,
            firstTrip: "03:00 AM",
            lastTrip: "11:00 PM",
          },
          {
            operatorName: "San Agustin",
            origin: "PITX",
            destination: "Tagaytay Olivarez Plaza",
            serviceType: "Regular Air-Conditioned",
            estimatedHours: 2.0,
            baseFare: 133.0,
            firstTrip: "04:00 AM",
            lastTrip: "10:30 PM",
          },
          {
            operatorName: "JAC Liner",
            origin: "PITX",
            destination: "Lucena Grand Central",
            serviceType: "Air-Conditioned",
            estimatedHours: 4.0,
            baseFare: 275.0,
            firstTrip: "04:00 AM",
            lastTrip: "09:00 PM",
          },
        ],
      },
    },
  });

  await prisma.provincialTransitHub.create({
    data: {
      name: "Cubao EDSA Provincial Bus Terminal Hub",
      city: "Quezon City, Metro Manila",
      latitude: 14.6225,
      longitude: 121.0531,
      destinations: "La Union, Baguio, Pangasinan, Aurora, Ilocos",
      routes: {
        create: [
          {
            operatorName: "Genesis JoyBus",
            origin: "Cubao",
            destination: "San Juan, La Union",
            serviceType: "Executive Deluxe (with CR & Snacks)",
            estimatedHours: 4.5,
            baseFare: 850.0,
            firstTrip: "01:00 AM",
            lastTrip: "11:55 PM",
          },
          {
            operatorName: "Victory Liner",
            origin: "Cubao",
            destination: "Baguio City",
            serviceType: "First Class Express",
            estimatedHours: 4.0,
            baseFare: 780.0,
            firstTrip: "02:00 AM",
            lastTrip: "11:30 PM",
          },
          {
            operatorName: "Genesis JoyBus",
            origin: "Cubao",
            destination: "Baler, Aurora",
            serviceType: "Executive Deluxe",
            estimatedHours: 5.5,
            baseFare: 800.0,
            firstTrip: "02:00 AM",
            lastTrip: "11:00 PM",
          },
          {
            operatorName: "Partas Bus",
            origin: "Cubao",
            destination: "Vigan City, Ilocos Sur",
            serviceType: "Deluxe",
            estimatedHours: 7.5,
            baseFare: 950.0,
            firstTrip: "06:00 AM",
            lastTrip: "10:00 PM",
          },
        ],
      },
    },
  });

  await prisma.provincialTransitHub.create({
    data: {
      name: "Buendia / Pasay Transit Terminal",
      city: "Pasay / Makati, Metro Manila",
      latitude: 14.5542,
      longitude: 120.9983,
      destinations: "Batangas, Laguna, Quezon",
      routes: {
        create: [
          {
            operatorName: "DLTB Co.",
            origin: "Buendia",
            destination: "Nasugbu, Batangas",
            serviceType: "Regular Air-Conditioned",
            estimatedHours: 3.0,
            baseFare: 210.0,
            firstTrip: "04:30 AM",
            lastTrip: "09:30 PM",
          },
          {
            operatorName: "Green Star Express",
            origin: "Buendia",
            destination: "Santa Cruz, Laguna",
            serviceType: "Regular Air-Conditioned",
            estimatedHours: 2.5,
            baseFare: 160.0,
            firstTrip: "05:00 AM",
            lastTrip: "09:00 PM",
          },
        ],
      },
    },
  });

  console.log(
    `✅ Seeded 3 transit hubs (PITX, Cubao, Buendia) with 9 active provincial routes.`,
  );

  // ==========================================
  // 3. SEED USERS & BARKADA TRIP
  // ==========================================
  const juan = await prisma.user.create({
    data: {
      email: "juan.delacruz@gala-ph.dev",
      name: "Juan Dela Cruz",
      phone: "+639171234567",
      gcashNumber: "09171234567",
      mayaNumber: "09171234567",
    },
  });

  const maria = await prisma.user.create({
    data: {
      email: "maria.santos@gala-ph.dev",
      name: "Maria Santos",
      phone: "+639189876543",
      gcashNumber: "09189876543",
    },
  });

  const carlo = await prisma.user.create({
    data: {
      email: "carlo.reyes@gala-ph.dev",
      name: "Carlo Reyes",
      phone: "+639205551234",
      gcashNumber: "09205551234",
    },
  });

  const bea = await prisma.user.create({
    data: {
      email: "bea.alonzo@gala-ph.dev",
      name: "Bea Alonzo",
      phone: "+639998887777",
      gcashNumber: "09998887777",
    },
  });

  console.log(`✅ Seeded 4 barkada users.`);

  // Create Trip: "Elyu Surf & Chill Weekend"
  const trip = await prisma.trip.create({
    data: {
      title: "Elyu Surf & Chill Weekend",
      destination: "San Juan, La Union",
      startDate: new Date("2026-10-16T00:00:00Z"),
      endDate: new Date("2026-10-18T23:59:59Z"),
      travelMode: TravelMode.HYBRID,
      inviteCode: "ELYU-2026",
      createdById: juan.id,
      members: {
        create: [
          {
            userId: juan.id,
            role: Role.TRIP_LEAD,
            isDriver: true,
            vehicleId: "car-fortuner",
          },
          {
            userId: maria.id,
            role: Role.DRIVER,
            isDriver: true,
            vehicleId: "car-vios",
          },
          {
            userId: carlo.id,
            role: Role.COMMUTER,
            isDriver: false,
          },
          {
            userId: bea.id,
            role: Role.MEMBER,
            isDriver: false,
            isNonDrinker: true,
            dietaryNotes: "No alcohol, Shellfish allergy",
            vehicleId: "car-fortuner",
          },
        ],
      },
      packingItems: {
        create: [
          {
            itemName: "Coleman 40L Ice Cooler",
            category: "GEAR",
            quantity: 1,
            assignedToId: juan.id,
            isPacked: true,
            packedAt: new Date(),
          },
          {
            itemName: "First Aid Kit & Motion Sickness Meds",
            category: "MEDICAL",
            quantity: 1,
            assignedToId: bea.id,
            isPacked: true,
            packedAt: new Date(),
          },
          {
            itemName: "10m Heavy Duty Outdoor Extension Cord",
            category: "GEAR",
            quantity: 1,
            assignedToId: maria.id,
            isPacked: false,
          },
          {
            itemName: "San Miguel Pale Pilsen Cases (2x)",
            category: "FOOD_DRINKS",
            quantity: 2,
            assignedToId: carlo.id,
            isPacked: false,
          },
        ],
      },
      weatherAlerts: {
        create: [
          {
            alertType: "GALE_WARNING",
            severity: "MODERATE",
            headline:
              "Strong to Gale Force Winds over Northern Luzon Seaboards",
            advisory:
              "DOST-PAGASA Gale Warning #4: Southwest Monsoon (Habagat). Small seacrafts are advised not to venture out into the sea. Surfers should exercise heightened caution.",
            source: "DOST-PAGASA",
          },
        ],
      },
      tollEstimates: {
        create: [
          {
            expresswayName: "NLEX",
            rfidProvider: "EASYTRIP",
            entryPlaza: "Balintawak",
            exitPlaza: "San Fernando",
            classType: 1,
            amount: 157.0,
          },
          {
            expresswayName: "SCTEX",
            rfidProvider: "EASYTRIP",
            entryPlaza: "Clark South",
            exitPlaza: "Tarlac Central",
            classType: 1,
            amount: 114.0,
          },
          {
            expresswayName: "TPLEX",
            rfidProvider: "AUTOSWEEP",
            entryPlaza: "Tarlac Central",
            exitPlaza: "Rosario (La Union)",
            classType: 1,
            amount: 311.0,
          },
        ],
      },
      transitLegs: {
        create: [
          {
            stepNumber: 1,
            modeType: "BUS",
            operatorName: "Genesis JoyBus",
            origin: "Cubao Terminal",
            destination: "San Juan, La Union",
            farePerHead: 850.0,
            notes:
              "Board at 04:00 AM; estimated arrival 08:30 AM at Urbiztondo beachfront.",
          },
          {
            stepNumber: 2,
            modeType: "TRICYCLE",
            operatorName: "San Juan TODA",
            origin: "Urbiztondo Highway Drop-off",
            destination: "Beachfront Villa",
            farePerHead: 50.0,
            specialTripFare: 100.0,
            notes:
              "Standard TODA tariff rate: ₱50 per head or ₱100 special trip.",
          },
        ],
      },
      itineraryItems: {
        create: [
          {
            dayNumber: 1,
            timeSlot: "04:00 AM",
            activity: "Convoy Departure from Petron NLEX Marilao",
            location: "Petron NLEX KM 23 Northbound",
            latitude: 14.7571,
            longitude: 120.9482,
            estimatedCost: 0.0,
          },
          {
            dayNumber: 1,
            timeSlot: "09:30 AM",
            activity: "Arrival & Brunch at Masa Bakehouse",
            location: "San Juan, La Union",
            latitude: 16.6668,
            longitude: 120.3235,
            estimatedCost: 1500.0,
          },
          {
            dayNumber: 1,
            timeSlot: "03:00 PM",
            activity: "Afternoon Surf Lesson at Urbiztondo Beach",
            location: "Urbiztondo Beach, San Juan",
            latitude: 16.6631,
            longitude: 120.3218,
            estimatedCost: 2400.0,
          },
          {
            dayNumber: 1,
            timeSlot: "07:30 PM",
            activity: "Tagpuan Seafood Dinner & Barkada Inuman",
            location: "Tagpuan sa San Juan",
            latitude: 16.6644,
            longitude: 120.3225,
            estimatedCost: 2400.0,
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded demo trip: "${trip.title}" (${trip.inviteCode}).`);

  // ==========================================
  // 4. GRANULAR KKB ITEM CONSUMPTION EXPENSE
  // ==========================================
  // Tagpuan Seafood Dinner & Inuman
  // Total: ₱2,400.00
  // - Dish 1: Grilled Liempo Plate (₱750) -> Juan, Maria, Carlo, Bea (all 4)
  // - Dish 2: San Mig Pale Pilsen Bucket (₱900) -> Juan, Maria, Carlo (BEA EXCLUDED: Non-drinker)
  // - Dish 3: Garlic Butter Shrimp (₱700) -> Juan, Maria, Carlo (BEA EXCLUDED: Shellfish allergy)
  // - Service charge & tip: ₱50
  await prisma.expense.create({
    data: {
      tripId: trip.id,
      paidById: juan.id,
      title: "Tagpuan Seafood Dinner & Barkada Inuman",
      category: ExpenseCategory.FOOD_AND_DINING,
      totalAmount: 2400.0,
      totalCentavos: 240000,
      serviceAndTaxFee: 50.0,
      items: {
        create: [
          {
            name: "Grilled Liempo Plate (x3)",
            price: 750.0,
            priceCentavos: 75000,
            quantity: 3,
            consumers: {
              create: [
                { userId: juan.id },
                { userId: maria.id },
                { userId: carlo.id },
                { userId: bea.id },
              ],
            },
          },
          {
            name: "San Mig Pale Pilsen Bucket (x2)",
            price: 900.0,
            priceCentavos: 90000,
            quantity: 2,
            consumers: {
              create: [
                { userId: juan.id },
                { userId: maria.id },
                { userId: carlo.id },
              ],
            },
          },
          {
            name: "Garlic Butter Shrimp (x2)",
            price: 700.0,
            priceCentavos: 70000,
            quantity: 2,
            consumers: {
              create: [
                { userId: juan.id },
                { userId: maria.id },
                { userId: carlo.id },
              ],
            },
          },
        ],
      },
      // Splits calculated with mathematical conservation:
      // Subtotal = 2350
      // Bea: Liempo (750 / 4) = 187.50. Service charge share = (187.50 / 2350) * 50 = 3.99. Total = 191.49
      // Drinkers (Juan, Maria, Carlo): each gets 187.50 (liempo) + 300 (beer) + 233.33 (shrimp) = 720.83.
      // Share of service fee: 15.34 each.
      // Total per drinker = 736.17
      // 191.49 + 736.17 * 3 = 2400.00 exact!
      splits: {
        create: [
          {
            userId: juan.id,
            amountOwed: 736.17,
            amountCentavos: 73617,
            isSettled: true, // Juan is the payer
            settledAt: new Date(),
          },
          {
            userId: maria.id,
            amountOwed: 736.17,
            amountCentavos: 73617,
            isSettled: false,
          },
          {
            userId: carlo.id,
            amountOwed: 736.17,
            amountCentavos: 73617,
            isSettled: false,
          },
          {
            userId: bea.id,
            amountOwed: 191.49,
            amountCentavos: 19149,
            isSettled: false,
          },
        ],
      },
    },
  });

  console.log(
    `✅ Seeded granular KKB expense with Non-Drinker / Allergy exclusion.`,
  );
  console.log(`🎉 GalaPH Philippine Travel database seeded successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
