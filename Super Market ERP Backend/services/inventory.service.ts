import db from "../models/index.js";
import sequelize from "../config/database.js";
import { daysToExpiry } from "../utils/date.utils.js";
import { Op } from "sequelize";

const { Product, StockBatch, PurchaseOrder, POrderDetail, Supplier } = db as any;

/* =========================================================
   READ OPERATIONS
========================================================= */

/**
 * Get all stock batches
 */
async function getAllBatches() {
  return (StockBatch as any).findAll({
    include: [{ model: Product }, { model: Supplier }],
  });
}

/**
 * Get stock batch by ID
 */
async function getBatchById(batchId: any) {
  const batch = await (StockBatch as any).findByPk(batchId, {
    include: [{ model: Product }, { model: Supplier }],
  });
  if (!batch) throw new Error("Stock batch not found");
  return batch;
}

/**
 * Get total stock for a product
 */
async function getTotalStock(productId: any) {
  const totalStock = await (StockBatch as any).sum("QuantityOnHand", {
    where: { ProductID: productId },
  });
  return totalStock || 0;
}

/* =========================================================
   WRITE OPERATIONS (STRICT RULES)
========================================================= */

/**
 * Create stock batch (ONLY via stock-in)
 */
async function createBatch(data: any) {
  const { POrderDetailID } = data;

  return sequelize.transaction(async (t) => {
    const poDetail = await (POrderDetail as any).findByPk(POrderDetailID, {
      include: [{ model: PurchaseOrder }],
      transaction: t,
    });

    if (!poDetail) throw new Error("Invalid POrderDetailID");

    const po = (poDetail as any).PurchaseOrder;

    if ((poDetail as any).Status === "Cancelled" || (po as any).Status === "Cancelled") {
      throw new Error("Cannot add stock: PO or PO Detail is cancelled");
    }

    switch ((poDetail as any).Status) {
      case "Added":
        throw new Error("Stock already added for this PO Detail");
      case "Pending":
        throw new Error("Cannot add stock: PO Detail is pending");
      case "Cancelled":
        throw new Error("Cannot add stock: PO Detail is cancelled");
      case "Refused":
        throw new Error("Cannot add stock: PO Detail is refused");
      case "Received":
      case "PartiallyReceived":
        break;
      default:
        throw new Error(`Cannot add stock: Invalid PO Detail status '${(poDetail as any).Status}'`);
    }

    const existingBatch = await (StockBatch as any).findOne({
      where: { POrderDetailID: POrderDetailID },
      transaction: t,
    });

    if (existingBatch) {
      throw new Error("Stock batch already created for this PO Detail");
    }

    if ((poDetail as any).QuantityReceived <= 0) {
      throw new Error("Cannot add stock: No quantity received for this PO Detail");
    }

    const batch = await (StockBatch as any).create(
      {
        PurchaseOrderID: (po as any).PO_ID,
        POrderDetailID: (poDetail as any).PO_DetailID,
        ProductID: (poDetail as any).ProductID,
        SupplierID: (po as any).SupplierID,
        QuantityOnHand: (poDetail as any).QuantityReceived,
        CostPrice: (poDetail as any).CostPriceofPOD,
        ExpiryDate: (poDetail as any).ExpiryDate || null,
      },
      { transaction: t },
    );

    if (["Received", "PartiallyReceived"].includes((poDetail as any).Status)) {
      (poDetail as any).Status = "Added";
      await (poDetail as any).save({ transaction: t });
    }

    const poDetails = await (POrderDetail as any).findAll({
      where: { PO_ID: (po as any).PO_ID },
      transaction: t,
    });

    const allAdded = poDetails.every((d: any) => d.Status === "Added");
    if (allAdded) {
      (po as any).Status = "Added";
      await (po as any).save({ transaction: t });
    }

    await checkReorder((poDetail as any).ProductID, t);

    return batch;
  });
}

/**
 * Update batch metadata
 */
async function updateBatch(batchId: any, data: any) {
  const batch = await (StockBatch as any).findByPk(batchId);
  if (!batch) throw new Error("Stock batch not found");

  let message = "Update successful";
  if ("QuantityOnHand" in data) {
    delete data.QuantityOnHand;
    message = "Update successful, but Quantity updates are forbidden and were ignored.";
  }

  await (batch as any).update(data);
  return { batch, message };
}

/**
 * Delete batch (only if empty)
 */
async function deleteBatch(batchId: any) {
  const batch = await (StockBatch as any).findByPk(batchId);
  if (!batch) throw new Error("Stock batch not found");

  if ((batch as any).QuantityOnHand > 0) {
    throw new Error("Cannot delete batch with remaining stock");
  }

  await (batch as any).destroy();
  return true;
}

/* =========================================================
   STOCK MOVEMENTS
========================================================= */

/**
 * Reduce stock from a batch
 */
async function reduceStock({ batchId, quantity }: any) {
  if (quantity <= 0) throw new Error("Invalid quantity");

  return sequelize.transaction(async (t) => {
    const batch = await (StockBatch as any).findByPk(batchId, {
      transaction: t,
      lock: (t as any).LOCK.UPDATE,
    });

    if (!batch) throw new Error("Stock batch not found");
    if ((batch as any).QuantityOnHand < quantity) {
      throw new Error("Insufficient stock");
    }

    (batch as any).QuantityOnHand -= quantity;
    await (batch as any).save({ transaction: t });

    await checkReorder((batch as any).ProductID, t);

    return batch;
  });
}

/* =========================================================
   REORDER LOGIC
========================================================= */

