import { z } from "zod";
import { PackingCategorySchema } from "@gala-ph/shared";

export const CreatePackingItemSchema = z.object({
  itemName: z
    .string()
    .min(2, "Item name must be at least 2 characters")
    .max(100),
  category: PackingCategorySchema.default("GEAR"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .default(1),
  assignedToId: z.string().cuid().nullable().optional(),
});

export type CreatePackingItemDto = z.infer<typeof CreatePackingItemSchema>;

export const UpdatePackingItemSchema = z.object({
  itemName: z
    .string()
    .min(2, "Item name must be at least 2 characters")
    .max(100)
    .optional(),
  category: PackingCategorySchema.optional(),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  isPacked: z.boolean().optional(),
});

export type UpdatePackingItemDto = z.infer<typeof UpdatePackingItemSchema>;

export const PackingItemIdParamSchema = z.object({
  id: z.string().min(1, "Trip ID is required"),
  itemId: z.string().min(1, "Item ID is required"),
});

export type PackingItemIdParamDto = z.infer<typeof PackingItemIdParamSchema>;
