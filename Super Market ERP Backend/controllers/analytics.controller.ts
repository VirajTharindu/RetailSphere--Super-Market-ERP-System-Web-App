import {
  getOverview,
  getSalesTrend,
  getTopProducts,
  getLowStock,
  getInventoryValuation,
  getTopCustomers,
  getExpiryForecast,
} from "../services/analytics.service.js";

// Overview (totals)
export async function overviewController(req: any, res: any) {
  try {
    const { from, to } = req.query;
    const data = await getOverview({ from, to });
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Sales trend
export async function salesTrendController(req: any, res: any) {
  try {
    const { from, to, period } = req.query;
    const data = await getSalesTrend({ from, to, period });
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Top products
export async function topProductsController(req: any, res: any) {
  try {
    const limit = parseInt(req.query.limit || "10", 10);
    const { from, to } = req.query;
    const data = await getTopProducts({ limit, from, to });
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Low stock
export async function lowStockController(req: any, res: any) {
  try {
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold, 10)
      : null;
    const limit = parseInt(req.query.limit || "50", 10);
    const data = await getLowStock({ threshold, limit });
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Inventory valuation
export async function inventoryValuationController(req: any, res: any) {
  try {
    const data = await getInventoryValuation();
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Top customers
export async function topCustomersController(req: any, res: any) {
  try {
    const limit = parseInt(req.query.limit || "10", 10);
    const { from, to } = req.query;
    const data = await getTopCustomers({ limit, from, to });
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export const expiryForecastController = async (req: any, res: any) => {
  try {
    const { days } = req.query;

    const data = await getExpiryForecast({
      days: days ? parseInt(days, 10) : undefined,
    });

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Health check
export function analyticsHealth(req: any, res: any) {
  res.json({ status: "ok", message: "Analytics service live" });
}

export default {
  overviewController,
  salesTrendController,
  topProductsController,
  lowStockController,
  inventoryValuationController,
  topCustomersController,
  expiryForecastController,
  analyticsHealth,
};
