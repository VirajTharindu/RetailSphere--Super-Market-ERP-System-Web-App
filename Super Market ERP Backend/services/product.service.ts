import db from "../models/index.js";
const {  Product, Category, StockBatch, sequelize  } = db as any;
import { Op, Sequelize } from "sequelize";

/**
 * Create Product
 */
export async function createProduct(data: any) {
  const transaction = await sequelize.transaction();
  try {
    const category = await Category.findByPk(data.CategoryID, { transaction });
    if (!category) throw new Error("Invalid CategoryID");

    const product = await Product.create(
      {
        ProductName: data.ProductName,
        CategoryID: data.CategoryID,
        UnitPrice: data.UnitPrice,
        ReorderLevel: data.ReorderLevel ?? 10,
      },
      { transaction },
    );

    await transaction.commit();
    return product;
  } catch (err: any) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Get All Products
 */
export async function getAllProducts() {
  return Product.findAll({
    include: [{ model: Category, attributes: ["CategoryID", "CategoryName"] }],
  });
}

/**
 * Get Product By ID
 */
export async function getProductById(productId: any) {
  const product = await Product.findByPk(productId, {
    include: [{ model: Category }],
  });

  if (!product) throw new Error("Product not found");
  return product;
}

/**
 * Update Product (metadata only)
 */
export async function updateProduct(productId: any, data: any) {
  const transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error("Product not found");

    if (data.CategoryID) {
      const category = await Category.findByPk(data.CategoryID, {
        transaction,
      });
      if (!category) throw new Error("Invalid CategoryID");
    }

    await product.update(data, { transaction });
    await transaction.commit();
    return product;
  } catch (err: any) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Delete Product (SAFE DELETE)
 */
export async function deleteProduct(productId: any) {
  const transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error("Product not found");

    const stockCount = await StockBatch.count({
      where: { ProductID: productId },
      transaction,
    });

    if (stockCount > 0)
      throw new Error("Cannot delete product with existing stock batches");

    await product.destroy({ transaction });
    await transaction.commit();
    return true;
  } catch (err: any) {
    await transaction.rollback();
    throw err;
  }
}

/*
export async function getProductsByCategory(categoryId) {
  return Product.findAll({
    where: { CategoryID: categoryId },
    include: [{ model: Category, attributes: ["CategoryID", "CategoryName"] }],
  });
}

export async function searchProductsByName(keyword) {
  return Product.findAll({
    where: {
      ProductName: {
        [Op.like]: `%${keyword}%`,
      },
    },
    include: [{ model: Category, attributes: ["CategoryID", "CategoryName"] }],
  });
}

export async function hasStock(productId) {
  const stockCount = await StockBatch.count({
    where: { ProductID: productId },
  });
  return stockCount > 0;
}

export async function getLowStockProducts(threshold = 10) {
  return Product.findAll({
    where: {
      ReorderLevel: { [Op.gte]: Sequelize.col("UnitInStock") }, // Assuming you track stock in Product or via StockBatch
    },
    include: [{ model: Category }],
  });
}

export async function bulkCreateProducts(products) {
  return Product.bulkCreate(products);
}
*/

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  //getProductsByCategory,
  //searchProductsByName,
  //hasStock,
  //getLowStockProducts,
  //bulkCreateProducts,
};
