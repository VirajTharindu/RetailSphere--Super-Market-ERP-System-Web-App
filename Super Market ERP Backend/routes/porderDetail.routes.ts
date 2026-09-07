import { Router } from "express";
const router = Router();

import {
  getPODetailController,
  updatePODetailController,
  listPODetailsController,
  acceptPODetailController,
  refusePODetailController,
} from "../controllers/porderDetail.controller.js";

import authMiddleware from "../middleware/auth.js";
import rbacMiddleware from "../middleware/rbac.js";
import ROLES from "../constants/roles.js";

import {
  updatePODetailSchema,
  listPODetailsQuerySchema,
  idParamSchema,
} from "../validators/porderDetail.validator.js";
import validate from "../middleware/inputValidation.js";

/**
 * ==========================================
 * PO DETAILS ROUTES
 * ==========================================
 */

// Health Check - Public
router.get("/", (req, res) =>
  res.status(200).json({ message: "PO Detail service live 🚀" }),
);

// List PO Details - Staff, Manager, Admin
router.get(
  "/podetails-get-list",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: listPODetailsQuerySchema, source: "query" }]),
  listPODetailsController,
);

// Get Single PO Detail - Staff, Manager, Admin
router.get(
  "/podetails-get/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]), // we can use a placeholder schema for params validation if needed
  getPODetailController,
);

// Accept PO Detail - Manager & Admin Only
router.put(
  "/podetails-accept/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  acceptPODetailController,
);

// Refuse PO Detail - Manager & Admin Only
router.put(
  "/podetails-refuse/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  refusePODetailController,
);

// Update PO Detail - Manager & Admin Only
router.put(
  "/podetails-update/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([
    { schema: updatePODetailSchema, source: "body" },
    { schema: idParamSchema, source: "params" },
  ]),
  updatePODetailController,
);

export default router;

