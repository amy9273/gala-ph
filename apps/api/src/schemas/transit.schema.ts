import { z } from "zod";

export const searchBusRoutesSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  hubId: z.string().optional(),
});

export type SearchBusRoutesDto = z.infer<typeof searchBusRoutesSchema>;

export const searchTodaTariffSchema = z.object({
  municipality: z.string().optional(),
  query: z.string().optional(),
});

export type SearchTodaTariffDto = z.infer<typeof searchTodaTariffSchema>;

export const planTransitSchema = z.object({
  origin: z.string().min(2, "Origin is required"),
  destination: z.string().min(2, "Destination is required"),
  passengers: z.coerce.number().int().min(1).default(1),
  serviceType: z.string().optional(),
});

export type PlanTransitDto = z.infer<typeof planTransitSchema>;

export const transitLegInputSchema = z.object({
  stepNumber: z.number().int().min(1),
  modeType: z.string().min(2),
  operatorName: z.string().optional(),
  origin: z.string().min(2),
  destination: z.string().min(2),
  farePerHead: z.number().positive(),
  specialTripFare: z.number().positive().optional(),
  lastTripTime: z.string().optional(),
  notes: z.string().optional(),
});

export const attachTransitLegsSchema = z.object({
  legs: z
    .array(transitLegInputSchema)
    .min(1, "At least one transit leg is required"),
});

export type AttachTransitLegsDto = z.infer<typeof attachTransitLegsSchema>;
