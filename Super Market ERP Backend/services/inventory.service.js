import db from "../models/index.js";
import sequelize from "../config/database.js";
import { daysToExpiry } from "../utils/date.utils.js";
import { Op } from "sequelize";

const { Product, StockBatch, PurchaseOrder, POrderDetail, Supplier } = db;

/* =========================================================
   READ OPERATIONS
========================================================= */

/**
 * Get all stock batches
 */
async function getAllBatches() {
  return StockBatch.findAll({
    include: [{ model: Product }, { model: Supplier }],
  });
}

/**
 * Get stock batch by ID
 */
async function getBatchById(batchId) {
  const batch = await StockBatch.findByPk(batchId, {
    include: [{ model: Product }, { model: Supplier }],
  });
  if (!batch) throw new Error("Stock batch not found");
  return batch;
}

/**
 * Get total stock for a product
 */

/* =========================================================
   WRITE OPERATIONS (STRICT RULES)
========================================================= */

/**
 * Create stock batch (ONLY via stock-in)
 */
async function createBatch(data) {
  const { POrderDetailID } = data;

  return sequelize.transaction(async (t) => {
    // Fetch the PO detail and associated PurchaseOrder
    const poDetail = await POrderDetail.findByPk(POrderDetailID, {
      include: [{ model: PurchaseOrder }],
      transaction: t,
    });

    if (!poDetail) throw new Error("Invalid POrderDetailID");

    const po = poDetail.PurchaseOrder;

    // Only allow if PODetail/PO is not cancelled
    if (po.Status === "Cancelled" || poDetail.Status === "Cancelled") {
      throw new Error("Cannot add stock: PO or PO Detail is cancelled");
    }

    // Must be received & partially received
    // Must be Received or PartiallyReceived, otherwise throw status-specific errors
    switch (poDetail.Status) {
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
        // allowed, continue
        break;
      default:
        throw new Error(
          `Cannot add stock: Invalid PO Detail status '${poDetail.Status}'`,
        );
    }

    // Prevent duplicate batch creation
    const existingBatch = await StockBatch.findOne({
      where: { POrderDetailID: POrderDetailID },
      transaction: t,
    });

    if (existingBatch) {
      throw new Error("Stock batch already created for this PO Detail");
    }

    // Only allow if PODetail has received quantity > 0
    if (poDetail.QuantityReceived <= 0) {
      throw new Error(
        "Cannot add stock: No quantity received for this PO Detail",
      );
    }

    // Create StockBatch with relevant details from PO/PO Detail
    const batch = await StockBatch.create(
      {
        PurchaseOrderID: po.PO_ID,
        POrderDetailID: poDetail.PO_DetailID,
        ProductID: poDetail.ProductID,
        SupplierID: po.SupplierID,
        QuantityOnHand: poDetail.QuantityReceived, // take from PO Detail
        CostPrice: poDetail.CostPriceofPOD, // take from PO Detail
        ExpiryDate: poDetail.ExpiryDate || null,
      },
      { transaction: t },
    );

    // After creating batch
    // Change PO Detail status from Received/PartiallyReceived -> Added
    if (["Received", "PartiallyReceived"].includes(poDetail.Status)) {
      poDetail.Status = "Added";
      await poDetail.save({ transaction: t });
    }

    // Also update the PO status if all its details are now "Added"
    const poDetails = await POrderDetail.findAll({
      where: { PO_ID: po.PO_ID },
      transaction: t,
    });

    const allAdded = poDetails.every((d) => d.Status === "Added");
    if (allAdded) {
      po.Status = "Added";
      await po.save({ transaction: t });
    }

    // Optional: check reorder
    await checkReorder(poDetail.ProductID, t);

    return batch;
  });
}

/**
 * Update batch metadata (NO quantity update allowed)
 */
async function updateBatch(batchId, data) {
  const batch = await StockBatch.findByPk(batchId);
  if (!batch) throw new Error("Stock batch not found");

  let message = "Update successful";

  if ("QuantityOnHand" in data) {
    delete data.QuantityOnHand;
    message =
      "Update successful, but Quantity updates are forbidden and were ignored.";
    console.warn(
      "User attempted to breach quantity integrity. Request neutralized.",
    );
  }

  // Execute the update with the remaining vetted data
  await batch.update(data);

  // Return both the updated asset and the status memo 📝
  return {
    batch,
    message,
  };
}

