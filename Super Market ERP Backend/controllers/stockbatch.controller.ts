import InventoryService from "../services/inventory.service.js";

/* =========================================================
   HEALTH
========================================================= */
export function healthCheck(req: any, res: any) {
  res.json({
    status: "ok",
    message: "StockBatch service live 🚀",
  });
}

/* =========================================================
   CREATE (STOCK IN)
========================================================= */
export async function createStockBatchController(req: any, res: any) {
  try {
    const batch = await InventoryService.createBatch(req.body);
    res.status(201).json({
      success: true,
      message: `Stock batch created successfully with stock batch ID ${batch.BatchID} `,
      stockBatch: batch, // FE uses stockBatch key in some places
      batch,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   READ
========================================================= */
export async function getAllStockBatchesController(req: any, res: any) {
  try {
    const batches = await InventoryService.getAllBatches();
    res.status(200).json({
      success: true,
      message: `All ${batches.length} batches fetched successfully `,
      batches,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStockBatchByIdController(req: any, res: any) {
  try {
    const { id } = req.params;
    const batch = await InventoryService.getBatchById(id);
    res.json({ 
      success: true, 
      stockBatch: batch, // FE expects stockBatch
      batch 
    });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
}

/* =========================================================
   PRODUCT STOCK SUMMARY
========================================================= */
export async function getTotalStockController(req: any, res: any) {
  try {
    const { productId } = req.params;
    const totalStock = await InventoryService.getTotalStock(productId);

    res.status(200).json({
      success: true,
      message: "Total stock fetched successfully",
      productId,
      totalStock,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getSellableBatchesController(req: any, res: any) {
  try {
    const { productId } = req.params;
    const batches = await InventoryService.getSellableBatches(productId);
    res.status(200).json({
      success: true,
      message: `All ${batches.length} sellable batches fetched successfully `,
      batches, // FE expects batches
      sellableBatches: batches,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   UPDATE (METADATA ONLY)
======================================================== */
export async function updateStockBatchController(req: any, res: any) {
  try {
    const { id } = req.params;
    const updatedBatch = await InventoryService.updateBatch(id, req.body);
    res.status(200).json({
      success: true,
      message: `Stock batch updated`,
      stockBatch: updatedBatch, // FE expects stockBatch
      batch: updatedBatch,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   DELETE (ONLY EMPTY BATCHES)
========================================================= */
export async function deleteStockBatchController(req: any, res: any) {
  try {
    const { id } = req.params;
    await InventoryService.deleteBatch(id);
    res.status(200).json({
      success: true,
      message: `Empty stock batch deleted successfully with ID ${id} `,
      batchId: id,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   STOCK OUT (SALES / ISSUE)
========================================================= */
export async function reduceStockController(req: any, res: any) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const batch = await InventoryService.reduceStock({ batchId: id, quantity });
    res.status(200).json({
      success: true,
      message: `${quantity} amount of stock reduced successfully`,
      batch,
      reducedQuantity: quantity,
      remainedQuantity: (batch as any).QuantityOnHand,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* =========================================================
   MANUAL REORDER CHECK
========================================================= */
export async function checkReorderController(req: any, res: any) {
  try {
    const { productId } = req.params;
    const result = await InventoryService.checkReorder(productId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getExpiringBatchesController(req: any, res: any) {
  try {
    const batches = await InventoryService.getExpiringBatches();
    res.status(200).json({
      success: true,
      message: `All ${batches.length} expiring batches fetched successfully `,
      batches,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function issueStockByProductController(req: any, res: any) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const batches = await InventoryService.issueStockByProduct({
      productId,
      quantity,
    });
    res.status(200).json({
      success: true,
      message: `Stock quantity issued successfully`,
      quantityIssued: quantity,
      remainedQuantity: (batches as any)?.[0]?.QuantityOnHand ?? 0,
      batches: batches,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}
