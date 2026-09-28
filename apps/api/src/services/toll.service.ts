import { prisma } from "../lib/prisma.js";
import { formatPHP, pesosToCentavos, centavosToPesos } from "@gala-ph/shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../errors/AppError.js";
import {
  CalculateTollDto,
  FuelEstimateDto,
  AttachTollEstimateDto,
  PresetRoute,
  TollSegmentDto,
} from "../schemas/toll.schema.js";

export interface EvaluatedTollLeg {
  expressway: string;
  rfidProvider: "AUTOSWEEP" | "EASYTRIP";
  entryPlaza: string;
  exitPlaza: string;
  classType: number;
  amount: number;
  amountCentavos: number;
}

export interface DualRfidAccountSummary {
  rfidProvider: "AUTOSWEEP" | "EASYTRIP";
  totalPesos: number;
  totalCentavos: number;
  recommendedTopUpPesos: number;
  formattedTotal: string;
  legs: EvaluatedTollLeg[];
}

export interface RouteTollCalculationResult {
  presetRoute?: PresetRoute;
  classType: number;
  totalTollPesos: number;
  totalTollCentavos: number;
  formattedTotalToll: string;
  legs: EvaluatedTollLeg[];
  rfidBreakdown: {
    autosweep: DualRfidAccountSummary;
    easytrip: DualRfidAccountSummary;
  };
}

export interface FuelCalculationResult {
  distanceKm: number;
  vehiclePreset: string;
  fuelType: string;
  fuelEfficiencyKmPerLiter: number;
  pricePerLiter: number;
  litersNeeded: number;
  totalFuelPesos: number;
  totalFuelCentavos: number;
  formattedTotalFuel: string;
}

export class TollService {
  public static readonly PRESET_ROUTES: Record<
    PresetRoute,
    {
      name: string;
      destination: string;
      distanceKm: number;
      segments: TollSegmentDto[];
    }
  > = {
    MANILA_TO_LA_UNION: {
      name: "Manila to La Union (Elyu Surf Weekend)",
      destination: "San Juan, La Union",
      distanceKm: 275,
      segments: [
        {
          expressway: "SKYWAY_3",
          entryPlaza: "Buendia",
          exitPlaza: "Balintawak",
        },
        {
          expressway: "NLEX",
          entryPlaza: "Balintawak",
          exitPlaza: "Dau",
        },
        {
          expressway: "SCTEX",
          entryPlaza: "Clark South",
          exitPlaza: "Tarlac Central",
        },
        {
          expressway: "TPLEX",
          entryPlaza: "Tarlac Central",
          exitPlaza: "Rosario (La Union)",
        },
      ],
    },
    MANILA_TO_BAGUIO: {
      name: "Manila to Baguio City (Summer Capital)",
      destination: "Baguio City, Benguet",
      distanceKm: 250,
      segments: [
        {
          expressway: "SKYWAY_3",
          entryPlaza: "Buendia",
          exitPlaza: "Balintawak",
        },
        {
          expressway: "NLEX",
          entryPlaza: "Balintawak",
          exitPlaza: "Dau",
        },
        {
          expressway: "SCTEX",
          entryPlaza: "Clark South",
          exitPlaza: "Tarlac Central",
        },
        {
          expressway: "TPLEX",
          entryPlaza: "Tarlac Central",
          exitPlaza: "Rosario (La Union)",
        },
      ],
    },
    MANILA_TO_BATANGAS_PORT: {
      name: "Manila to Batangas Port (Puerto Galera jump-off)",
      destination: "Batangas Port, Batangas",
      distanceKm: 110,
      segments: [
        {
          expressway: "SLEX",
          entryPlaza: "Magallanes",
          exitPlaza: "Sto. Tomas",
        },
      ],
    },
    MANILA_TO_TAGAYTAY: {
      name: "Manila to Tagaytay (Cool Breeze & Bulalo)",
      destination: "Tagaytay, Cavite",
      distanceKm: 65,
      segments: [
        {
          expressway: "SLEX",
          entryPlaza: "Magallanes",
          exitPlaza: "Santa Rosa",
        },
        {
          expressway: "CALAX",
          entryPlaza: "Mamplasan",
          exitPlaza: "Aguinaldo Highway",
        },
      ],
    },
    MANILA_TO_SUBIC: {
      name: "Manila to Subic Bay / Zambales Beaches",
      destination: "Subic Bay Freeport Zone",
      distanceKm: 130,
      segments: [
        {
          expressway: "SKYWAY_3",
          entryPlaza: "Buendia",
          exitPlaza: "Balintawak",
        },
        {
          expressway: "NLEX",
          entryPlaza: "Balintawak",
          exitPlaza: "San Fernando",
        },
        {
          expressway: "SCTEX",
          entryPlaza: "Clark South",
          exitPlaza: "Subic (Tipo)",
        },
      ],
    },
  };