//Quantity updates can be done in critical situations by this function (admin / manager)

/**
 * Delete batch (only if empty)
 */
async function deleteBatch(batchId) {
  const batch = await StockBatch.findByPk(batchId);
  if (!batch) throw new Error("Stock batch not found");

  if (batch.QuantityOnHand > 0) {
    throw new Error("Cannot delete batch with remaining stock");
  }

  await batch.destroy();
  return true;
}

/**
 * Delete batch which has expired or any other reason
 */

/* =========================================================
   STOCK MOVEMENTS
========================================================= */

/**
 * Reduce stock from a batch (sales / issue)
 */
async function reduceStock({ batchId, quantity }) {
  if (quantity <= 0) throw new Error("Invalid quantity");

  return sequelize.transaction(async (t) => {
    const batch = await StockBatch.findByPk(batchId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!batch) throw new Error("Stock batch not found");
    if (batch.QuantityOnHand < quantity) {
      throw new Error("Insufficient stock");
    }

    batch.QuantityOnHand -= quantity;
    await batch.save({ transaction: t });

    await checkReorder(batch.ProductID, t);

    return batch;
  });
}

/* =========================================================
   REORDER LOGIC
========================================================= */

/**
 * Auto reorder check
 */
async function checkReorder(productId, transaction = null) {
  /**
   * Calculates a professional reorder quantity based on historical demand
   * or a smart multiplier logic to ensure optimal inventory turnover.
   **/
  async function calculateProfessionalReorderQuantity(productId, transaction) {
    // Logic: Fetch average consumption from past batches to determine a 'smart' order size
    const historicalAvg = await db.StockBatch.findAll({
      where: { ProductID: productId },
      limit: 5,
      order: [["BatchID", "DESC"]],
      transaction,
    });

    if (historicalAvg.length > 0) {
      const sum = historicalAvg.reduce(
        (acc, batch) => acc + (batch.QuantityOnHand || 0),
        0,
      );
      const avg = sum / historicalAvg.length;
      // We order 1.5x the average batch size to ensure a healthy buffer
      return Math.ceil(avg * 1.5);
    }

    // Fallback to a "Strategic Default" if no history exists
    return 500;
  }

  // 1. Aggregating the current stock levels
  const today = new Date();

  const totalStock =
    (await StockBatch.sum("QuantityOnHand", {
      where: {
        ProductID: productId,
        ExpiryDate: { [Op.gt]: today }, // ignore expired
      },
      transaction,
    })) || 0;

  // 2. Fetching the product
  const product = await Product.findByPk(productId, { transaction });
  if (!product) throw new Error("Product not found");

  // Case 1: Enough stock
  if (totalStock >= product.ReorderLevel) {
    return {
      status: "OK",
      productId,
      totalStock,
      reorderLevel: product.ReorderLevel,
      message: "Stock level is sufficient. No reorder required.",
    };
  }

  // Case 2: Check for existing Pending procurement line items.
  // Look for the product in the ORDER DETAILS, not the HEADER
  // We must match the ENUM "Pending" exactly (case-sensitive in some DBs)
  const existingDetail = await POrderDetail.findOne({
    where: { ProductID: productId, QuantityRequested: { [Op.gt]: 0 } },
    include: [{ model: PurchaseOrder, where: { Status: "Pending" } }],
    transaction,
  });

  if (existingDetail) {
    return {
      status: "Reorder_Pending",
      productId,
      totalStock,
      reorderLevel: product.ReorderLevel,
      purchaseOrderId: existingDetail.PurchaseOrder.PO_ID, // accessing via included model
      message:
        "Stock below reorder level. Pending purchase order already exists.",
    };
  }

  // Since Product table lacks SupplierID, we look at the history of the product.
  const lastBatch = await StockBatch.findOne({
    where: { ProductID: productId, SupplierID: { [Op.ne]: null } },
    order: [["BatchID", "DESC"]], // Assuming higher ID = more recent
    transaction,
  });

  const resolvedSupplierID = lastBatch ? lastBatch.SupplierID : null;

  if (!resolvedSupplierID) {
    // If we can't find a supplier, the order fails the "Quality Gate"
    return {
      status: "ERROR",
      message:
        "Procurement halted: No historical supplier found in StockBatch for this product.",
    };
  }

  // Determine Reorder Quantity
  // We use the product's field if it exists, otherwise your requested default of 10.

  const calculated = await calculateProfessionalReorderQuantity(
    productId,
    transaction,
  );

  const finalQuantity = product.ReorderLevel >= calculated ? 550 : calculated;

  // Case 3: Initializing a new Purchase Order cycle.
  // Let's create the Header first.
  const newPO = await PurchaseOrder.create(
    {
      SupplierID: resolvedSupplierID || null,
      Status: "Pending",
      OrderDate: new Date(),
    },
    { transaction },
  );

  // Now, create the Line Item (Detail)
  const newPODetail = await POrderDetail.create(
    {
      PO_ID: newPO.PO_ID, // Primary Key from the newly created PO
      ProductID: productId,
      QuantityRequested: finalQuantity || 600, // Default
    },
    { transaction },
  );

  return {
    status: "Reorder_Initiated",
    productId,
    totalStock,
    reorderLevel: product.ReorderLevel,
    purchaseOrderId: newPO.PO_ID,
    purchaseOrderDetailID: newPODetail.PO_DetailID,
    supplierId: resolvedSupplierID,
    finalQuantity: newPODetail.QuantityRequested,

    message:
      "Stock below reorder level. New Purchase Order and Line Item successfully generated. New procurement cycle initiated successfully.",
  };
}

