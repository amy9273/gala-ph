import { z } from "zod";
import { ExpenseCategorySchema } from "@gala-ph/shared";

export const ExpenseItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100),
  price: z.number().min(0, "Item price must be non-negative"),
  quantity: z.number().int().min(1).default(1),
  consumerUserIds: z.array(z.string()).optional(),
  isAlcohol: z.boolean().default(false),
});
export type ExpenseItemInput = z.infer<typeof ExpenseItemInputSchema>;

export const CreateExpenseSchema = z
  .object({
    title: z.string().min(1, "Expense title is required").max(100),
    category: ExpenseCategorySchema,
    paidById: z.string().optional(),
    totalAmount: z.number().min(0).optional(),
    serviceAndTaxFee: z.number().min(0).default(0),
    receiptUrl: z.string().url().optional(),
    vehicleIdOnly: z.string().optional(),
    excludeDriver: z.boolean().default(false),
    splitMode: z
      .enum(["ITEMIZED", "EQUAL_ALL", "EQUAL_DRINKERS_ONLY"])
      .default("ITEMIZED"),
    items: z.array(ExpenseItemInputSchema).optional(),
  })
  .refine(
    (data) => {
      // Must provide either line items with price, or totalAmount for equal split
      return (
        (data.items && data.items.length > 0) ||
        (data.totalAmount !== undefined && data.totalAmount > 0)
      );
    },
    {
      message:
        "Expense must include either itemized line items or an overall total amount.",
      path: ["items"],
    },
  );
export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;

export const SettleDebtSchema = z.object({
  fromUserId: z.string().min(1, "fromUserId is required"),
  toUserId: z.string().min(1, "toUserId is required"),
  amount: z.number().positive("Settlement amount must be positive"),
  paymentMethod: z
    .enum(["GCASH", "MAYA", "CASH", "BANK_TRANSFER"])
    .default("GCASH"),
  notes: z.string().max(255).optional(),
});
export type SettleDebtDto = z.infer<typeof SettleDebtSchema>;

export const ExpenseIdParamSchema = z.object({
  id: z.string().min(1, "Trip ID is required"),
  expenseId: z.string().min(1, "Expense ID is required"),
});
export type ExpenseIdParamDto = z.infer<typeof ExpenseIdParamSchema>;
