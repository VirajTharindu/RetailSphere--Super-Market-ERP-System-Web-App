import sequelize from "../config/database.js";
import db from "../models/index.js";
import { issueStockByProduct } from "./inventory.service.js";
import generateInvoiceNo from "../utils/generateInvoiceNo.js";

/**
 * ARCHITECTURAL REFACTOR:
 * We access the models via the 'db' object inside the function
 * to ensure they are fully loaded by the time the API hits.
 */

// Helper function to get available stock
async function getTotalAvailableStock(productId: any, options: any = {}) {
  const { StockBatch } = db as any;
  const batches = await (StockBatch as any).findAll({
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
  { customerId, items, paymentMethod = "CASH", status = "COMPLETED" }: any,
  loggedUser: any,
) {
  if (!loggedUser?.UserID) throw new Error("User not authenticated");

  const { Sale, SaleDetail, StockBatch, Product, Customer } = db as any;

  if (!Sale || !SaleDetail) {
    throw new Error("Internal Configuration Error: Sale models not defined.");
  }

  const t = await sequelize.transaction();

  try {
    if (!items || items.length === 0)
      throw new Error("Sale must contain at least one item");

    const loggedUserId = loggedUser.UserID;
    const invoiceNo = await generateInvoiceNo(t);

    const allowedPayments = ["CASH", "CARD"];
    const allowedStatus = ["COMPLETED", "PENDING"];

    if (!allowedPayments.includes(paymentMethod))
      throw new Error("Invalid payment method");

    if (!allowedStatus.includes(status)) throw new Error("Invalid status");

    const customer = await (Customer as any).findByPk(customerId, { transaction: t });
    if (!customer) throw new Error("Customer not found");

    let customerIDForSales = (customer as any).CustomerID;

    const sale = await (Sale as any).create(
      {
        InvoiceNumber: invoiceNo,
        CustomerID: customerIDForSales || null,
        UserID: loggedUserId,
        TotalAmount: 0,
        TotalCost: 0,
        TotalProfit: 0,
        PaymentMethod: paymentMethod,
        Status: status,
      },
      { transaction: t },
    );

    let total = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const reorderResults = [];

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        throw new Error("Invalid sale item structure");
      }

      const product = await (Product as any).findByPk(item.productId, { transaction: t });
      if (!product) throw new Error("Product not found");

      const totalAvailable = await getTotalAvailableStock(item.productId, { transaction: t });
      if (totalAvailable < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      const unitPriceForProduct = (product as any).UnitPrice;

      const { deductions, reorderResult } = await issueStockByProduct({
        productId: item.productId,
        quantity: item.quantity,
        transaction: t,
      });

      if (reorderResult) {
        reorderResults.push({ productId: item.productId, ...reorderResult });
      }

      for (const d of deductions) {
        const stockBatch = await (StockBatch as any).findByPk(d.batchId, {
          transaction: t,
          lock: (t as any).LOCK.UPDATE,
        });
        if (!stockBatch) throw new Error("Stock batch not found");

        const costPrice = (stockBatch as any).CostPrice;
        const unitPrice = unitPriceForProduct;

        const subTotal = d.quantity * unitPrice;
        const costTotal = d.quantity * costPrice;
        const profit = subTotal - costTotal;

        await (SaleDetail as any).create(
          {
            SaleID: (sale as any).SaleID,
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

    (sale as any).TotalAmount = total;
    (sale as any).TotalCost = totalCost;
    (sale as any).TotalProfit = totalProfit;

    await (sale as any).save({ transaction: t });
    await t.commit();

    return { sale, reorderResults };
  } catch (err: any) {
    await t.rollback();
    throw err;
  }
}

export async function getAllSales({
  page = 1,
  limit = 20,
  status = null,
  includeDetails = false,
  transaction = null,
}: any = {}) {
  const { Sale, SaleDetail, StockBatch } = db as any;
  const offset = (page - 1) * limit;
  const whereClause: any = {};
  if (status) whereClause.Status = status;

  const options: any = {
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

  const { rows, count } = await (Sale as any).findAndCountAll(options);

  return {
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: rows,
  };
}

export async function getSaleById(id: any, transaction: any = null) {
  const { Sale, SaleDetail, StockBatch } = db as any;
  return await (Sale as any).findByPk(id, {
    include: [
      {
        model: SaleDetail,
        include: [StockBatch],
      },
    ],
    transaction,
  });
}

export async function updateSale(id: any, updateData: any, transaction: any = null) {
  const { Sale } = db as any;

  const t = transaction || (await sequelize.transaction());
  const isExternal = !!transaction;

  try {
    const sale = await (Sale as any).findByPk(id, { transaction: t });
    if (!sale) throw new Error("Sale not found");

    if ((sale as any).Status === "CANCELLED")
      throw new Error("Cannot update cancelled sale");

    const fieldMap: Record<string, string> = {
      paymentMethod: "PaymentMethod",
      status: "Status",
      customerId: "CustomerID",
    };

    const filteredData: any = {};
    Object.keys(updateData).forEach(key => {
      if (fieldMap[key]) {
        filteredData[fieldMap[key]] = (updateData as any)[key];
      }
    });

    if (Object.keys(filteredData).length === 0)
      throw new Error("No valid fields to update");

    await (sale as any).update(filteredData, { transaction: t });

    if (!isExternal) await t.commit();
    return sale;
  } catch (err: any) {
    if (!isExternal) await t.rollback();
    throw err;
  }
}

export async function cancelSale(id: any, transaction: any = null) {
  const { Sale, SaleDetail, StockBatch } = db as any;

  const t = transaction || (await sequelize.transaction());
  const isExternal = !!transaction;

  try {
    const sale = await (Sale as any).findByPk(id, {
      include: [{ model: SaleDetail, required: false }],
      transaction: t,
      lock: (t as any).LOCK.UPDATE,
    });

    if (!sale) throw new Error("Sale not found");
    if ((sale as any).Status === "CANCELLED") throw new Error("Sale already cancelled");

    for (const detail of (sale as any).SaleDetails) {
      const batch = await (StockBatch as any).findByPk(detail.BatchID, {
        transaction: t,
        lock: (t as any).LOCK.UPDATE,
      });
      if (batch) {
        (batch as any).QuantityOnHand += detail.Quantity;
        await (batch as any).save({ transaction: t });
      }
    }

    await (sale as any).update({ Status: "CANCELLED" }, { transaction: t });

    if (!isExternal) await t.commit();
    return sale;
  } catch (err: any) {
    if (!isExternal) await t.rollback();
    throw err;
  }
}

export default {
  processSale,
  getAllSales,
  getSaleById,
  updateSale,
  cancelSale,
};
