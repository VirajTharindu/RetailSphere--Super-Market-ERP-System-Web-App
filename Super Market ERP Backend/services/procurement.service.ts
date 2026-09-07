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
  if (!po) throw new Error("PurchaseOrder not found");
  if (data.Status !== undefined) po.Status = data.Status;
  if (data.SupplierID !== undefined) po.SupplierID = data.SupplierID;
  await po.save();
  return po;
}

export async function acceptPurchaseOrder(purchaseOrderId: any) {
  const po = await (PurchaseOrder as any).findByPk(purchaseOrderId);
  if (!po) throw new Error("PurchaseOrder not found");
  po.Status = "Received";
  await po.save();

  // Also update all details of this PO
  const details = await (POrderDetail as any).findAll({
    where: { PO_ID: purchaseOrderId },
  });
  for (const pod of details) {
    if (pod.Status === "Pending") {
      pod.Status = "Received";
      if (!pod.QuantityReceived || pod.QuantityReceived <= 0) {
        pod.QuantityReceived = pod.QuantityRequested;
      }
      await pod.save();
    }
  }
  return po;
}

export async function rejectPurchaseOrder(purchaseOrderId: any) {
  const po = await (PurchaseOrder as any).findByPk(purchaseOrderId);
  if (!po) throw new Error("PurchaseOrder not found");
  po.Status = "Refused";
  await po.save();

  const details = await (POrderDetail as any).findAll({
    where: { PO_ID: purchaseOrderId },
  });
  for (const pod of details) {
    if (pod.Status === "Pending") {
      pod.Status = "Refused";
      pod.QuantityReceived = 0;
      await pod.save();
    }
  }
  return po;
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
  acceptPurchaseOrder,
  rejectPurchaseOrder,
};

