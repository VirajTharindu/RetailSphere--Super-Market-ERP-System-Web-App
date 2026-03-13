import SalesService from "../services/sales.service.js";

/**
 * ==========================================
 * SALES CONTROLLER METHODS
 * ==========================================
 */

// Health Check
export function healthCheck(req, res) {
  res.json({ status: "ok", message: "Sales service live 🚀" });
}

// Create Sale
export async function createSaleController(req, res) {
  try {
    const result = await SalesService.processSale(req.body, req.user); // ← pass logged-in user);

    const { sale, reorderResults } = result;

    res.status(201).json({
      success: true,
      saleId: sale.SaleID,
      saleDate: sale.SaleDate,
      invoiceNumber: sale.InvoiceNumber,
      customerId: sale.CustomerID,
      userId: sale.UserID,
      totalAmount: sale.TotalAmount,
      totalCost: sale.TotalCost,
      totalProfit: sale.TotalProfit,
      paymentMethod: sale.PaymentMethod,
      status: sale.Status,

      reorderResults,
      message: `Sale transaction finalized successfully with invoice #${sale.InvoiceNumber} and ID ${sale.SaleID}`,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
}

// Get All Sales
export async function getAllSalesController(req, res) {
  try {
    const sales = await SalesService.getAllSales();

    if (!sales.data || sales.data.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No sales records found",
        ...sales,
      });
    }
    res.status(200).json({ success: true, ...sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get Sale By ID
export async function getSaleByIdController(req, res) {
  try {
    const { id } = req.params;

    const sale = await SalesService.getSaleById(id);

    if (!sale) {
      return res.status(404).json({ success: false, error: "Sale not found" });
    }

    res.status(200).json({ success: true, sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Update Sale (Header / Metadata ONLY)
export async function updateSaleController(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const sale = await SalesService.updateSale(id, updateData);

    if (!sale) {
      return res.status(404).json({ success: false, error: "Sale not found" });
    }

    res.status(200).json({
      success: true,
      message: "Sale header updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Cancel Sale (Soft Delete)
export async function deleteSaleController(req, res) {
  try {
    const { id } = req.params;

    const sale = await SalesService.cancelSale(id);

    if (!sale) {
      return res.status(404).json({ success: false, error: "Sale not found" });
    }

    res.status(200).json({
      success: true,
      message: "Sale cancelled successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
