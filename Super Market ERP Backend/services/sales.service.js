import sequelize from "../config/database.js";
import db from "../models/index.js";

import { issueStockByProduct } from "./inventory.service.js";
import generateInvoiceNo from "../utils/generateInvoiceNo.js";

/**
 * ARCHITECTURAL REFACTOR:
 * We access the models via the 'db' object inside the function
 * to ensure they are fully loaded by the time the API hits.
 * This avoids the 'Undefined' ghost caused by circular imports. 🛰️
 */

// Helper function to get available stock
async function getTotalAvailableStock(productId, options = {}) {
  const { StockBatch } = db;
  const batches = await StockBatch.findAll({
    where: { ProductID: productId },
    attributes: [
      [sequelize.fn("SUM", sequelize.col("QuantityOnHand")), "total"],
    ],
    raw: true,
    transaction: options.transaction,
  });

  return batches[0]?.total || 0;
}

export async function processSale(
  { customerId, items, paymentMethod = "CASH", status = "COMPLETED" },
  loggedUser,
) {
  if (!loggedUser?.UserID) throw new Error("User not authenticated");

  /**
   * THE REGISTRY RESOLUTION:
   * We pull models from 'db' here to ensure the index.js loop is complete.
   * If this still fails, check that your index.js 'export default' hasn't been cached.
   */
  const { Sale, SaleDetail, StockBatch, Product, Customer } = db;

  // Ensure 'Sale' is defined before proceeding
  if (!Sale || !SaleDetail) {
    throw new Error(
      "Internal Configuration Error: Sale model is not defined in the DB index.",
    );
  }

  const t = await sequelize.transaction();

  try {
    if (!items || items.length === 0)
      throw new Error("Sale must contain at least one item");

    // Determine correct PK field from loggedUser
    const loggedUserId = loggedUser.UserID;

    // Generate invoice number safely within the transaction
    const invoiceNo = await generateInvoiceNo(t);

    // Validate paymentMethod & status
    const allowedPayments = ["CASH", "CARD"];
    const allowedStatus = ["COMPLETED", "PENDING"];

    if (!allowedPayments.includes(paymentMethod))
      throw new Error("Invalid payment method");

    if (!allowedStatus.includes(status)) throw new Error("Invalid status");

    // Validate customer exists
    const customer = await db.Customer.findByPk(customerId, {
      transaction: t,
    });
    if (!customer)
      throw new Error("Customer not found in registered customers");

    let customerIDForSales = customer.CustomerID;

    // Create Sale Header
    const sale = await Sale.create(
      {
        InvoiceNumber: invoiceNo,
        CustomerID: customerIDForSales || null,
        UserID: loggedUserId, // ← enforced from current user,
        TotalAmount: 0,
        TotalCost: 0,
        TotalProfit: 0,
        PaymentMethod: paymentMethod,
        Status: status,
      },
      { transaction: t },
    );

    // Totals
    let total = 0;
    let totalCost = 0;
    let totalProfit = 0;

    //Collect reorder responses
    const reorderResults = [];

    // Process each product
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        throw new Error("Invalid sale item structure");
      }

      // Fetch product once per item
      const product = await Product.findByPk(item.productId, {
        transaction: t,
      });
      if (!product) throw new Error("Product not found");

      // Check total available stock BEFORE deduction
      const totalAvailable = await getTotalAvailableStock(item.productId, {
        transaction: t, // very important
      });

      if (totalAvailable < item.quantity) {
        throw new Error("Insufficient stock");
      }

      const unitPriceForProduct = product.UnitPrice;

      //Deduct stock (FEFO enforced, inside SAME transaction)
      const { deductions, reorderResult } = await issueStockByProduct({
        productId: item.productId,
        quantity: item.quantity,
        transaction: t,
      });

      if (reorderResult) {
        reorderResults.push({
          productId: item.productId,
          ...reorderResult,
        });
      }

      //Create SaleDetail per affected batch
      for (const d of deductions) {
        // Fetch batch cost inside same transaction
        const stockBatch = await StockBatch.findByPk(d.batchId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!stockBatch) throw new Error("Stock batch not found");

        const costPriceStock = stockBatch.CostPrice;

        const unitPrice = unitPriceForProduct;
        const costPrice = costPriceStock;

        const subTotal = d.quantity * unitPrice;
        const costTotal = d.quantity * costPrice;

        const profit = subTotal - costTotal;

        await SaleDetail.create(
          {
            SaleID: sale.SaleID,
            BatchID: d.batchId,
            ProductID: item.productId,
            Quantity: d.quantity,
            UnitPriceSold: unitPrice,
            CostPrice: costPrice,
            SubTotal: subTotal,
            SubTotalCost: costTotal,
            Profit: profit,
          },
          { transaction: t },
        );

        total += subTotal;
        totalCost += costTotal;
        totalProfit += profit;
      }
    }

    // Update Final Total
    sale.TotalAmount = total;
    sale.TotalCost = totalCost;
    sale.TotalProfit = totalProfit;

    await sale.save({ transaction: t });

    // Commit transaction
    await t.commit();

    return {
      sale,
      reorderResults,
    };
  } catch (err) {
    // Rollback transaction on any error
    await t.rollback();
    throw err; // Re-throw to handle in controller
  }
}

