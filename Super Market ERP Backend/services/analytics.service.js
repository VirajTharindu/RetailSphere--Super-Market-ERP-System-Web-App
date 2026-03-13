import Sequelize from "sequelize";
import sequelize from "../config/database.js";
import db from "../models/index.js";

const { Op } = Sequelize; // <-- THIS is correct

function ensureDateRange(from, to) {
  const where = {};

  if (from || to) {
    where.SaleDate = {};
    if (from) where.SaleDate[Op.gte] = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      where.SaleDate[Op.lte] = t;
    }
  }

  return where;
}

export async function getOverview({ from, to } = {}) {
  const { Sale } = db;

  const where = ensureDateRange(from, to);

  const totals = await Sale.findAll({
    attributes: [
      [sequelize.fn("SUM", sequelize.col("TotalAmount")), "totalSales"],
      [sequelize.fn("SUM", sequelize.col("TotalCost")), "totalCost"],
      [sequelize.fn("SUM", sequelize.col("TotalProfit")), "totalProfit"],
      [sequelize.fn("COUNT", sequelize.col("SaleID")), "transactions"],
    ],
    where,
    raw: true,
  });

  // Payment method breakdown
  const paymentBreakdown = await Sale.findAll({
    attributes: [
      "PaymentMethod",
      [sequelize.fn("SUM", sequelize.col("TotalAmount")), "amount"],
      [sequelize.fn("COUNT", sequelize.col("SaleID")), "count"],
    ],
    where,
    group: ["PaymentMethod"],
    raw: true,
  });

  return {
    totalSales: parseFloat(totals[0].totalSales || 0),
    totalCost: parseFloat(totals[0].totalCost || 0),
    totalProfit: parseFloat(totals[0].totalProfit || 0),
    transactions: parseInt(totals[0].transactions || 0, 10),
    paymentBreakdown,
  };
}

export async function getSalesTrend({ from, to, period = "day" } = {}) {
  const { Sale } = db;
  const where = ensureDateRange(from, to);

  // Group by DATE for day, or by YEAR-MONTH for month
  if (period === "month") {
    const rows = await Sale.findAll({
      attributes: [
        [
          sequelize.fn("DATE_FORMAT", sequelize.col("SaleDate"), "%Y-%m"),
          "period",
        ],
        [sequelize.fn("SUM", sequelize.col("TotalAmount")), "sales"],
        [sequelize.fn("SUM", sequelize.col("TotalProfit")), "profit"],
      ],
      where,
      group: ["period"],
      order: [[sequelize.literal("period"), "ASC"]],
      raw: true,
    });

    return rows.map((r) => ({
      period: r.period,
      sales: parseFloat(r.sales || 0),
      profit: parseFloat(r.profit || 0),
    }));
  }

  // default: day
  const rows = await Sale.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("SaleDate")), "period"],
      [sequelize.fn("SUM", sequelize.col("TotalAmount")), "sales"],
      [sequelize.fn("SUM", sequelize.col("TotalProfit")), "profit"],
    ],
    where,
    group: [sequelize.fn("DATE", sequelize.col("SaleDate"))],
    order: [[sequelize.literal("period"), "ASC"]],
    raw: true,
  });

  return rows.map((r) => ({
    period: r.period,
    sales: parseFloat(r.sales || 0),
    profit: parseFloat(r.profit || 0),
  }));
}

export async function getTopProducts({ limit = 10, from, to } = {}) {
  const { SaleDetail, Product } = db;

  const where = {};
  // SaleDetail does not have SaleDate directly; join via Sale if date filtering needed
  if (from || to) {
    // perform a raw query for simplicity
    const sql = `SELECT sd.ProductID, p.ProductName, SUM(sd.Quantity) as unitsSold, SUM(sd.SubTotal) as sales
      FROM tbl_SaleDetail sd
      JOIN tbl_Sale s ON s.SaleID = sd.SaleID
      JOIN tbl_Product p ON p.ProductID = sd.ProductID
      WHERE 1=1
      ${from ? " AND s.SaleDate >= :from" : ""}
      ${to ? " AND s.SaleDate <= :to" : ""}
      GROUP BY sd.ProductID, p.ProductName
      ORDER BY unitsSold DESC
      LIMIT :limit`;

    const replacements = { limit };
    if (from) replacements.from = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      replacements.to = t;
    }

    const results = await db.sequelize.query(sql, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });
    return results;
  }

  // No date filter: use Sequelize aggregation
  const rows = await SaleDetail.findAll({
    attributes: [
      "ProductID",
      [sequelize.fn("SUM", sequelize.col("Quantity")), "unitsSold"],
      [sequelize.fn("SUM", sequelize.col("SubTotal")), "sales"],
    ],
    include: [{ model: Product, attributes: ["ProductName"] }],
    group: ["ProductID", "Product.ProductID"],
    order: [[sequelize.literal("unitsSold"), "DESC"]],
    limit,
    raw: true,
  });

  return rows.map((r) => ({
    productId: r.ProductID,
    productName: r["Product.ProductName"],
    unitsSold: parseInt(r.unitsSold || 0, 10),
    sales: parseFloat(r.sales || 0),
  }));
}

