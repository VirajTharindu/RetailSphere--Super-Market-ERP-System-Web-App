import { z } from "zod";

/**
 * ==========================================
 * CRM CUSTOMER VALIDATION SCHEMAS
 * ==========================================
 */

// Create Customer Schema
export const createCustomerSchema = z.object({
  fName: z.string().min(1, "First name is required").max(50),
  lName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits"),
});

// Update Customer Schema
export const updateCustomerSchema = z.object({
  fName: z.string().min(1).max(50).optional(),
  lName: z.string().min(1).max(50).optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/)
    .optional(),
});

// ID schema for Params
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a positive integer")
    .transform((val) => parseInt(val, 10)),
});

export default {
  createCustomerSchema,
  updateCustomerSchema,
  idParamSchema,
};
