import { Router } from "express";
import {
  healthCheck,
  createProductController,
  getAllProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";
import auth from "../middleware/auth.js";
import rbacMiddleware from "../middleware/rbac.js";
import ROLES from "../constants/roles.js";
import {
  productCreateSchema,
  productUpdateSchema,
  idParamSchema,
} from "../validators/product.validator.js";
import validate from "../middleware/inputValidation.js";

const router = Router();

router.get("/", healthCheck);

router.post(
  "/product-add",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: productCreateSchema, source: "body" }]),
  createProductController,
);
router.get(
  "/product-list",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  getAllProductsController,
);
router.get(
  "/product-get/:id",
  auth,
  rbacMiddleware(ROLES.Staff, ROLES.Manager, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  getProductByIdController,
);
router.put(
  "/product-update/:id",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([
    { schema: idParamSchema, source: "params" },
    { schema: productUpdateSchema, source: "body" },
  ]),
  updateProductController,
);
router.delete(
  "/product-delete/:id",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  deleteProductController,
);

export default router;
