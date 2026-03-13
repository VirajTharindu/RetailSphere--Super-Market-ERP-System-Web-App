import { Router } from "express";
const router = Router();
import {
  healthCheck,
  getAllCategoriesController,
  getCategoryByIdController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/inventory.controller.js";
import rbacMiddleware from "../middleware/rbac.js";
import authMiddleware from "../middleware/auth.js"; // Assuming standard auth exists
import ROLES from "../constants/roles.js";
import {
  createCategorySchema,
  updateCategorySchema,
  idSchema,
} from "../validators/inventory.validator.js";
import validate from "../middleware/inputValidation.js";

/**
 * ==========================================
 * CATEGORY ROUTES (UC6: Management)
 * ==========================================
 */

// Health Check - Public
router.get("/", healthCheck);

// List Categories - Staff, Manager, Admin
router.get(
  "/categories-get-list",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  getAllCategoriesController,
);

// Get Single Category - Staff, Manager, Admin
router.get(
  "/categories-get/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([[{ schema: idSchema, source: "params" }]]),
  getCategoryByIdController,
);

// Create Category - Manager & Admin Only
router.post(
  "/categories-add",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: createCategorySchema, source: "body" }]),
  createCategoryController,
);

// Update Category - Manager & Admin Only
router.put(
  "/categories-update/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([
    { schema: idSchema, source: "params" },
    { schema: updateCategorySchema, source: "body" },
  ]),
  updateCategoryController,
);

// Delete Category - Manager & Admin Only
router.delete(
  "/categories-delete/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: idSchema, source: "params" }]),
  deleteCategoryController,
);

export default router;
