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

  const totalSalesCount = await Sale.count({ where });
  const totalRevenue = await Sale.sum("TotalAmount", { where }) || 0;
  const totalProducts = await Product.count();

  return { totalSalesCount, totalRevenue, totalProducts };
}

export async function getSalesTrend({ from, to, period = "daily" }: any = {}) {
  const { Sale } = db as any;
  // Simplified daily trend
  return Sale.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("SaleDate")), "date"],
      [sequelize.fn("SUM", sequelize.col("TotalAmount")), "totalSales"],
    ],
    group: [sequelize.fn("DATE", sequelize.col("SaleDate"))],
    order: [[sequelize.fn("DATE", sequelize.col("SaleDate")), "ASC"]],
  });
}

export async function getTopProducts({ limit = 10, from, to }: any = {}) {
  const { SaleDetail, Product } = db as any;
  return SaleDetail.findAll({
    attributes: [
      "ProductID",
      [sequelize.fn("SUM", sequelize.col("Quantity")), "unitsSold"],
    ],
    include: [{ model: Product, attributes: ["ProductName"] }],
    group: ["ProductID", "Product.ProductID"],
    order: [[sequelize.literal("unitsSold"), "DESC"]],
    limit,
  });
}

export async function getLowStock({ threshold = 10, limit = 50 }: any = {}) {
  const { Product } = db as any;
  return Product.findAll({
    where: {
      QuantityInStock: { [Op.lte]: threshold },
    },
    limit,
  });
}

export async function getInventoryValuation() {
  const { StockBatch } = db as any;
  const totalValue = await StockBatch.sum(
    sequelize.literal("QuantityOnHand * CostPrice")
  );
  return { totalValue: totalValue || 0 };
}

export async function getTopCustomers({ limit = 10, from, to }: any = {}) {
  const { Sale, Customer } = db as any;
  return Sale.findAll({
    attributes: [
      "CustomerID",
      [sequelize.fn("SUM", sequelize.col("TotalAmount")), "totalSpent"],
    ],
    include: [{ model: Customer, attributes: ["FullName"] }],
    group: ["CustomerID", "Customer.CustomerID"],
    order: [[sequelize.literal("totalSpent"), "DESC"]],
    limit,
  });
}

export async function getExpiryForecast({ days = 30 }: any = {}) {
  const { StockBatch, Product } = db as any;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return StockBatch.findAll({
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
}

export async function getCategoryPerformance() {
  const { Product, Category } = db as any;
  const rows = await Category.findAll({
    attributes: [
      "CategoryName",
      [sequelize.fn("COUNT", sequelize.col("Products.ProductID")), "productCount"],
    ],
    include: [{ model: Product, attributes: [] }],
    group: ["Category.CategoryID"],
  });

  return rows.map((c: any) => ({
    category: c.CategoryName,
    productCount: c.productCount,
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
