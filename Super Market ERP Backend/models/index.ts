import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

import defineUser from "./User.js";
import defineCategory from "./Category.js";
import defineSupplier from "./Supplier.js";
import defineCustomer from "./Customer.js";
import defineProduct from "./Product.js";
import defineStockBatch from "./StockBatch.js";
import definePurchaseOrder from "./PurchaseOrder.js";
import definePOrderDetail from "./POrderDetail.js";
import defineSale from "./Sale.js";
import defineSaleDetail from "./SaleDetail.js";

const User = defineUser(sequelize, DataTypes);
const Category = defineCategory(sequelize, DataTypes);
const Supplier = defineSupplier(sequelize, DataTypes);
const Customer = defineCustomer(sequelize, DataTypes);
const Product = defineProduct(sequelize, DataTypes);
const StockBatch = defineStockBatch(sequelize, DataTypes);
const PurchaseOrder = definePurchaseOrder(sequelize, DataTypes);
const POrderDetail = definePOrderDetail(sequelize, DataTypes);
const Sale = defineSale(sequelize, DataTypes);
const SaleDetail = defineSaleDetail(sequelize, DataTypes);

const models: Record<string, any> = {
  User,
  Category,
  Supplier,
  Customer,
  Product,
  StockBatch,
  PurchaseOrder,
  POrderDetail,
  Sale,
  SaleDetail,
};

Object.keys(models).forEach((name) => {
  if (typeof models[name].associate === "function") {
    models[name].associate(models);
  }
});

export default { ...models, sequelize, DataTypes };
