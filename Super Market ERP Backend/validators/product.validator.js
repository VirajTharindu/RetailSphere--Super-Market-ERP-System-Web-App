import { z } from "zod";

export const productCreateSchema = z.object({
  ProductName: z.string().min(1, "Product name is required"),
  CategoryID: z.number().int().positive("CategoryID must be valid"),
  ReorderLevel: z.number().int().nonnegative().optional(),
  UnitPrice: z.number().positive("UnitPrice must be greater than 0"),
});

export const productUpdateSchema = z
  .object({
    ProductName: z.string().min(1).optional(),
    CategoryID: z.number().int().positive().optional(),
    ReorderLevel: z.number().int().nonnegative().optional(),
    UnitPrice: z.number().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a positive integer")
    .transform(Number),
});

export default {
  productCreateSchema,
  productUpdateSchema,
  idParamSchema,
};
