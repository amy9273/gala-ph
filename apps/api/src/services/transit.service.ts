import { prisma } from "../lib/prisma.js";
import type { TodaTariff } from "@prisma/client";
import { formatPHP, pesosToCentavos, centavosToPesos } from "@gala-ph/shared";
import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import {
  SearchBusRoutesDto,
  SearchTodaTariffDto,
  PlanTransitDto,
  AttachTransitLegsDto,
} from "../schemas/transit.schema.js";

export interface PlannedTransitLeg {
  stepNumber: number;
  modeType: "BUS" | "TRICYCLE" | "JEEPNEY" | "VAN";
  operatorName: string;
  origin: string;
  destination: string;
  farePerHead: number;
  farePerHeadCentavos: number;
  formattedFarePerHead: string;
  specialTripFare?: number;
  departureTime?: string;
  estimatedHours?: number;
  lastTripCurfew?: string;
  notes?: string;
}

export interface TransitPlanResult {
  origin: string;
  destination: string;
  passengers: number;
  legs: PlannedTransitLeg[];
  totalFarePerHeadPesos: number;
  totalFarePerHeadCentavos: number;
  totalGroupFarePesos: number;
  totalGroupFareCentavos: number;
  formattedTotalPerHead: string;
  formattedTotalGroup: string;
  hasCurfewWarning: boolean;
  curfewAdvisory?: string;
  dialectTips?: string;
}

