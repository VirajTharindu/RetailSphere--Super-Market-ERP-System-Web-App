import { z } from "zod";

const isoDate = z
  .string()
  .optional()
  .refine((s: any) => !s || !Number.isNaN(Date.parse(s)), {
    message: "Invalid date",
  });

const limitSchema = z
  .string()
  .optional()
  .refine((s: any) => !s || /^\d+$/.test(s), { message: "limit must be an integer" })
  .transform((s: any) => (s ? parseInt(s, 10) : undefined));

const thresholdSchema = z
  .string()
  .optional()
  .refine((s: any) => !s || /^-?\d+$/.test(s), {
    message: "threshold must be an integer",
  })
  .transform((s: any) => (s ? parseInt(s, 10) : undefined));

const periodSchema = z
  .string()
  .optional()
  .refine((s: any) => !s || ["day", "month"].// @ts-ignore
// @ts-ignore
includes(s), {
    message: "period must be 'day' or 'month'",
  });

const daysSchema = z
  .string()
  .optional()
  .refine((s: any) => !s || /^\d+$/.test(s), { message: "days must be an integer" })
  .transform((s: any) => (s ? parseInt(s, 10) : undefined));

export const overviewQuery = z.object({ from: isoDate, to: isoDate });
export const salesTrendQuery = z.object({
  from: isoDate,
  to: isoDate,
  period: periodSchema,
});
export const topProductsQuery = z.object({
  from: isoDate,
  to: isoDate,
  limit: limitSchema,
});
export const lowStockQuery = z.object({
  threshold: thresholdSchema,
  limit: limitSchema,
});
export const inventoryValuationQuery = z.object({});
export const topCustomersQuery = z.object({
  from: isoDate,
  to: isoDate,
  limit: limitSchema,
});

export const expiryForecastQuery = z.object({ days: daysSchema });

export default {
  overviewQuery,
  salesTrendQuery,
  topProductsQuery,
  lowStockQuery,
  inventoryValuationQuery,
  topCustomersQuery,
  expiryForecastQuery,
};
