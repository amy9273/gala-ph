import { z } from "zod";

// ==========================================
// 1. Roles, Modes & Domain Enums
// ==========================================

export const UserRoleSchema = z.enum([
  "TRIP_LEAD",
  "MEMBER",
  "DRIVER",
  "COMMUTER",
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const TravelModeSchema = z.enum([
  "PRIVATE_CAR",
  "MOTORCYCLE",
  "COMMUTE_BUS",
  "COMMUTE_VAN",
  "HYBRID",
]);
export type TravelMode = z.infer<typeof TravelModeSchema>;

export const ExpenseCategorySchema = z.enum([
  "FOOD_AND_DINING",
  "ALCOHOL_AND_BAR",
  "TOLL_HIGHWAY",
  "FUEL_AND_GAS",
  "COMMUTE_TICKET",
  "LODGING_RESORT",
  "LOCAL_TOUR_GUIDE",
  "ENVIRONMENTAL_FEE",
  "SHARED_GROCERY",
  "MISCELLANEOUS",
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export const RfidProviderSchema = z.enum(["AUTOSWEEP", "EASYTRIP"]);
export type RfidProvider = z.infer<typeof RfidProviderSchema>;

export const VehicleClassSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export type VehicleClass = z.infer<typeof VehicleClassSchema>;

export const PackingCategorySchema = z.enum([
  "GEAR",
  "FOOD_DRINKS",
  "MEDICAL",
  "COMFORT",
  "OTHER",
]);
export type PackingCategory = z.infer<typeof PackingCategorySchema>;

export const WeatherAlertSeveritySchema = z.enum([
  "LOW",
  "MODERATE",
  "CRITICAL",
]);
export type WeatherAlertSeverity = z.infer<typeof WeatherAlertSeveritySchema>;

// ==========================================
// 2. Exact Centavo Currency & Calculation Helpers
// ==========================================

/**
 * Converts a PHP peso amount to exact integer centavos (e.g. 150.75 -> 15075).
 */
export function pesosToCentavos(pesos: number | string): number {
  const num = typeof pesos === "string" ? parseFloat(pesos) : pesos;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer centavos to PHP peso decimal (e.g. 15075 -> 150.75).
 */
export function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

/**
 * Formats a PHP centavo or peso value into standard Philippine currency display (e.g. "₱1,250.00").
 */
export function formatPHP(amount: number, isCentavos = true): string {
  const value = isCentavos ? centavosToPesos(amount) : amount;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Distributes odd remainder centavos fairly so sum(splits) === total exactly.
 */
export function splitAmountEqually(
  totalCentavos: number,
  count: number,
): number[] {
  if (count <= 0) return [];
  const baseSplit = Math.floor(totalCentavos / count);
  const remainder = totalCentavos % count;

  return Array.from({ length: count }, (_, index) =>
    index < remainder ? baseSplit + 1 : baseSplit,
  );
}

// ==========================================
// 3. Philippine Phone Number Formatting & Validation
// ==========================================

const PH_PHONE_REGEX = /^(?:\+63|0)?(9\d{9})$/;

/**
 * Normalizes a Philippine mobile number into standard E.164 format (+639XXXXXXXXX).
 */
export function normalizePhilippinePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const match = cleaned.match(PH_PHONE_REGEX);
  if (!match) return null;
  return `+63${match[1]}`;
}

/**
 * Validates if string is a valid Philippine mobile number (Globe, Smart, DITO).
 */
export function isValidPhilippinePhone(phone: string): boolean {
  return normalizePhilippinePhone(phone) !== null;
}

// ==========================================
// 4. Base Health & Common API Schemas
// ==========================================

export const HealthStatusSchema = z.object({
  status: z.enum(["alive", "ready", "unhealthy"]),
  timestamp: z.string(),
  uptime: z.number().optional(),
  checks: z
    .object({
      database: z.enum(["healthy", "unhealthy", "disabled"]),
      redis: z.enum(["healthy", "unhealthy", "disabled"]),
    })
    .optional(),
  environment: z.string().optional(),
  version: z.string().optional(),
});
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