  /**
   * Resolves toll fee for an expressway plaza pair with symmetrical fallback.
   */
  private async resolvePlazaFee(
    expressway: string,
    entryPlaza: string,
    exitPlaza: string,
    classType: number,
  ): Promise<EvaluatedTollLeg> {
    // 1. Direct entry -> exit lookup
    let rate = await prisma.expresswayTollRate.findFirst({
      where: {
        expressway: { equals: expressway, mode: "insensitive" },
        entryPlaza: { equals: entryPlaza, mode: "insensitive" },
        exitPlaza: { equals: exitPlaza, mode: "insensitive" },
      },
    });

    // 2. Symmetrical exit -> entry fallback (bidirectional highway toll equivalence)
    if (!rate) {
      rate = await prisma.expresswayTollRate.findFirst({
        where: {
          expressway: { equals: expressway, mode: "insensitive" },
          entryPlaza: { equals: exitPlaza, mode: "insensitive" },
          exitPlaza: { equals: entryPlaza, mode: "insensitive" },
        },
      });
    }

    if (!rate) {
      throw new NotFoundError(
        `Expressway toll rate not found for ${expressway} (${entryPlaza} to ${exitPlaza})`,
      );
    }

    let feeDecimal = rate.class1Fee;
    if (classType === 2) {
      feeDecimal = rate.class2Fee;
    } else if (classType === 3) {
      feeDecimal = rate.class3Fee;
    }

    const feeAmount = Number(feeDecimal);
    const amountCentavos = pesosToCentavos(feeAmount);

    return {
      expressway: rate.expressway,
      rfidProvider: rate.rfidProvider as "AUTOSWEEP" | "EASYTRIP",
      entryPlaza: rate.entryPlaza,
      exitPlaza: rate.exitPlaza,
      classType,
      amount: feeAmount,
      amountCentavos,
    };
  }

  /**
   * Calculates multi-leg toll route and groups fees strictly by RFID provider.
   */
  async calculateRouteToll(
    dto: CalculateTollDto,
  ): Promise<RouteTollCalculationResult> {
    let segmentsToProcess: TollSegmentDto[] = [];

    if (dto.presetRoute) {
      const preset = TollService.PRESET_ROUTES[dto.presetRoute];
      if (!preset) {
        throw new BadRequestError(`Unknown preset route: ${dto.presetRoute}`);
      }
      segmentsToProcess = preset.segments;
    } else if (dto.segments && dto.segments.length > 0) {
      segmentsToProcess = dto.segments;
    } else {
      throw new BadRequestError("No toll segments provided for calculation");
    }

    const evaluatedLegs: EvaluatedTollLeg[] = [];
    const autosweepLegs: EvaluatedTollLeg[] = [];
    const easytripLegs: EvaluatedTollLeg[] = [];

    let totalAutosweepCentavos = 0;
    let totalEasytripCentavos = 0;

    for (const segment of segmentsToProcess) {
      const leg = await this.resolvePlazaFee(
        segment.expressway,
        segment.entryPlaza,
        segment.exitPlaza,
        dto.classType,
      );

      evaluatedLegs.push(leg);

      if (leg.rfidProvider === "AUTOSWEEP") {
        autosweepLegs.push(leg);
        totalAutosweepCentavos += leg.amountCentavos;
      } else {
        easytripLegs.push(leg);
        totalEasytripCentavos += leg.amountCentavos;
      }
    }

    const autosweepPesos = centavosToPesos(totalAutosweepCentavos);
    const easytripPesos = centavosToPesos(totalEasytripCentavos);

    // Recommend top-up in nearest ₱50 denomination buffer for peace of mind
    const recommendedAutosweepTopUp =
      Math.ceil(autosweepPesos / 50) * 50 || autosweepPesos;
    const recommendedEasytripTopUp =
      Math.ceil(easytripPesos / 50) * 50 || easytripPesos;

    const totalTollCentavos = totalAutosweepCentavos + totalEasytripCentavos;
    const totalTollPesos = centavosToPesos(totalTollCentavos);

    return {
      presetRoute: dto.presetRoute,
      classType: dto.classType,
      totalTollPesos,
      totalTollCentavos,
      formattedTotalToll: formatPHP(totalTollCentavos, true),
      legs: evaluatedLegs,
      rfidBreakdown: {
        autosweep: {
          rfidProvider: "AUTOSWEEP",
          totalPesos: autosweepPesos,
          totalCentavos: totalAutosweepCentavos,
          recommendedTopUpPesos: recommendedAutosweepTopUp,
          formattedTotal: formatPHP(totalAutosweepCentavos, true),
          legs: autosweepLegs,
        },
        easytrip: {
          rfidProvider: "EASYTRIP",
          totalPesos: easytripPesos,
          totalCentavos: totalEasytripCentavos,
          recommendedTopUpPesos: recommendedEasytripTopUp,
          formattedTotal: formatPHP(totalEasytripCentavos, true),
          legs: easytripLegs,
        },
      },
    };
  }

