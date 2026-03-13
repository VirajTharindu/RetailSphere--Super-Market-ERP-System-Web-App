import { Router } from "express";
const router = Router();
import {
  healthCheck,
  createSaleController,
  getAllSalesController,
  getSaleByIdController,
  updateSaleController,
  deleteSaleController,
} from "../controllers/sales.controller.js";
import auth from "../middleware/auth.js";
import rbacMiddleware from "../middleware/rbac.js";
import ROLES from "../constants/roles.js";
import {
  saleCreateSchema,
  saleUpdateSchema,
  idParamSchema,
  saleItemSchema,
} from "../validators/sales.validator.js";
import validate from "../middleware/inputValidation.js";

/**
 * ==========================================
 * SALES ROUTES
 * ==========================================
 */

router.get("/", healthCheck);

// Transaction Creation - Staff, Manager, Admin
router.post(
  "/sales-transactions",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  validate([{ schema: saleCreateSchema, source: "body" }]),
  createSaleController,
);

// List All Transactions
router.get(
  "/sales-transactions-get-list",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  getAllSalesController,
);

// Get Specific Transaction
router.get(
  "/sales-transactions-get/:id",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  getSaleByIdController,
);

// Update Transaction (Metadata only)
router.put(
  "/sales-transactions-update/:id",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  validate([
    { schema: saleUpdateSchema, source: "body" },
    { schema: idParamSchema, source: "params" },
  ]),
  updateSaleController,
);

// Delete Transaction
router.delete(
  "/sales-transactions-delete/:id",
  auth,
  rbacMiddleware(ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  deleteSaleController,
);

export default router;
