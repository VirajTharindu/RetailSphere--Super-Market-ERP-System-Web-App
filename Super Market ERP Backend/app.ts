/**
 * OMNI-STORE ERP: APP ENTRY POINT
 **/
import "dotenv/config"; // ← ADD THIS AT THE VERY TOP
import express, { json, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import expressRateLimit from "express-rate-limit";

// --- 📦 IMPORT MODELS ---
import db from "./models/index.js"; // models/index.js exports models and sequelize
const {  sequelize  } = db as any;

// --- 🛣️ IMPORT ROUTES ---
import authRoutes from "./routes/auth.routes.js";
import crmRoutes from "./routes/crm.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import productRoutes from "./routes/product.routes.js";
import stockbatchRoutes from "./routes/stockbatch.routes.js";
import procurementRoutes from "./routes/procurement.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import porderRoutes from "./routes/porderDetail.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

// --- 🛡️ SECURITY LAYER ---
app.use(helmet());
app.use(cors()); // Keep cors()
app.use(
  expressRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

app.use(json());

// --- ROUTES ---
app.get("/", (req: Request, res: Response) => {
  res.send("🚀 SUPERMARKET OMNI-API V6.2 is LIVE");
});

app.use("/api/auth", authRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stockbatch", stockbatchRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/porderdetail", porderRoutes);
app.use("/api/analytics", analyticsRoutes);

// --- ERROR HANDLING ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Global Error Handler:", err);
  res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
});

// --- DATABASE AUTHENTICATION & SYNC ---
sequelize
  .authenticate()
  .then(() => console.log("✅ DB Connection Successful"))
  .catch((err: any) => console.error("❌ DB Connection Failed:", err));

sequelize
  .sync({ force: false }) // Automatically updates schema to match models
  .then(() => {
    console.log("✅ Database synced with Sequelize models");
    app.listen(process.env.PORT || 3000, () =>
      console.log(
        "🚀 SUPERMARKET OMNI-API V6.2 ONLINE on port " +
          (process.env.PORT || 3000),
      ),
    );
  })
  .catch((err: any) => {
    console.error("❌ Failed to sync database:", err);
  });
