import { z } from "zod";

export const stockBatchCreateSchema = z.object({
  POrderDetailID: z.number().int().positive(),
});

export const stockBatchUpdateSchema = z
  .object({
    ProductID: z.number().int().positive().optional(),
    SupplierID: z.number().int().positive().optional(),
    CostPrice: z.number().positive().optional(),
    //Changed z.date() to z.coerce.date()
    ExpiryDate: z.coerce
      .date({
        errorMap: () => ({
          message: "ExpiryDate must be a valid date (YYYY-MM-DD)",
        }),
      })
      .optional()
      .nullable(),
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

export const stockbatchReduceSchema = z.object({
  quantity: z.number().int().positive(),
});

export const productIdParamSchema = z.object({
  productId: z.string().regex(/^\d+$/).transform(Number),
});

export default {
  stockBatchCreateSchema,
  stockBatchUpdateSchema,
  idParamSchema,
  stockbatchReduceSchema,
  productIdParamSchema,
};