async function calculateProfessionalReorderQuantity(productId: any, transaction: any) {
  const historicalAvg = await (StockBatch as any).findAll({
    where: { ProductID: productId },
    limit: 5,
    order: [["BatchID", "DESC"]],
    transaction,
  });

  if (historicalAvg.length > 0) {
    const sum = historicalAvg.reduce((acc: any, batch: any) => acc + (batch.QuantityOnHand || 0), 0);
    const avg = sum / historicalAvg.length;
    return Math.ceil(avg * 1.5);
  }
  return 500;
}

async function checkReorder(productId: any, transaction: any = null) {
  const today = new Date();
  const totalStock = await (StockBatch as any).sum("QuantityOnHand", {
    where: {
      ProductID: productId,
      ExpiryDate: { [Op.gt]: today },
    },
    transaction,
  }) || 0;

  const product = await (Product as any).findByPk(productId, { transaction });
  if (!product) throw new Error("Product not found");

  if (totalStock >= product.ReorderLevel) {
    return {
      status: "OK",
      productId,
      totalStock,
      reorderLevel: product.ReorderLevel,
      message: "Stock level is sufficient. No reorder required.",
    };
  }

  const existingDetail = await (POrderDetail as any).findOne({
    where: { ProductID: productId, QuantityRequested: { [Op.gt]: 0 } },
    include: [{ model: PurchaseOrder, where: { Status: "Pending" } }],
    transaction,
  });

  if (existingDetail) {
    return {
      status: "Reorder_Pending",
      productId,
      totalStock,
      reorderLevel: (product as any).ReorderLevel,
      purchaseOrderId: (existingDetail as any).PurchaseOrder.PO_ID,
      message: "Stock below reorder level. Pending purchase order already exists.",
    };
  }

  const lastBatch = await (StockBatch as any).findOne({
    where: { ProductID: productId, SupplierID: { [Op.ne]: null } },
    order: [["BatchID", "DESC"]],
    transaction,
  });

  const resolvedSupplierID = lastBatch ? (lastBatch as any).SupplierID : null;

  if (!resolvedSupplierID) {
    return {
      status: "ERROR",
      message: "Procurement halted: No historical supplier found.",
    };
  }

  const calculated = await calculateProfessionalReorderQuantity(productId, transaction);
  const finalQuantity = (product as any).ReorderLevel >= calculated ? 550 : calculated;

  const newPO = await (PurchaseOrder as any).create({
    SupplierID: resolvedSupplierID,
    Status: "Pending",
    OrderDate: new Date(),
  }, { transaction });

  const newPODetail = await (POrderDetail as any).create({
    PO_ID: (newPO as any).PO_ID,
    ProductID: productId,
    QuantityRequested: finalQuantity || 600,
  }, { transaction });

  return {
    status: "Reorder_Initiated",
    productId,
    totalStock,
    reorderLevel: (product as any).ReorderLevel,
    purchaseOrderId: (newPO as any).PO_ID,
    purchaseOrderDetailID: (newPODetail as any).PO_DetailID,
    supplierId: resolvedSupplierID,
    finalQuantity: (newPODetail as any).QuantityRequested,
    message: "Stock below reorder level. New Purchase Order and Line Item successfully generated.",
  };
}

async function getSellableBatches(productId: any, transaction: any = null) {
  return (StockBatch as any).findAll({
    where: {
      ProductID: productId,
      QuantityOnHand: { [Op.gt]: 0 },
      ExpiryDate: { [Op.gt]: new Date() },
    },
    order: [
      ["ExpiryDate", "ASC"],
      ["BatchID", "ASC"],
    ],
    transaction,
  });
}

async function getExpiringBatches(days: number = 7) {
  const batches = await (StockBatch as any).findAll({
    where: {
      QuantityOnHand: { [Op.gt]: 0 },
      ExpiryDate: { [Op.gt]: new Date() },
    },
    include: [{ model: Product }],
  });

  return batches.filter((b: any) => daysToExpiry(b.ExpiryDate) <= days);
}

export async function issueStockByProduct({
  productId,
  quantity,
  transaction = null,
}: any) {
  if (!productId) throw new Error("ProductID is required");
  if (!quantity || quantity <= 0) throw new Error("Invalid quantity");

  const t = transaction || (await sequelize.transaction());
  const isExternal = !!transaction;

  try {
    const batches = await (StockBatch as any).findAll({
      where: {
        ProductID: productId,
        QuantityOnHand: { [Op.gt]: 0 },
      },
      order: [["ExpiryDate", "ASC"]],
      transaction: t,
      lock: (t as any).LOCK.UPDATE,
    });

    if (!batches.length) throw new Error("No available stock batches found");

    let remaining = quantity;
    let deductions = [];

    for (const batch of batches) {
      if (remaining <= 0) break;
      const daysLeft = daysToExpiry((batch as any).ExpiryDate);
      if (daysLeft <= 0) continue;

      const deduct = Math.min((batch as any).QuantityOnHand, remaining);
      if (deduct > 0) {
        deductions.push({
          batchId: (batch as any).BatchID,
          quantity: deduct,
        });

        (batch as any).QuantityOnHand -= deduct;
        await (batch as any).save({ transaction: t });
        remaining -= deduct;
      }
    }

    if (remaining > 0) throw new Error("Insufficient stock (FEFO enforced)");

    const reorderResult = await checkReorder(productId, t);

    if (!isExternal) await t.commit();
    return { deductions, reorderResult };
  } catch (err: any) {
    if (!isExternal) await t.rollback();
    throw err;
  }
}

export default {
  getAllBatches,
  getBatchById,
  getTotalStock,
  getExpiringBatches,
  getSellableBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  reduceStock,
  checkReorder,
  issueStockByProduct,
};
