import { Router } from "express";
import {
  healthCheck,
  createStockBatchController,
  getAllStockBatchesController,
  getStockBatchByIdController,
  updateStockBatchController,
  deleteStockBatchController,
  getTotalStockController,
  getSellableBatchesController,
  getExpiringBatchesController,
  reduceStockController,
  checkReorderController,
  issueStockByProductController,
} from "../controllers/stockbatch.controller.js";
import auth from "../middleware/auth.js";
import rbacMiddleware from "../middleware/rbac.js";
import ROLES from "../constants/roles.js";
import {
  stockBatchCreateSchema,
  stockBatchUpdateSchema,
  idParamSchema,
  stockbatchReduceSchema,
  productIdParamSchema,
} from "../validators/stockbatch.validator.js";
import validate from "../middleware/inputValidation.js";

const router = Router();

/**
 * ==========================================
 * STOCK BATCH ROUTES
 * ==========================================
 */
router.get("/", healthCheck);

router.post(
  "/stockbatch-add",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: stockBatchCreateSchema, source: "body" }]),
  createStockBatchController,
);

router.get(
  "/stockbatch-list",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  getAllStockBatchesController,
);
router.get(
  "/stockbatch-get/:id",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: idParamSchema, source: "params" }]),
  getStockBatchByIdController,
);

router.get(
  "/stockbatch-sellable/:productId",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: productIdParamSchema, source: "params" }]),
  getSellableBatchesController,
);

router.get(
  "/stockbatch-expiring",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  getExpiringBatchesController,
);

router.put(
  "/stockbatch-update/:id",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([
    { schema: idParamSchema, source: "params" },
    { schema: stockBatchUpdateSchema, source: "body" },
  ]),

  updateStockBatchController,
);
router.delete(
  "/stockbatch-delete/:id",
  auth,
  rbacMiddleware(ROLES.Admin, ROLES.Manager),
  validate([{ schema: idParamSchema, source: "params" }]),
  deleteStockBatchController,
);

router.get(
  "/stockbatch-total/:productId",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: productIdParamSchema, source: "params" }]),
  getTotalStockController,
);

router.put(
  "/stockbatch-reduce/:id",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([
    { schema: idParamSchema, source: "params" },
    { schema: stockbatchReduceSchema, source: "body" },
  ]),
  reduceStockController,
);

router.get(
  "/stockbatch-check-reorder/:productId",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: productIdParamSchema, source: "params" }]),
  checkReorderController,
);

//Special case
router.put(
  "/stockbatches-issue/:productId",
  auth,
  rbacMiddleware(ROLES.Manager, ROLES.Admin),
  validate([{ schema: productIdParamSchema, source: "params" }]),
  issueStockByProductController,
);

export default router;
