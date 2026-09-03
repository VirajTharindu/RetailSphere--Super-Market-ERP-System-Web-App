import { z } from "zod";

/**
 * Validation schema for StockBatch operations
 */
export const stockBatchSchema = z.object({
  PurchaseOrderID: z.number().int().positive().optional(),
  POrderDetailID: z.number().int().positive().optional(),
  ProductID: z.number().int().positive().optional(),
  SupplierID: z.number().int().positive().optional(),
  QuantityOnHand: z.number().min(0).optional(),
  CostPrice: z.number().min(0).optional(),
  ExpiryDate: z.coerce
    .date()
    .optional()
    .refine((date: any) => !date || date > new Date(), {
      message: "Expiry date must be in the future",
    }),
});

export const stockBatchCreateSchema = stockBatchSchema;
export const stockBatchUpdateSchema = stockBatchSchema.partial();
export const stockbatchReduceSchema = z.object({
  quantity: z.number().positive(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const productIdParamSchema = z.object({
  productId: z.string().regex(/^\d+$/).transform(Number),
});

export const updateBatchSchema = stockBatchSchema.partial();
