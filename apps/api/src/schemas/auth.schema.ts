import { z } from "zod";
import {
  isValidPhilippinePhone,
  normalizePhilippinePhone,
} from "@gala-ph/shared";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must not exceed 100 characters"),
  name: z.string().min(2, "Name must be at least 2 characters long").max(100),
  phone: z
    .string()
    .refine((val) => isValidPhilippinePhone(val), {
      message:
        "Must be a valid Philippine mobile number (e.g. 09171234567 or +639171234567)",
    })
    .transform((val) => normalizePhilippinePhone(val) as string)
    .optional(),
  gcashNumber: z
    .string()
    .refine((val) => isValidPhilippinePhone(val), {
      message: "Must be a valid Philippine mobile number for GCash",
    })
    .transform((val) => normalizePhilippinePhone(val) as string)
    .optional(),
  mayaNumber: z
    .string()
    .refine((val) => isValidPhilippinePhone(val), {
      message: "Must be a valid Philippine mobile number for Maya",
    })
    .transform((val) => normalizePhilippinePhone(val) as string)
    .optional(),
  avatarUrl: z.string().url().optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginDto = z.infer<typeof loginSchema>;
