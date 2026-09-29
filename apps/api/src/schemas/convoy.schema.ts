import { z } from "zod";
import { ConvoySosReasonSchema } from "@gala-ph/shared";

export const ConvoyPingSchema = z.object({
  vehicleId: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKmh: z.number().min(0).max(300).optional(),
  heading: z.number().min(0).max(360).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

export type ConvoyPingDto = z.infer<typeof ConvoyPingSchema>;

export const ConvoySosSchema = z.object({
  reason: ConvoySosReasonSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  details: z.string().max(500).optional(),
});

export type ConvoySosDto = z.infer<typeof ConvoySosSchema>;

export const ConvoySosResolveSchema = z.object({
  alertId: z.string().min(1, "Alert ID is required"),
});

export type ConvoySosResolveDto = z.infer<typeof ConvoySosResolveSchema>;
