import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "PO ID must be a valid number"),
});

// For updating PO Detail
export const updatePODetailSchema = z.object({
  Status: z
    .enum([
      "Pending",
      "PartiallyReceived",
      "Received",
      "Cancelled",
      "Refused",
      "Added",
    ])
    .optional(),
  QuantityReceived: z.number().int().min(0).optional(),
  CostPriceofPOD: z.number().min(0).optional(),
  ExpiryDate: z.coerce.date().nullable().optional(), // ISO string date; can convert in controller if needed
});

// For query filters (optional)
export const listPODetailsQuerySchema = z.object({
  Status: z
    .enum(["Pending", "PartiallyReceived", "Received", "Cancelled", "Refused"])
    .optional(),
  ProductID: z.string().regex(/^\d+$/).optional(),
  PO_ID: z.string().regex(/^\d+$/).optional(),
});
