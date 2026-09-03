import db from "../models/index.js";
const { Category } = db as any;

/**
 * ==========================================
 * CATEGORY SERVICE METHODS
 * ==========================================
 */

export async function createCategory(data: any) {
  return (Category as any).create({
    CategoryName: data.CategoryName,
    Description: data.Description,
  });
}

export async function getAllCategories() {
  return (Category as any).findAll();
}

export async function getCategoryById(id: any) {
  return (Category as any).findByPk(id);
}

export async function updateCategory(id: any, updatePayload: any) {
  return (Category as any).update(updatePayload, { where: { CategoryID: id } });
}

export async function deleteCategory(id: any) {
  return (Category as any).destroy({ where: { CategoryID: id } });
}

export default {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