// Get All Sales
export async function getAllSales({
  page = 1,
  limit = 20,
  status = null,
  includeDetails = false,
  transaction = null,
} = {}) {
  const { Sale, SaleDetail, StockBatch } = db;

  const offset = (page - 1) * limit;

  const whereClause = {};
  if (status) whereClause.Status = status;

  const options = {
    where: whereClause,
    order: [["SaleDate", "DESC"]],
    limit,
    offset,
    transaction,
  };

  if (includeDetails) {
    options.include = [
      {
        model: SaleDetail,
        include: [StockBatch],
      },
    ];
  }

  const { rows, count } = await Sale.findAndCountAll(options);

  return {
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: rows,
  };
}

// Get Sale By ID (with details)
export async function getSaleById(id, transaction = null) {
  const { Sale, SaleDetail, StockBatch } = db;

  return await Sale.findByPk(id, {
    include: [
      {
        model: SaleDetail,
        include: [StockBatch],
      },
    ],
    transaction,
  });
}

// Update Sale Header ONLY
export async function updateSale(id, updateData, transaction = null) {
  const { Sale } = db;

  const t = transaction || (await sequelize.transaction());
  const isExternal = !!transaction;

  const sale = await Sale.findByPk(id, { transaction: t });
  if (!sale) throw new Error("Sale not found");

  if (sale.Status === "CANCELLED")
    throw new Error("Cannot update cancelled sale");

  // Map camelCase -> DB fields
  const fieldMap = {
    paymentMethod: "PaymentMethod",
    status: "Status",
    customerId: "CustomerID",
  };

  // Whitelist safe fields only
  const filteredData = Object.keys(updateData)
    .filter((key) => Object.keys(fieldMap).includes(key))
    .reduce((obj, key) => {
      obj[fieldMap[key]] = updateData[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0)
    throw new Error("No valid fields to update");

  await sale.update(filteredData, { transaction: t });

  if (!isExternal) await t.commit();

  return sale;
}

// Cancel Sale (Soft Delete)
export async function cancelSale(id, transaction = null) {
  const { Sale, SaleDetail, StockBatch } = db;

  const t = transaction || (await sequelize.transaction());
  const isExternal = !!transaction;

  const sale = await Sale.findByPk(id, {
    include: [
      {
        model: SaleDetail,
        required: false, // important: ensures array even if no details
      },
    ],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  if (!sale) throw new Error("Sale not found");

  if (sale.Status === "CANCELLED") throw new Error("Sale already cancelled");

  // Restore stock
  for (const detail of sale.SaleDetails) {
    const batch = await StockBatch.findByPk(detail.BatchID, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!batch) throw new Error("Related stock batch not found");

    batch.QuantityOnHand += detail.Quantity;
    await batch.save({ transaction: t });
  }

  // Mark sale cancelled
  await sale.update({ Status: "CANCELLED" }, { transaction: t });

  if (!isExternal) await t.commit();

  return sale;
}

export default {
  processSale,
  getAllSales,
  getSaleById,
  updateSale,
  cancelSale,
};