export class TransitService {
  async getTransitHubs() {
    return prisma.provincialTransitHub.findMany({
      include: {
        _count: {
          select: { routes: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async searchBusRoutes(dto: SearchBusRoutesDto) {
    const whereClause: {
      hubId?: string;
      origin?: { contains: string; mode: "insensitive" };
      destination?: { contains: string; mode: "insensitive" };
    } = {};

    if (dto.hubId) {
      whereClause.hubId = dto.hubId;
    }
    if (dto.origin) {
      whereClause.origin = { contains: dto.origin, mode: "insensitive" };
    }
    if (dto.destination) {
      whereClause.destination = {
        contains: dto.destination,
        mode: "insensitive",
      };
    }

    const routes = await prisma.provincialBusRoute.findMany({
      where: whereClause,
      include: {
        hub: {
          select: {
            name: true,
            city: true,
          },
        },
      },
      orderBy: { baseFare: "asc" },
    });

    const results = [];
    for (const route of routes) {
      const baseFareNum = Number(route.baseFare);
      results.push({
        id: route.id,
        hubName: route.hub.name,
        operatorName: route.operatorName,
        origin: route.origin,
        destination: route.destination,
        serviceType: route.serviceType,
        estimatedHours: route.estimatedHours,
        baseFare: baseFareNum,
        baseFareCentavos: pesosToCentavos(baseFareNum),
        formattedFare: formatPHP(pesosToCentavos(baseFareNum), true),
        firstTrip: route.firstTrip,
        lastTrip: route.lastTrip,
      });
    }

    return results;
  }

  async searchTodaTariffs(dto: SearchTodaTariffDto) {
    const whereClause: {
      municipality?: { contains: string; mode: "insensitive" };
      OR?: Array<{
        barangayOrZone?: { contains: string; mode: "insensitive" };
        routeFrom?: { contains: string; mode: "insensitive" };
        routeTo?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (dto.municipality) {
      whereClause.municipality = {
        contains: dto.municipality,
        mode: "insensitive",
      };
    }

    if (dto.query) {
      whereClause.OR = [
        { barangayOrZone: { contains: dto.query, mode: "insensitive" } },
        { routeFrom: { contains: dto.query, mode: "insensitive" } },
        { routeTo: { contains: dto.query, mode: "insensitive" } },
      ];
    }

    const tariffs: TodaTariff[] = await prisma.todaTariff.findMany({
      where: whereClause,
      orderBy: [{ municipality: "asc" }, { routeFrom: "asc" }],
    });

    const results = [];
    for (const tariff of tariffs) {
      const regFareNum = Number(tariff.regularFarePerHead);
      const specFareNum = Number(tariff.specialTripFare);
      const nightFareNum = tariff.nightDiffFare
        ? Number(tariff.nightDiffFare)
        : null;

      results.push({
        id: tariff.id,
        municipality: tariff.municipality,
        barangayOrZone: tariff.barangayOrZone,
        routeFrom: tariff.routeFrom,
        routeTo: tariff.routeTo,
        regularFarePerHead: regFareNum,
        specialTripFare: specFareNum,
        nightDiffFare: nightFareNum,
        lastTripCurfew: tariff.lastTripCurfew,
        dialectTips: tariff.dialectTips,
        formattedRegularFare: formatPHP(pesosToCentavos(regFareNum), true),
        formattedSpecialFare: formatPHP(pesosToCentavos(specFareNum), true),
      });
    }

    return results;
  }

  /**
   * Plans an end-to-end multi-leg commuter itinerary (Bus Hub -> Provincial Highway -> TODA Tricycle).
   */
  async planMultiLegTransit(dto: PlanTransitDto): Promise<TransitPlanResult> {
    const destLower = dto.destination.toLowerCase();

    // 1. Resolve Provincial Bus Leg
    const busRoutes = await prisma.provincialBusRoute.findMany({
      where: {
        OR: [
          { destination: { contains: dto.destination, mode: "insensitive" } },
          { destination: { contains: "La Union", mode: "insensitive" } },
          { destination: { contains: "Batangas", mode: "insensitive" } },
          { destination: { contains: "Baguio", mode: "insensitive" } },
          { destination: { contains: "Aurora", mode: "insensitive" } },
          { destination: { contains: "Baler", mode: "insensitive" } },
        ],
      },
      include: { hub: true },
      orderBy: { baseFare: "asc" },
    });

    let matchedBusRoute = null;
    for (const route of busRoutes) {
      if (
        destLower.includes(route.destination.toLowerCase()) ||
        (destLower.includes("la union") &&
          route.destination.includes("La Union")) ||
        (destLower.includes("batangas") &&
          route.destination.includes("Batangas")) ||
        (destLower.includes("baguio") &&
          route.destination.includes("Baguio")) ||
        (destLower.includes("baler") && route.destination.includes("Baler"))
      ) {
        matchedBusRoute = route;
        break;
      }
    }

    if (!matchedBusRoute && busRoutes.length > 0) {
      matchedBusRoute = busRoutes[0];
    }

    if (!matchedBusRoute) {
      throw new NotFoundError(
        `No provincial commuter routes found connecting to "${dto.destination}".`,
      );
    }

    // 2. Resolve Local TODA Tricycle Leg
    const todaTariffs: TodaTariff[] = await prisma.todaTariff.findMany();
    let matchedToda: TodaTariff | null = null;

    for (const toda of todaTariffs) {
      if (
        destLower.includes(toda.municipality.toLowerCase()) ||
        destLower.includes(toda.barangayOrZone.toLowerCase()) ||
        destLower.includes(toda.routeTo.toLowerCase()) ||
        ((destLower.includes("elyu") || destLower.includes("san juan")) &&
          toda.municipality.includes("San Juan"))
      ) {
        matchedToda = toda;
        break;
      }
    }

    // Fallback: Default to Urbiztondo TODA if destination is La Union
    if (!matchedToda && destLower.includes("la union")) {
      for (const toda of todaTariffs) {
        if (toda.municipality.includes("San Juan")) {
          matchedToda = toda;
          break;
        }
      }
    }

    const legs: PlannedTransitLeg[] = [];
    const busFare = Number(matchedBusRoute.baseFare);
    const busFareCentavos = pesosToCentavos(busFare);

    legs.push({
      stepNumber: 1,
      modeType: "BUS",
      operatorName: matchedBusRoute.operatorName,
      origin: `${matchedBusRoute.hub.name} (${matchedBusRoute.origin})`,
      destination: matchedBusRoute.destination,
      farePerHead: busFare,
      farePerHeadCentavos: busFareCentavos,
      formattedFarePerHead: formatPHP(busFareCentavos, true),
      departureTime: matchedBusRoute.firstTrip,
      estimatedHours: matchedBusRoute.estimatedHours,
      notes: `Take ${matchedBusRoute.operatorName} from ${matchedBusRoute.hub.name}. Estimated travel time: ${matchedBusRoute.estimatedHours}h.`,
    });

    let todaFare = 25.0;
    let todaSpecialFare = 100.0;
    let curfew = "21:30";
    let dialectTips =
      "Local tip: Inform tricycle driver of your resort name. Regular fare is ₱25/head; special charter is ₱100.";

    if (matchedToda) {
      todaFare = Number(matchedToda.regularFarePerHead);
      todaSpecialFare = Number(matchedToda.specialTripFare);
      curfew = matchedToda.lastTripCurfew || "21:30";
      dialectTips = matchedToda.dialectTips || dialectTips;

      legs.push({
        stepNumber: 2,
        modeType: "TRICYCLE",
        operatorName: `${matchedToda.municipality} TODA`,
        origin: matchedToda.routeFrom,
        destination: matchedToda.routeTo,
        farePerHead: todaFare,
        farePerHeadCentavos: pesosToCentavos(todaFare),
        formattedFarePerHead: formatPHP(pesosToCentavos(todaFare), true),
        specialTripFare: todaSpecialFare,
        lastTripCurfew: curfew,
        notes: `At ${matchedToda.routeFrom}, ride tricycle to ${matchedToda.routeTo}. Last trip curfew is ${curfew}.`,
      });
    }

    const todaFareCentavos = pesosToCentavos(todaFare);
    const totalFarePerHeadCentavos = busFareCentavos + todaFareCentavos;
    const totalFarePerHeadPesos = centavosToPesos(totalFarePerHeadCentavos);

    const totalGroupFareCentavos = totalFarePerHeadCentavos * dto.passengers;
    const totalGroupFarePesos = centavosToPesos(totalGroupFareCentavos);

    // Curfew Risk Assessment
    const hasCurfewWarning = true; // Always surface last-trip curfew advisory for provincial travel
    const curfewAdvisory = `⚠️ Last TODA trip curfew is ${curfew}. If arriving after ${curfew}, you may need to pay night differential or arrange a chartered special trip in advance.`;

    return {
      origin: dto.origin,
      destination: dto.destination,
      passengers: dto.passengers,
      legs,
      totalFarePerHeadPesos,
      totalFarePerHeadCentavos,
      totalGroupFarePesos,
      totalGroupFareCentavos,
      formattedTotalPerHead: formatPHP(totalFarePerHeadCentavos, true),
      formattedTotalGroup: formatPHP(totalGroupFareCentavos, true),
      hasCurfewWarning,
      curfewAdvisory,
      dialectTips,
    };
  }

  async attachTransitLegsToTrip(
    userId: string,
    tripId: string,
    dto: AttachTransitLegsDto,
  ) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });

    if (!trip) {
      throw new NotFoundError("Trip not found");
    }

    let isMember = false;
    for (const member of trip.members) {
      if (member.userId === userId) {
        isMember = true;
        break;
      }
    }

    if (!isMember) {
      throw new ForbiddenError(
        "You must be a member of this trip to attach transit legs",
      );
    }

    // Clean prior transit legs if replacing
    await prisma.transitLeg.deleteMany({
      where: { tripId },
    });

    const createdLegs = [];
    for (const leg of dto.legs) {
      const created = await prisma.transitLeg.create({
        data: {
          tripId,
          stepNumber: leg.stepNumber,
          modeType: leg.modeType,
          operatorName: leg.operatorName,
          origin: leg.origin,
          destination: leg.destination,
          farePerHead: leg.farePerHead,
          specialTripFare: leg.specialTripFare,
          lastTripTime: leg.lastTripTime,
          notes: leg.notes,
        },
      });
      createdLegs.push(created);
    }

    return {
      message: "Transit legs attached successfully to trip",
      tripId,
      legs: createdLegs,
    };
  }
}

export const transitService = new TransitService();
