import { Router } from "express";
const router = Router();
import {
  healthCheck,
  loginController,
  getProfileController,
  updateSelfProfileController,
  removeProfileController,
  logoutController,
  registerUserController,
  listUsersController,
  getUserByIdController,
  deleteUserController,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.js";
import ROLES from "../constants/roles.js";
import rbacMiddleware from "../middleware/rbac.js";
import {
  loginSchema,
  registerSchema,
  idParamSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";
import validate from "../middleware/inputValidation.js";

/**
 * =========================
 * PUBLIC & SYSTEM ROUTES
 * =========================
 */
router.get("/", healthCheck);

router.post(
  "/login",
  validate([{ schema: loginSchema, source: "body" }]),
  loginController,
);

/**
 * =========================
 * PERSONAL PROFILE (SECURE)
 * =========================
 */
router.get(
  "/profile",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  getProfileController,
);
router.put(
  "/profile-update",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  validate([
    {
      schema: updateProfileSchema,
      source: "body",
    },
    { schema: idParamSchema, source: "params" },
  ]),
  updateSelfProfileController,
);
router.delete(
  "/profile-remove",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  removeProfileController,
);
router.post(
  "/logout",
  authMiddleware,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  logoutController,
);

/**
 * =====================================
 * ADMINISTRATIVE ROUTES (RBAC ENFORCED)
 * =====================================
 */
router.post(
  "/register",
  authMiddleware,
  rbacMiddleware(ROLES.Admin, ROLES.Manager),
  validate([{ schema: registerSchema, source: "body" }]),
  registerUserController,
);
router.get(
  "/users-list",
  authMiddleware,
  rbacMiddleware(ROLES.Admin, ROLES.Manager),
  listUsersController,
);
router.get(
  "/users-list/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Admin, ROLES.Manager),
  validate([{ schema: idParamSchema, source: "params" }]),
  getUserByIdController,
); // Alias for consistency
router.get(
  "/user/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Admin, ROLES.Manager),
  validate([{ schema: idParamSchema, source: "params" }]),
  getUserByIdController,
);
router.delete(
  "/user-delete/:id",
  authMiddleware,
  rbacMiddleware(ROLES.Admin, ROLES.Manager),
  validate([{ schema: idParamSchema, source: "params" }]),
  deleteUserController,
);
export default router;
