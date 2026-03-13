import {
  getPODetailById,
  updatePODetail,
  listPODetails,
} from "../services/porderDetail.service.js";

/**
 * GET /podetails/:id
 * Fetch a single PO Detail by ID
 */
export async function getPODetailController(req, res) {
  try {
    const { id } = req.params; // PO_ID
    const podList = await listPODetails({ PO_ID: id }); // fetch all PODetails under this PO

    if (!podList || podList.length === 0) {
      return res
        .status(404)
        .json({ message: "No PO Details found for this PO ID" });
    }

    // Optional: sort PODetails by PODetailID ascending
    const sortedPODetails = podList.sort(
      (a, b) => a.PO_DetailID - b.PO_DetailID,
    );

    // Return with PO_ID at the top
    res.status(200).json({
      PO_ID: parseInt(id),
      PODetails: sortedPODetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * PUT /podetails/:id
 * Update writable fields of a PO Detail
 */
export async function updatePODetailController(req, res) {
  try {
    const { id } = req.params; // this is now PO_ID
    const data = req.body; // Expect JSON: { Status, QuantityReceived, CostPriceofPOD, ExpiryDate }
    const result = await updatePODetail(id, data);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

/**
 * GET /podetails
 * List all PO Details, optionally with query filters
 * Example: /podetails?Status=Pending
 */
export async function listPODetailsController(req, res) {
  try {
    const filter = req.query || {};
    const podList = await listPODetails(filter);

    // Group by PO_ID
    const groupedByPO = new Map();
    podList.forEach((pod) => {
      const poId = pod.PO_ID;
      if (!groupedByPO.has(poId)) groupedByPO.set(poId, []);
      groupedByPO.get(poId).push(pod);
    });

    // Optional: Convert to array of objects with PO_ID as key
    const response = Array.from(groupedByPO.entries()).map(
      ([PO_ID, PODetails]) => ({
        PO_ID,
        PODetails,
      }),
    );

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
