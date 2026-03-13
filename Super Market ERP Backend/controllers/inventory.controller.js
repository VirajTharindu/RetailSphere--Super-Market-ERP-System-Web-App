import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";

/**
 * ==========================================
 * CATEGORY CONTROLLER METHODS
 * ==========================================
 */

// Health Check
export function healthCheck(req, res) {
  res.status(200).json({ status: "ok", message: "Inventory service live 🚀" });
}

// Create Category
export async function createCategoryController(req, res) {
  try {
    const { CategoryName, Description } = req.body;

    const category = await createCategory({ CategoryName, Description });

    res.status(201).json({
      success: true,
      category,
      message: `Category created successfully with ID ${category.CategoryID}`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: err.message,
    });
  }
}

// List Categories
export async function getAllCategoriesController(req, res) {
  try {
    const categories = await getAllCategories();
    res.status(200).json({
      success: true,
      categories,
      message: `${categories.length} category(ies) retrieved successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
      error: err.message,
    });
  }
}

// Get Category by ID
export async function getCategoryByIdController(req, res) {
  try {
    const { id } = req.params;

    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with ID ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      category,
      message: `Category retrieved successfully with ID ${id}`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Failed to retrieve category`,
      error: err.message,
    });
  }
}

// Update Category (Manual Delta Detection)
export async function updateCategoryController(req, res) {
  try {
    const { id } = req.params;
    const { CategoryName, Description } = req.body;

    const existingCategory = await getCategoryById(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: `Category not found with ID ${id}`,
      });
    }

    const updatePayload = {};
    const updatedPart = {};

    if (
      CategoryName !== undefined &&
      CategoryName !== existingCategory.CategoryName
    ) {
      updatePayload.CategoryName = CategoryName;
      updatedPart.CategoryName = CategoryName;
    }

    if (
      Description !== undefined &&
      Description !== existingCategory.Description
    ) {
      updatePayload.Description = Description;
      updatedPart.Description = Description;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No actual changes detected",
      });
    }

    await updateCategory(id, updatePayload);

    res.status(200).json({
      success: true,
      updated_part: updatedPart,
      category: {
        CategoryID: Number(id),
        CategoryName:
          updatePayload.CategoryName ?? existingCategory.CategoryName,
        Description: updatePayload.Description ?? existingCategory.Description,
      },
      message: `Category updated successfully with ID ${id}`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: err.message,
    });
  }
}

// Delete Category
export async function deleteCategoryController(req, res) {
  try {
    const { id } = req.params;

    const deleted = await deleteCategory(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Category not found with ID ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Category deleted successfully with ID ${id}`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Failed to delete category`,
      error: err.message,
    });
  }
}
