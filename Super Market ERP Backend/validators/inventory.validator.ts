import { z } from "zod";

/**
 * ==========================================
 * CATEGORY VALIDATION SCHEMAS
 * ==========================================
 */

// Create Schema
export const createCategorySchema = z.object({
  CategoryName: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name too long"),
  Description: z.string().optional(),
});

// Update Schema
export const updateCategorySchema = z.object({
  CategoryName: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name too long")
    .optional(),
  Description: z.string().optional(),
});

// ID schema for Params
export const idSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a positive integer")
    .transform((val) => parseInt(val, 10)),
});

export default {
  createCategorySchema,
  updateCategorySchema,
  idSchema,
};
