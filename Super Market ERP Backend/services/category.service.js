import db from "../models/index.js";
const { Category } = db;

/**
 * ==========================================
 * CATEGORY SERVICE METHODS
 * ==========================================
 */

export async function createCategory(data) {
  return Category.create({
    CategoryName: data.CategoryName,
    Description: data.Description,
  });
}

export async function getAllCategories() {
  return Category.findAll();
}

export async function getCategoryById(id) {
  return Category.findByPk(id);
}

export async function updateCategory(id, updatePayload) {
  return Category.update(updatePayload, { where: { CategoryID: id } });
}

export async function deleteCategory(id) {
  return Category.destroy({ where: { CategoryID: id } });
}