  /**
   * Calculates fuel consumption and estimated cost using Philippine fuel metrics.
   */
  calculateFuelEstimate(dto: FuelEstimateDto): FuelCalculationResult {
    const EFFICIENCY_PRESETS: Record<string, number> = {
      SEDAN_1_5L: 12.5,
      SUV_DIESEL_2_8L: 9.5,
      COMMUTER_VAN: 8.0,
      MOTORCYCLE_150CC: 38.0,
      CUSTOM: dto.fuelEfficiencyKmPerLiter || 12.0,
    };

    const FUEL_PRICE_BENCHMARKS: Record<string, number> = {
      DIESEL: 55.0,
      GASOLINE_91: 58.5,
      GASOLINE_95: 63.0,
      CUSTOM: dto.pricePerLiter || 60.0,
    };

    const efficiency =
      dto.fuelEfficiencyKmPerLiter ||
      EFFICIENCY_PRESETS[dto.vehiclePreset] ||
      12.0;

    const price =
      dto.pricePerLiter || FUEL_PRICE_BENCHMARKS[dto.fuelType] || 60.0;

    const litersNeeded = Number((dto.distanceKm / efficiency).toFixed(2));
    const totalFuelPesos = Number((litersNeeded * price).toFixed(2));
    const totalFuelCentavos = pesosToCentavos(totalFuelPesos);

    return {
      distanceKm: dto.distanceKm,
      vehiclePreset: dto.vehiclePreset,
      fuelType: dto.fuelType,
      fuelEfficiencyKmPerLiter: efficiency,
      pricePerLiter: price,
      litersNeeded,
      totalFuelPesos,
      totalFuelCentavos,
      formattedTotalFuel: formatPHP(totalFuelCentavos, true),
    };
  }

  /**
   * Attaches calculated toll segments to a Trip in the database, with optional vehicleId tagging.
   */
  async attachTollEstimatesToTrip(
    userId: string,
    tripId: string,
    dto: AttachTollEstimateDto,
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
        "You must be a member of this trip to attach toll estimates",
      );
    }

    const tollCalculation = await this.calculateRouteToll({
      segments: dto.segments,
      presetRoute: dto.presetRoute,
      classType: dto.classType,
    });

    // Clean prior toll estimates for this vehicle if replacing
    if (dto.vehicleId) {
      await prisma.tollEstimate.deleteMany({
        where: { tripId, vehicleId: dto.vehicleId },
      });
    }

    const createdEstimates = [];
    for (const leg of tollCalculation.legs) {
      const estimate = await prisma.tollEstimate.create({
        data: {
          tripId,
          vehicleId: dto.vehicleId,
          expresswayName: leg.expressway,
          rfidProvider: leg.rfidProvider,
          entryPlaza: leg.entryPlaza,
          exitPlaza: leg.exitPlaza,
          classType: leg.classType,
          amount: leg.amount,
        },
      });
      createdEstimates.push(estimate);
    }

    return {
      message: "Toll estimates attached successfully to trip",
      tripId,
      vehicleId: dto.vehicleId,
      estimates: createdEstimates,
      summary: tollCalculation,
    };
  }

  getPresetRoutes() {
    const result = [];
    for (const [key, val] of Object.entries(TollService.PRESET_ROUTES)) {
      result.push({
        id: key,
        name: val.name,
        destination: val.destination,
        distanceKm: val.distanceKm,
        segmentCount: val.segments.length,
      });
    }
    return result;
  }
}

export const tollService = new TollService();
