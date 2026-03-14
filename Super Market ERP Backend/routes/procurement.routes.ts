import { Router } from "express";
const router = Router();
import {
  healthCheck,
  getAllSuppliersController,
  getSupplierByIdController,
  createSupplierController,
  updateSupplierController,
  deleteSupplierController,
} from "../controllers/procurement.controller.js";
import rbacMiddleware from "../middleware/rbac.js";
import authMiddleware from "../middleware/auth.js"; // Assuming standard auth exists
import ROLES from "../constants/roles.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
  idParamSchema,
} from "../validators/procurement.validator.js";
import validate from "../middleware/inputValidation.js";

/**
 * ==========================================
 * SUPPLIER ROUTES (Procurement)
 * ==========================================
 */

router.get("/", healthCheck);

router.get(
  "/suppliers-list",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  getAllSuppliersController,
);

router.get(
  "/supplier-get/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  getSupplierByIdController,
);

router.post(
  "/supplier-add",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: createSupplierSchema, source: "body" }]),
  createSupplierController,
);

router.put(
  "/supplier-update/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([
    { schema: updateSupplierSchema, source: "body" },
    { schema: idParamSchema, source: "params" },
  ]),
  updateSupplierController,
);

router.delete(
  "/supplier-delete/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  deleteSupplierController,
);

export default router;
