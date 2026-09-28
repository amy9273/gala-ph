import { z } from "zod";
import { TravelModeSchema, UserRoleSchema } from "@gala-ph/shared";

export const createTripSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    destination: z
      .string()
      .min(2, "Destination must be at least 2 characters")
      .max(100),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    travelMode: TravelModeSchema.default("HYBRID"),
    inviteCode: z
      .string()
      .min(4)
      .max(20)
      .transform((val) => val.toUpperCase())
      .optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });

export type CreateTripDto = z.infer<typeof createTripSchema>;

export const joinTripSchema = z.object({
  inviteCode: z
    .string()
    .min(4, "Invite code must be at least 4 characters")
    .max(20)
    .transform((val) => val.toUpperCase().trim()),
});

export type JoinTripDto = z.infer<typeof joinTripSchema>;

export const updateMemberSchema = z.object({
  role: UserRoleSchema.optional(),
  isDriver: z.boolean().optional(),
  vehicleId: z.string().nullable().optional(),
  isNonDrinker: z.boolean().optional(),
  dietaryNotes: z.string().nullable().optional(),
});

export type UpdateMemberDto = z.infer<typeof updateMemberSchema>;

export const tripIdParamSchema = z.object({
  id: z.string().min(1, "Trip ID is required"),
});

export const tripMemberParamSchema = z.object({
  id: z.string().min(1, "Trip ID is required"),
  userId: z.string().min(1, "User ID is required"),
});
