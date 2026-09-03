import {
  createSupplier,
  getSupplierById,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
} from "../services/procurement.service.js";

/**
 * ==========================================
 * SUPPLIER CONTROLLER METHODS
 * ==========================================
 */

// Health Check
export function healthCheck(req: any, res: any) {
  res.json({ status: "ok", message: "Procurement service live 🚀" });
}

// Create Supplier
export async function createSupplierController(req: any, res: any) {
  try {
    const payload = req.body;

    const supplier = await createSupplier(payload);

    res.status(201).json({
      success: true,
      message: `Supplier created successfully with ID ${supplier.SupplierID}`,
      supplier,
    });
  } catch (error: any) {
    console.error("Create Supplier Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Get Supplier By ID
export async function getSupplierByIdController(req: any, res: any) {
  try {
    const { id } = req.params;

    const supplier = await getSupplierById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: `Supplier not found with ID ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Supplier found with ID ${id}`,
      supplier,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

// List Suppliers (Pagination)
export async function getAllSuppliersController(req: any, res: any) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const { rows, count } = await getAllSuppliers({ page, limit });

    res.status(200).json({
      success: true,
      message: "Suppliers listed successfully",
      page_data: {
        total_suppliers: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      suppliers: rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

// Update Supplier
export async function updateSupplierController(req: any, res: any) {
  try {
    const { id } = req.params;
    const bodyData = req.body;

    const result = await updateSupplier(id, bodyData);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Supplier not found with ID ${id}`,
      });
    }

    if (result?.noChange) {
      return res.status(400).json({
        success: false,
        message: "No actual changes detected.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Supplier updated successfully with ID ${id}`,
      updatedPart: result?.updatedPart,
      supplier: result?.supplier,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update supplier.",
    });
  }
}

// Delete Supplier
export async function deleteSupplierController(req: any, res: any) {
  try {
    const { id } = req.params;

    const supplier = await deleteSupplier(id);

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    res.status(200).json({
      success: true,
      message: `Supplier deleted successfully with ID ${id}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