export async function getLowStock({ threshold = null, limit = 50 } = {}) {
  const { StockBatch, Product } = db;

  // Aggregate quantities per product
  const rows = await StockBatch.findAll({
    attributes: [
      "ProductID",
      [sequelize.fn("SUM", sequelize.col("QuantityOnHand")), "qtyOnHand"],
    ],
    group: ["ProductID"],
    raw: true,
  });

  const productIds = rows.map((r) => r.ProductID);
  if (productIds.length === 0) return [];

  const products = await Product.findAll({
    where: { ProductID: productIds },
    raw: true,
  });
  const prodMap = products.reduce((acc, p) => {
    acc[p.ProductID] = p;
    return acc;
  }, {});

  const combined = rows.map((r) => ({
    productId: r.ProductID,
    qtyOnHand: parseInt(r.qtyOnHand || 0, 10),
    product: prodMap[r.ProductID],
  }));

  const filtered = combined.filter((c) => {
    const reorder = c.product?.ReorderLevel ?? 0;
    const thr = threshold !== null ? threshold : reorder;
    return c.qtyOnHand <= thr;
  });

  filtered.sort((a, b) => a.qtyOnHand - b.qtyOnHand);

  return filtered.slice(0, limit).map((f) => ({
    productId: f.productId,
    productName: f.product?.ProductName || null,
    qtyOnHand: f.qtyOnHand,
    reorderLevel: f.product?.ReorderLevel || 0,
  }));
}

export async function getInventoryValuation() {
  const { StockBatch } = db;

  const rows = await StockBatch.findAll({
    attributes: [
      [sequelize.literal("SUM(QuantityOnHand * CostPrice)"), "totalValue"],
    ],
    raw: true,
  });

  return { totalValue: parseFloat(rows[0].totalValue || 0) };
}

export async function getTopCustomers({ limit = 10, from, to } = {}) {
  const { Sale, Customer } = db;
  const where = ensureDateRange(from, to);

  // Aggregate sales per customer
  const rows = await Sale.findAll({
    attributes: [
      "CustomerID",
      [sequelize.fn("SUM", sequelize.col("TotalAmount")), "amount"],
      [sequelize.fn("COUNT", sequelize.col("SaleID")), "orders"],
    ],
    where,
    group: ["CustomerID"],
    order: [[sequelize.literal("amount"), "DESC"]],
    limit,
    raw: true,
  });

  // Get the actual customer details
  const customerIds = rows.map((r) => r.CustomerID).filter(Boolean);
  const customers = await Customer.findAll({
    where: { CustomerID: customerIds },
    attributes: ["CustomerID", "FirstName", "LastName"], // get the real fields
    raw: true,
  });

  // Map CustomerID -> customer
  const custMap = customers.reduce((acc, c) => {
    acc[c.CustomerID] = c;
    return acc;
  }, {});

  // Combine FirstName and LastName for customerName
  return rows.map((r) => {
    const customer = custMap[r.CustomerID];
    const customerName = customer
      ? `${customer.FirstName} ${customer.LastName || ""}`.trim()
      : null;

    return {
      customerId: r.CustomerID,
      customerName,
      amount: parseFloat(r.amount || 0),
      orders: parseInt(r.orders || 0, 10),
    };
  });
}

export async function getExpiryForecast({ days = 30 } = {}) {
  const { StockBatch, Product } = db;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // start of today

  const rows = await StockBatch.findAll({
    attributes: ["BatchID", "QuantityOnHand", "ExpiryDate"],
    include: [{ model: Product, attributes: ["ProductName"] }],
    where: {
      ExpiryDate: {
        [Op.gte]: today, // greater than or equal to today
        [Op.lte]: sequelize.literal(
          `DATE_ADD(CURDATE(), INTERVAL ${days} DAY)`,
        ), // less than or equal to today + 30
      },
    },
    raw: true,
  });

  return rows.map((r) => ({
    batchId: r.BatchID,
    productName: r["Product.ProductName"],
    quantityOnHand: parseInt(r.QuantityOnHand || 0, 10),
    expiryDate: r.ExpiryDate,
  }));
}

export default {
  getOverview,
  getSalesTrend,
  getTopProducts,
  getLowStock,
  getInventoryValuation,
  getTopCustomers,
  getExpiryForecast,
};
