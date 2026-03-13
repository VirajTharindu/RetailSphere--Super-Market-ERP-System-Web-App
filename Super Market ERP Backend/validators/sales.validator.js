import { z } from "zod";

/**
 * ================================
 * COMMON ID SCHEMA
 * ================================
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a positive integer")
    .transform(Number),
});

/**
 * ================================
 * SALE ITEM SCHEMA
 * ================================
 * Represents ONE line item in a sale
 */
export const saleItemSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
});

/**
 * ================================
 * CREATE SALE (POST)
 * ================================
 */
export const saleCreateSchema = z.object({
  customerId: z
    .number()
    .int()
    .positive("Customer ID must be a positive integer")
    .optional(), // walk-in customers allowed
  paymentMethod: z.enum(["CASH", "CARD"]).optional().default("CASH"),
  status: z.enum(["COMPLETED", "PENDING"]).optional().default("COMPLETED"),
  items: z.array(saleItemSchema).min(1, "At least one sale item is required"),
});

/**
 * ================================
 * UPDATE SALE (PUT)
 * ================================
 * Intentionally restrictive
 * Sales updates should be minimal
 */
export const saleUpdateSchema = z
  .object({
    customerId: z.number().int().positive().optional(),
    userId: z.number().int().positive().optional(),
    totalAmount: z.number().positive().optional(),
    paymentMethod: z.enum(["CASH", "CARD"]).optional(),
    status: z.enum(["COMPLETED", "PENDING"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export default {
  idParamSchema,
  saleItemSchema,
  saleCreateSchema,
  saleUpdateSchema,
};
