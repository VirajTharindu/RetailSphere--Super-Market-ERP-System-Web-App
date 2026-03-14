import Sequelize from "sequelize";
import sequelize from "../config/database.js";
import db from "../models/index.js";

const { Op } = Sequelize as any;

/**
 * ==========================================
 * ANALYTICS SERVICE METHODS (Advanced Reporting)
 * ==========================================
 */

export async function getOverview({ from, to }: any = {}) {
  const { Sale, Product } = db as any;
  const where = {} as any;
  if (from || to) {
    where.SaleDate = {};
    if (from) where.SaleDate[Op.gte] = new Date(from);
    if (to) where.SaleDate[Op.lte] = new Date(to);
  }

  const transactions = await Sale.count({ where });
  const totalSales = await Sale.sum("TotalAmount", { where }) || 0;
  const totalProfit = await Sale.sum("TotalProfit", { where }) || 0;
  const totalProducts = await Product.count();

  return { 
    totalSales, 
    transactions, 
    totalProfit, 
    totalProducts 
  };
}

export async function getSalesTrend({ from, to, period = "daily" }: any = {}) {
  const { Sale } = db as any;
  
  const results = await Sale.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("SaleDate")), "period"],
      [sequelize.fn("SUM", sequelize.col("TotalAmount")), "sales"],
    ],
    group: [sequelize.fn("DATE", sequelize.col("SaleDate"))],
    order: [[sequelize.fn("DATE", sequelize.col("SaleDate")), "ASC"]],
  });

  return results;
}

export async function getTopProducts({ limit = 10, from, to }: any = {}) {
  const { SaleDetail, Product } = db as any;
  
  const results = await SaleDetail.findAll({
    attributes: [
      "ProductID",
      [sequelize.fn("SUM", sequelize.col("Quantity")), "unitsSold"],
      [sequelize.fn("SUM", sequelize.col("SubTotal")), "totalRevenue"],
    ],
    include: [{ model: Product, attributes: ["ProductName"] }],
    group: ["ProductID", "Product.ProductID", "Product.ProductName"],
    order: [[sequelize.literal("unitsSold"), "DESC"]],
    limit,
  });

  return results.map((r: any) => ({
    productName: r.Product?.ProductName,
    unitsSold: parseInt(r.get("unitsSold"), 10),
    totalRevenue: parseFloat(r.get("totalRevenue")),
    sales: parseFloat(r.get("totalRevenue")) // Alias for FE
  }));
}

export async function getLowStock({ threshold = 10, limit = 50 }: any = {}) {
  // Ensure threshold is a number even if null is passed from controller
  const effectiveThreshold = threshold ?? 10;
  const { Product, StockBatch } = db as any;
  
  const products = await Product.findAll({
    attributes: [
      "ProductID",
      "ProductName",
      "ReorderLevel",
      [
        sequelize.literal(
          "(SELECT SUM(QuantityOnHand) FROM tbl_StockBatch WHERE tbl_StockBatch.ProductID = Product.ProductID)"
        ),
        "totalStock",
      ],
    ],
    having: sequelize.literal(`totalStock <= ${effectiveThreshold}`),
    limit,
  });

  return products.map((p: any) => ({
    productId: p.ProductID,
    productName: p.ProductName,
    totalStock: parseInt(p.get("totalStock") || "0", 10),
    ReorderLevel: p.ReorderLevel
  }));
}

export async function getInventoryValuation() {
  const { StockBatch } = db as any;
  const result = await StockBatch.findAll({
    attributes: [
      [sequelize.fn("SUM", sequelize.literal("QuantityOnHand * CostPrice")), "totalValue"]
    ],
    raw: true
  });
  return { totalValue: result[0]?.totalValue || 0 };
}

export async function getTopCustomers({ limit = 10, from, to }: any = {}) {
  const { Sale, Customer } = db as any;
  
  const results = await Sale.findAll({
    attributes: [
      "CustomerID",
      [sequelize.fn("SUM", sequelize.col("TotalAmount")), "amount"],
      [sequelize.fn("COUNT", sequelize.col("SaleID")), "orders"],
    ],
    include: [{ model: Customer, attributes: ["FirstName", "LastName"] }],
    group: ["CustomerID", "Customer.CustomerID", "Customer.FirstName", "Customer.LastName"],
    order: [[sequelize.literal("amount"), "DESC"]],
    limit,
  });

  return results.map((r: any) => ({
    customerId: r.CustomerID,
    customerName: r.Customer ? `${r.Customer.FirstName} ${r.Customer.LastName}` : "Walk-in Customer",
    amount: parseFloat(r.get("amount")),
    orders: parseInt(r.get("orders"), 10)
  }));
}

export async function getExpiryForecast({ days = 30 }: any = {}) {
  const { StockBatch, Product } = db as any;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const batches = await StockBatch.findAll({
    where: {
      ExpiryDate: {
        [Op.and]: [
          { [Op.gt]: new Date() },
          { [Op.lte]: futureDate },
        ],
      },
      QuantityOnHand: { [Op.gt]: 0 },
    },
    include: [{ model: Product, attributes: ["ProductName"] }],
  });

  return batches.map((b: any) => ({
    batchId: b.StockBatchID,
    productName: b.Product?.ProductName,
    quantityOnHand: b.QuantityOnHand,
    expiryDate: b.ExpiryDate
  }));
}

export async function getCategoryPerformance() {
  const { Product, Category } = db as any;
  const rows = await Category.findAll({
    attributes: [
      "CategoryName",
      [sequelize.fn("COUNT", sequelize.col("Products.ProductID")), "productCount"],
    ],
    include: [{ model: Product, attributes: [] }],
    group: ["Category.CategoryID", "Category.CategoryName"],
  });

  return rows.map((c: any) => ({
    category: c.CategoryName,
    productCount: parseInt(c.get("productCount"), 10),
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
  getCategoryPerformance,
};
