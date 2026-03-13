import { Router } from "express";
const router = Router();
import {
  healthCheck,
  createCustomerController,
  getAllCustomersController,
  getCustomerByIdController,
  updateCustomerController,
  deleteCustomerByIdController,
} from "../controllers/crm.controller.js";
import authMiddleware from "../middleware/auth.js";
import rbacMiddleware from "../middleware/rbac.js";
import ROLES from "../constants/roles.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  idParamSchema,
} from "../validators/crm.validator.js";
import validate from "../middleware/inputValidation.js"; // High-fidelity validation utility

// High-fidelity validation utility

/**
 * ==========================================
 * CRM ROUTES
 * ==========================================
 */

router.get("/", healthCheck);

router.post(
  "/customers-add",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  validate([{ schema: createCustomerSchema, source: "body" }]),
  createCustomerController,
);

router.get(
  "/customers-get-list",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  getAllCustomersController,
);

router.get(
  "/customers-get/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  getCustomerByIdController,
);

router.put(
  "/customers-update/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  validate([
    { schema: updateCustomerSchema, source: "body" },
    { schema: idParamSchema, source: "params" },
  ]),
  updateCustomerController,
);

router.delete(
  "/customers-delete/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  deleteCustomerByIdController,
);

export default router;