async function getTotalStock(productId) {
  const totalStock = await StockBatch.sum("QuantityOnHand", {
    where: { ProductID: productId },
  });

  return totalStock || 0;
}

async function getSellableBatches(productId, transaction = null) {
  return StockBatch.findAll({
    where: {
      ProductID: productId,
      QuantityOnHand: { [Op.gt]: 0 },
      ExpiryDate: { [Op.gt]: new Date() }, // exclude expired
    },
    order: [
      ["ExpiryDate", "ASC"], // FEFO
      ["BatchID", "ASC"], // FIFO fallback
    ],
    transaction,
  });
}

async function getExpiringBatches(days = 7) {
  const batches = await StockBatch.findAll({
    where: {
      QuantityOnHand: { [Op.gt]: 0 },
      ExpiryDate: { [Op.gt]: new Date() },
    },
    include: [{ model: Product }],
  });

  return batches.filter((b) => daysToExpiry(b.ExpiryDate) <= days);
}

export async function issueStockByProduct({
  productId,
  quantity,
  transaction = null,
}) {
  if (!productId) throw new Error("ProductID is required");
  if (!quantity || quantity <= 0) throw new Error("Invalid quantity");

  // Use external transaction if provided
  const t = transaction || (await sequelize.transaction());
  const isExternal = !!transaction;

  try {
    //Lock rows for update (prevents race conditions)
    const batches = await StockBatch.findAll({
      where: {
        ProductID: productId,
        QuantityOnHand: { [Op.gt]: 0 },
      },
      order: [["ExpiryDate", "ASC"]], // FEFO
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!batches.length) throw new Error("No available stock batches found");

    let remaining = quantity;
    let deductions = [];

    for (const batch of batches) {
      if (remaining <= 0) break;

      const daysLeft = daysToExpiry(batch.ExpiryDate);

      if (daysLeft <= 0) continue; // expired → skip

      const deduct = Math.min(batch.QuantityOnHand, remaining);

      if (deduct > 0) {
        deductions.push({
          batchId: batch.BatchID,
          quantity: deduct,
        });

        batch.QuantityOnHand -= deduct;
        await batch.save({ transaction: t });

        remaining -= deduct;
      }
    }

    if (remaining > 0) {
      throw new Error("Insufficient stock (FEFO enforced)");
    }

    // Trigger reorder logic inside same transaction
    const reorderResult = await checkReorder(productId, t);

    if (!isExternal) await t.commit();
    return {
      deductions,
      reorderResult,
    }; //Clean structured return
  } catch (err) {
    if (!isExternal) await t.rollback();
    throw err;
  }
}

export default {
  // Reads
  getAllBatches,
  getBatchById,
  getTotalStock,
  getExpiringBatches,
  getSellableBatches,

  // Writes
  createBatch,
  updateBatch,
  deleteBatch,

  // Stock ops
  reduceStock,
  checkReorder,

  // stock movement
  issueStockByProduct,
};
