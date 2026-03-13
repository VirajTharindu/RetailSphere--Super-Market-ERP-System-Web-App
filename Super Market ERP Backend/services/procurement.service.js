import db from "../models/index.js";
const { Supplier } = db;

/**
 * ==========================================
 * SUPPLIER SERVICE METHODS
 * ==========================================
 */

// Create Supplier
export async function createSupplier(payload) {
  return await Supplier.create(payload);
}

// Get Supplier By ID
export async function getSupplierById(id) {
  return await Supplier.findByPk(id);
}

// List Suppliers (Pagination)
export async function getAllSuppliers({ page, limit }) {
  const offset = (page - 1) * limit;

  return await Supplier.findAndCountAll({
    limit,
    offset,
    order: [["SupplierID", "DESC"]],
  });
}

// Update Supplier (Delta Detection)
export async function updateSupplier(id, bodyData) {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) return null;

  const updatePayload = {};
  const updatedPart = {};

  if (
    bodyData.SupplierName !== undefined &&
    bodyData.SupplierName !== supplier.SupplierName
  ) {
    updatePayload.SupplierName = bodyData.SupplierName;
    updatedPart.SupplierName = bodyData.SupplierName;
  }

  if (
    bodyData.ContactNumber !== undefined &&
    bodyData.ContactNumber !== supplier.ContactNumber
  ) {
    updatePayload.ContactNumber = bodyData.ContactNumber;
    updatedPart.ContactNumber = bodyData.ContactNumber;
  }

  if (Object.keys(updatePayload).length === 0) {
    return { noChange: true };
  }

  await Supplier.update(updatePayload, { where: { SupplierID: id } });

  return {
    updatedPart,
    supplier: {
      ...supplier.toJSON(),
      ...updatePayload,
    },
  };
}

// Delete Supplier
export async function deleteSupplier(id) {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) return null;

  await supplier.destroy();
  return supplier;
}
