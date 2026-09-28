import { z } from "zod";
import { VehicleClassSchema } from "@gala-ph/shared";

export const tollSegmentSchema = z.object({
  expressway: z.string().min(2, "Expressway name is required"),
  entryPlaza: z.string().min(2, "Entry plaza is required"),
  exitPlaza: z.string().min(2, "Exit plaza is required"),
});

export type TollSegmentDto = z.infer<typeof tollSegmentSchema>;

export const PresetRouteEnum = z.enum([
  "MANILA_TO_LA_UNION",
  "MANILA_TO_BAGUIO",
  "MANILA_TO_BATANGAS_PORT",
  "MANILA_TO_TAGAYTAY",
  "MANILA_TO_SUBIC",
]);

export type PresetRoute = z.infer<typeof PresetRouteEnum>;

export const calculateTollSchema = z
  .object({
    segments: z.array(tollSegmentSchema).optional(),
    presetRoute: PresetRouteEnum.optional(),
    classType: VehicleClassSchema.default(1),
  })
  .refine((data) => data.segments?.length || data.presetRoute, {
    message: "Either 'segments' or 'presetRoute' must be provided",
  });

export type CalculateTollDto = z.infer<typeof calculateTollSchema>;

export const FuelTypeEnum = z.enum([
  "DIESEL",
  "GASOLINE_91",
  "GASOLINE_95",
  "CUSTOM",
]);

export type FuelType = z.infer<typeof FuelTypeEnum>;

export const VehiclePresetEnum = z.enum([
  "SEDAN_1_5L",
  "SUV_DIESEL_2_8L",
  "COMMUTER_VAN",
  "MOTORCYCLE_150CC",
  "CUSTOM",
]);

export type VehiclePreset = z.infer<typeof VehiclePresetEnum>;

export const fuelEstimateSchema = z.object({
  distanceKm: z.number().positive("Distance in km must be positive"),
  vehiclePreset: VehiclePresetEnum.default("SEDAN_1_5L"),
  fuelEfficiencyKmPerLiter: z
    .number()
    .positive("Fuel efficiency must be positive")
    .optional(),
  fuelType: FuelTypeEnum.default("GASOLINE_95"),
  pricePerLiter: z
    .number()
    .positive("Price per liter must be positive")
    .optional(),
});

export type FuelEstimateDto = z.infer<typeof fuelEstimateSchema>;

export const attachTollEstimateSchema = z
  .object({
    vehicleId: z.string().optional(),
    segments: z.array(tollSegmentSchema).optional(),
    presetRoute: PresetRouteEnum.optional(),
    classType: VehicleClassSchema.default(1),
  })
  .refine((data) => data.segments?.length || data.presetRoute, {
    message: "Either 'segments' or 'presetRoute' must be provided",
  });

export type AttachTollEstimateDto = z.infer<typeof attachTollEstimateSchema>;
