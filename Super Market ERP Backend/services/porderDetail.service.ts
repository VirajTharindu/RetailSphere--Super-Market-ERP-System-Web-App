import db from "../models/index.js";
const { POrderDetail, PurchaseOrder } = db as any;

/**
 * ==========================================
 * PORDER DETAIL SERVICE METHODS
 * ==========================================
 */

export async function getPODetailById(id: any) {
  return (POrderDetail as any).findByPk(id, {
    include: [{ model: PurchaseOrder }],
  });
}

export async function getPODetailsByPO(poId: any) {
  return (POrderDetail as any).findAll({
    where: { PO_ID: poId },
    include: [{ model: PurchaseOrder }],
  });
}

export async function listPODetails(filter: any = {}) {
  return (POrderDetail as any).findAll({
    where: filter,
    include: [{ model: PurchaseOrder }],
  });
}

export async function updatePODetail(id: any, data: any) {
  const detail = await (POrderDetail as any).findByPk(id);
  if (!detail) throw new Error("PO Detail not found");

  const writableFields = ["Status", "QuantityReceived", "CostPriceofPOD", "ExpiryDate"];
  writableFields.forEach((field) => {
    if (data[field] !== undefined) (detail as any)[field] = data[field];
  });

  await detail.save();
  return detail;
}

export async function updatePODetailStatus(poId: any, data: any) {
  const poDetails = await (POrderDetail as any).findAll({
    where: { PO_ID: poId },
  });

  if (!poDetails || poDetails.length === 0) {
    throw new Error("No PO Details found for this PO ID");
  }

  for (const pod of poDetails) {
    if (data.Status === "Cancelled") {
      if ((pod as any).Status !== "Cancelled") {
        (pod as any).Status = "Cancelled";
        (pod as any).QuantityReceived = 0;
        await pod.save();
      }
    } else {
      const writableFields = ["Status", "QuantityReceived", "CostPriceofPOD", "ExpiryDate"];
      writableFields.forEach((field) => {
        if (data[field] !== undefined) (pod as any)[field] = data[field];
      });
      await pod.save();
    }
  }
}

export async function deletePODetail(id: any) {
  const detail = await (POrderDetail as any).findByPk(id);
  if (!detail) return false;
  await detail.destroy();
  return true;
}

export default {
  getPODetailById,
  getPODetailsByPO,
  listPODetails,
  updatePODetail,
  updatePODetailStatus,
  deletePODetail,
};
