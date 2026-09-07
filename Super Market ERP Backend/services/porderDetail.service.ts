import db from "../models/index.js";
const { POrderDetail, PurchaseOrder, Product, Supplier } = db as any;

/**
 * ==========================================
 * PORDER DETAIL SERVICE METHODS
 * ==========================================
 */

export async function syncParentPOStatus(poId: any) {
  if (!poId) return;
  const po = await (PurchaseOrder as any).findByPk(poId);
  if (!po) return;

  const details = await (POrderDetail as any).findAll({
    where: { PO_ID: poId },
  });
  if (!details || details.length === 0) return;

  const statuses = details.map((d: any) => d.Status);
  if (statuses.every((s: string) => s === "Added")) {
    po.Status = "Added";
  } else if (statuses.every((s: string) => s === "Received")) {
    po.Status = "Received";
  } else if (statuses.every((s: string) => s === "Refused")) {
    po.Status = "Refused";
  } else if (statuses.every((s: string) => s === "Cancelled")) {
    po.Status = "Cancelled";
  } else if (statuses.some((s: string) => ["Received", "PartiallyReceived", "Added"].includes(s))) {
    po.Status = "PartiallyReceived";
  }
  await po.save();
}

export async function getPODetailById(id: any) {
  return (POrderDetail as any).findByPk(id, {
    include: [
      { model: PurchaseOrder, include: [{ model: Supplier }] },
      { model: Product },
    ],
  });
}

export async function getPODetailsByPO(poId: any) {
  return (POrderDetail as any).findAll({
    where: { PO_ID: poId },
    include: [
      { model: PurchaseOrder, include: [{ model: Supplier }] },
      { model: Product },
    ],
  });
}

export async function listPODetails(filter: any = {}) {
  return (POrderDetail as any).findAll({
    where: filter,
    include: [
      {
        model: PurchaseOrder,
        include: [{ model: Supplier }],
      },
      {
        model: Product,
      },
    ],
  });
}

export async function updatePODetail(id: any, data: any) {
  let detail = await (POrderDetail as any).findByPk(id, {
    include: [{ model: PurchaseOrder }],
  });

  // If not found by primary key, check if id is PO_ID
  if (!detail) {
    const details = await (POrderDetail as any).findAll({
      where: { PO_ID: id },
    });
    if (!details || details.length === 0) {
      throw new Error("PO Detail not found");
    }
    for (const d of details) {
      if (data.Status === "Received" && (data.QuantityReceived === undefined || data.QuantityReceived === null)) {
        d.QuantityReceived = d.QuantityRequested;
      }
      if (data.Status === "Refused" || data.Status === "Cancelled") {
        d.QuantityReceived = 0;
      }
      const writableFields = ["Status", "QuantityReceived", "CostPriceofPOD", "ExpiryDate"];
      writableFields.forEach((field) => {
        if (data[field] !== undefined) (d as any)[field] = data[field];
      });
      await d.save();
    }
    await syncParentPOStatus(id);
    return details;
  }

  if (data.Status === "Received") {
    if ((data.QuantityReceived === undefined || data.QuantityReceived === null) && (!detail.QuantityReceived || detail.QuantityReceived <= 0)) {
      detail.QuantityReceived = detail.QuantityRequested;
    }
  }
  if (data.Status === "Refused" || data.Status === "Cancelled") {
    detail.QuantityReceived = 0;
  }

  const writableFields = ["Status", "QuantityReceived", "CostPriceofPOD", "ExpiryDate"];
  writableFields.forEach((field) => {
    if (data[field] !== undefined) (detail as any)[field] = data[field];
  });

  await detail.save();
  if (detail.PO_ID) {
    await syncParentPOStatus(detail.PO_ID);
  }
  return detail;
}

export async function acceptPODetail(id: any, data: any = {}) {
  const detail = await (POrderDetail as any).findByPk(id);
  if (!detail) throw new Error("PO Detail not found");

  detail.Status = "Received";
  const qty = data.QuantityReceived != null && data.QuantityReceived > 0 
    ? data.QuantityReceived 
    : detail.QuantityRequested;
  detail.QuantityReceived = qty;

  if (data.CostPriceofPOD != null) detail.CostPriceofPOD = data.CostPriceofPOD;
  if (data.ExpiryDate !== undefined) detail.ExpiryDate = data.ExpiryDate;

  await detail.save();
  if (detail.PO_ID) await syncParentPOStatus(detail.PO_ID);
  return detail;
}

export async function refusePODetail(id: any) {
  const detail = await (POrderDetail as any).findByPk(id);
  if (!detail) throw new Error("PO Detail not found");

  detail.Status = "Refused";
  detail.QuantityReceived = 0;
  await detail.save();
  if (detail.PO_ID) await syncParentPOStatus(detail.PO_ID);
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
  await syncParentPOStatus(poId);
}

export async function deletePODetail(id: any) {
  const detail = await (POrderDetail as any).findByPk(id);
  if (!detail) return false;
  const poId = detail.PO_ID;
  await detail.destroy();
  if (poId) await syncParentPOStatus(poId);
  return true;
}

export default {
  getPODetailById,
  getPODetailsByPO,
  listPODetails,
  updatePODetail,
  acceptPODetail,
  refusePODetail,
  updatePODetailStatus,
  deletePODetail,
  syncParentPOStatus,
};

