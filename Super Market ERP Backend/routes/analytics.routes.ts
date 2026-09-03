import { Router } from "express";
import auth from "../middleware/auth.js";
import rbacMiddleware from "../middleware/rbac.js";
import ROLES from "../constants/roles.js";
import validate from "../middleware/inputValidation.js";
import {
  overviewController,
  salesTrendController,
  topProductsController,
  lowStockController,
  inventoryValuationController,
  topCustomersController,
  analyticsHealth,
  expiryForecastController,
} from "../controllers/analytics.controller.js";
import {
  overviewQuery,
  salesTrendQuery,
  topProductsQuery,
  lowStockQuery,
  inventoryValuationQuery,
  topCustomersQuery,
  expiryForecastQuery,
} from "../validators/analytics.validator.js";

const router = Router();

router.get("/", analyticsHealth);

// Overview: totals and breakdown
router.get(
  "/overview",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  validate([{ schema: overviewQuery, source: "query" }]),
  overviewController,
);

// Sales trend (day / month)
router.get(
  "/sales-trend",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  validate([{ schema: salesTrendQuery, source: "query" }]),
  salesTrendController,
);

// Top products
router.get(
  "/top-products",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  validate([{ schema: topProductsQuery, source: "query" }]),
  topProductsController,
);

// Low stock
router.get(
  "/low-stock",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  validate([{ schema: lowStockQuery, source: "query" }]),
  lowStockController,
);

// Inventory valuation
router.get(
  "/inventory-valuation",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: inventoryValuationQuery, source: "query" }]),
  inventoryValuationController,
);

// Top customers
router.get(
  "/top-customers",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  validate([{ schema: topCustomersQuery, source: "query" }]),
  topCustomersController,
);

// Expiry Forecast (Next 30 Days) - protected
router.get(
  "/expiry-forecast",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  validate([{ schema: expiryForecastQuery, source: "query" }]),
  expiryForecastController,
);

export default router;
