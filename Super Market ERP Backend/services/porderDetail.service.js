import db from "../models/index.js";
const { POrderDetail, PurchaseOrder } = db;

/**
 * Fetch PO Detail by ID
 */
export async function getPODetailById(id) {
  const pod = await POrderDetail.findByPk(id);
  if (!pod) throw new Error("PO Detail not found");
  return pod;
}

/**
 * Update only writable fields for PO Detail
 * Writable fields: Status, QuantityReceived, CostPriceofPOD, ExpiryDate
 */
export async function updatePODetail(poId, data) {
  // Fetch all PO Details under the PO
  const poDetails = await POrderDetail.findAll({
    where: { PO_ID: poId },
    include: [PurchaseOrder],
  });

  if (!poDetails || poDetails.length === 0) {
    throw new Error("No PO Details found for this PO ID");
  }
  // Update each PODetail
  for (const pod of poDetails) {
    const writableFields = [
      "Status",
      "QuantityReceived",
      "CostPriceofPOD",
      "ExpiryDate",
    ];
    writableFields.forEach((field) => {
      if (data[field] !== undefined) pod[field] = data[field];
    });

    // Ensure QuantityReceived does not exceed QuantityRequested
    if (pod.QuantityReceived > pod.QuantityRequested) {
      throw new Error(
        `QuantityReceived (${pod.QuantityReceived}) cannot exceed QuantityRequested (${pod.QuantityRequested}) for ProductID ${pod.ProductID}`,
      );
    }

    // Adjust Status automatically based on QuantityReceived
    // If explicitly refused OR meets refused condition
    // STRICT RULE: Explicitly setting Refused

    // 0️⃣ PROTECT: Cancelled or Refused are immutable for DATA changes,
    // but we must allow the status assignment logic to be idempotent.

    if (
      (pod.Status === "Cancelled" || pod.Status === "Refused") &&
      data.Status !== pod.Status
    ) {
      // If the user is trying to change a Cancelled record to something ELSE (like Pending), BLOCK IT.
      throw new Error(
        `Cannot modify PO Detail: Status is '${pod.Status}' and it is locked.`,
      );
    }

    // 1️⃣ EXPLICITLY SETTING CANCELLED
    if (data.Status === "Cancelled") {
      if (pod.Status === "Cancelled") {
        // Already cancelled, do nothing, continue to next POD
      } else if (
        ["Pending", "PartiallyReceived", "Received"].includes(pod.Status)
      ) {
        pod.Status = "Cancelled";
        pod.QuantityReceived = 0;
        pod.CostPriceofPOD = 0;
        pod.ExpiryDate = null;

        // SAVE IMMEDIATELY
        await pod.save();
      } else {
        throw new Error(
          `Cannot cancel this PO Detail: Only Pending, PartiallyReceived, or Received can be cancelled. Current status is ${pod.Status}`,
        );
      }
    }

    // 🚫 FORBID EXPLICIT "Added"
    if (data.Status === "Added") {
      throw new Error(
        "Status 'Added' cannot be set manually. It is only allowed via StockBatch creation.",
      );
    }

    // 1️⃣ STRICT RULE: Explicitly setting Refused
    if (data.Status === "Refused") {
      if (
        pod.QuantityReceived !== 0 ||
        Number(pod.CostPriceofPOD) !== 0 ||
        pod.ExpiryDate !== null
      ) {
        throw new Error(
          "Status 'Refused' is only allowed when QuantityReceived = 0, CostPriceofPOD = 0, and ExpiryDate = null.",
        );
      }
      pod.Status = "Refused";
    }

    // 2️⃣ EXPLICITLY SETTING PENDING
    if (data.Status === "Pending") {
      pod.QuantityReceived = 0;
      pod.CostPriceofPOD = 0;
      pod.ExpiryDate = null;
      pod.Status = "Pending";
    }

    // 3️⃣ AUTO STATUS LOGIC (always evaluate, but never assign Added)
    if (pod.Status !== "Cancelled" && pod.Status !== "Refused") {
      if (
        pod.QuantityReceived === 0 &&
        Number(pod.CostPriceofPOD) === 0 &&
        pod.ExpiryDate === null
      ) {
        pod.Status = "Pending";
      } else if (
        pod.QuantityReceived > 0 &&
        pod.QuantityReceived < pod.QuantityRequested
      ) {
        pod.Status = "PartiallyReceived";
      } else if (pod.QuantityReceived === pod.QuantityRequested) {
        pod.Status = "Received";
      } else if (pod.QuantityReceived === 0) {
        throw new Error(
          "Cannot set QuantityReceived = 0 unless the item is Pending or Refused.",
        );
      }
    }

    await pod.save();
  }

  // Now, update the PO status based on all details
  const po = poDetails[0].PurchaseOrder;
  const statuses = poDetails.map((d) => d.Status);

  // All Cancelled
  if (statuses.every((s) => s === "Cancelled")) {
    po.Status = "Cancelled";
  }

  // All Refused
  else if (statuses.every((s) => s === "Refused")) {
    po.Status = "Refused";
  }

  // All Received
  else if (statuses.every((s) => s === "Received")) {
    po.Status = "Received";
  }

  // Any PartiallyReceived
  else if (statuses.some((s) => s === "PartiallyReceived")) {
    po.Status = "PartiallyReceived";
  }

  // Mixed Received + Refused
  else if (statuses.includes("Received") && statuses.includes("Refused")) {
    po.Status = "PartiallyReceived";
  }

  // All Pending
  else if (statuses.every((s) => s === "Pending")) {
    po.Status = "Pending";
  }

  // Default mixed fallback
  else {
    po.Status = "PartiallyReceived";
  }

  await po.save();

  return { updatedPO: po, updatedPODetails: poDetails };
}

/**
 * List PO Details optionally filtered
 */
export async function listPODetails(filter = {}) {
  return await POrderDetail.findAll({
    where: filter,
    order: [
      ["PO_ID", "DESC"],
      ["PO_DetailID", "DESC"],
    ],
    // first sort by PO_ID, then by PO_DetailID within each PO
  });
}

export default {
  getPODetailById,
  updatePODetail,
  listPODetails,
};
