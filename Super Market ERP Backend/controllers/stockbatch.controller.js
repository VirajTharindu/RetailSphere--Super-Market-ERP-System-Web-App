import InventoryService from "../services/inventory.service.js";

/* =========================================================
   HEALTH
========================================================= */
export function healthCheck(req, res) {
  res.json({
    status: "ok",
    message: "StockBatch service live 🚀",
  });
}

/* =========================================================
   CREATE (STOCK IN)
========================================================= */
export async function createStockBatchController(req, res) {
  try {
    const batch = await InventoryService.createBatch(req.body);
    res.status(201).json({
      success: true,
      message: `Stock batch created successfully with stock batch ID ${batch.BatchID} `,
      batch,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   READ
========================================================= */
export async function getAllStockBatchesController(req, res) {
  try {
    const batches = await InventoryService.getAllBatches();
    res.status(200).json({
      success: true,
      message: `All ${batches.length} batches fetched successfully `,
      batches,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStockBatchByIdController(req, res) {
  try {
    const { id } = req.params;
    const batch = await InventoryService.getBatchById(id);
    res.json({ success: true, batch });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
}

/* =========================================================
   PRODUCT STOCK SUMMARY
========================================================= */
export async function getTotalStockController(req, res) {
  try {
    const { productId } = req.params;
    const totalStock = await InventoryService.getTotalStock(productId);

    res.status(200).json({
      success: true,
      message: "Total stock fetched successfully",
      productId,
      totalStock,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getSellableBatchesController(req, res) {
  try {
    const { productId } = req.params;
    const sellableBatches =
      await InventoryService.getSellableBatches(productId);
    res.status(200).json({
      success: true,
      message: `All ${sellableBatches.length} sellable  batches fetched successfully `,
      sellableBatches,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   UPDATE (METADATA ONLY)
========================================================= */
export async function updateStockBatchController(req, res) {
  try {
    const { id } = req.params;
    const updatedBatch = await InventoryService.updateBatch(id, req.body);
    res.status(200).json({
      success: true,
      message: `Stock batch updated`,
      batch: updatedBatch,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   DELETE (ONLY EMPTY BATCHES)
========================================================= */
export async function deleteStockBatchController(req, res) {
  try {
    const { id } = req.params;
    await InventoryService.deleteBatch(id);
    res.status(200).json({
      success: true,
      message: `Empty stock batch deleted successfully with ID ${id} `,
      batchId: id,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   STOCK OUT (SALES / ISSUE)
========================================================= */
export async function reduceStockController(req, res) {
  try {
    // :id = StockBatchID
    const { id } = req.params;

    // quantity belongs in body
    const { quantity } = req.body;

    const batch = await InventoryService.reduceStock({ batchId: id, quantity });
    res.status(200).json({
      success: true,
      message: `${quantity} amount of stock reduced successfully with stock batch ID ${id}. now the stock batch is ${batch.QuantityOnHand}`,
      batch,
      reducedQuantity: quantity,
      remainedQuantity: batch.QuantityOnHand,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   MANUAL REORDER CHECK
========================================================= */
export async function checkReorderController(req, res) {
  try {
    const { productId } = req.params;

    const result = await InventoryService.checkReorder(productId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
}

export async function getExpiringBatchesController(req, res) {
  try {
    const batches = await InventoryService.getExpiringBatches();
    res.status(200).json({
      success: true,
      message: `All ${batches.length} expiring batches fetched successfully `,
      batches,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function issueStockByProductController(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const batches = await InventoryService.issueStockByProduct({
      productId,
      quantity,
    });
    res.status(200).json({
      success: true,
      message: `Stock quantity issued successfully with ID ${productId}. Issued quantity is ${quantity} from batch/es . Now the stock amount is ${batches.QuantityOnHand} from batch/es`,
      quantityIssued: quantity,
      remainedQuantity: batches.QuantityOnHand,
      batches: batches,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
