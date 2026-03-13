import { z } from "zod";

/**
 * ==========================================
 * SUPPLIER (PROCUREMENT) VALIDATION SCHEMAS
 * ==========================================
 */

// Create Supplier Schema
export const createSupplierSchema = z.object({
  SupplierName: z
    .string()
    .min(1, "Supplier name is required")
    .max(100, "Supplier name too long"),
  ContactPerson: z.string().min(1, "Contact person is required"),
  Email: z.string().regex(/^\S+@\S+\.\S+$/, "Invalid email address"),
  Phone: z.string().min(10, "Phone number too short"),
  Address: z.string().optional(),
});

// Update Supplier Schema
export const updateSupplierSchema = z.object({
  SupplierName: z.string().max(100).optional(),
  ContactPerson: z.string().optional(),
  Email: z
    .string()
    .regex(/^\S+@\S+\.\S+$/, "Invalid email address")
    .optional(),
  Phone: z.string().optional(),
  Address: z.string().optional(),
});

// ID schema for Params
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a positive integer")
    .transform((val) => parseInt(val, 10)),
});

export default {
  createSupplierSchema,
  updateSupplierSchema,
  idParamSchema,
};
