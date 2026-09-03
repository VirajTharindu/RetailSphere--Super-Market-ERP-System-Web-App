import db from "../models/index.js";
const { PurchaseOrder, POrderDetail, Supplier } = db as any;

/**
 * ==========================================
 * PROCUREMENT & SUPPLIER SERVICE METHODS
 * ==========================================
 */

// --- SUPPLIER METHODS ---

export async function createSupplier(data: any) {
  return (Supplier as any).create(data);
}

export async function getSupplierById(id: any) {
  return (Supplier as any).findByPk(id);
}

export async function getAllSuppliers({ page = 1, limit = 20 }: any = {}) {
  const offset = (page - 1) * limit;
  return (Supplier as any).findAndCountAll({
    limit,
    offset,
  });
}

export async function updateSupplier(id: any, data: any) {
  const supplier = await (Supplier as any).findByPk(id);
  if (!supplier) return null;

  const updatedPart: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== (supplier as any)[key]) {
      (supplier as any)[key] = data[key];
      updatedPart[key] = data[key];
    }
  });

  if (Object.keys(updatedPart).length === 0) {
    return { supplier, noChange: true };
  }

  await supplier.save();
  return { supplier, updatedPart };
}

export async function deleteSupplier(id: any) {
  const supplier = await (Supplier as any).findByPk(id);
  if (!supplier) return false;
  await supplier.destroy();
  return true;
}

// --- PO METHODS ---

export async function getAllPOs() {
  return (PurchaseOrder as any).findAll({
    include: [{ model: Supplier }, { model: POrderDetail }],
  });
}

export async function getPOById(id: any) {
  return (PurchaseOrder as any).findByPk(id, {
    include: [{ model: Supplier }, { model: POrderDetail }],
  });
}

export async function createPO(data: any) {
  return (PurchaseOrder as any).create(data);
}

export async function updatePO(id: any, data: any) {
  const po = await (PurchaseOrder as any).findByPk(id);
  if (!po) return null;

  const updatedPart: any = {};
  if (data.SupplierID !== undefined && data.SupplierID !== (po as any).SupplierID) {
    (po as any).SupplierID = data.SupplierID;
    updatedPart.SupplierID = data.SupplierID;
  }
  if (data.Status !== undefined && data.Status !== (po as any).Status) {
    (po as any).Status = data.Status;
    updatedPart.Status = data.Status;
  }

  await po.save();
  return { po, updatedPart };
}

export default {
  createSupplier,
  getSupplierById,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
  getAllPOs,
  getPOById,
  createPO,
  updatePO,
};
