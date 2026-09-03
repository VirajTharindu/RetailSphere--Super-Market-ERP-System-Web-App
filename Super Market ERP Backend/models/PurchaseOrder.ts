import { Sequelize, DataTypes as DT } from "sequelize";

export default (sequelize: Sequelize, DataTypes: typeof DT) => {
  const PurchaseOrder = sequelize.define(
    "PurchaseOrder",
    {
      PO_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      OrderDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      Status: {
        type: DataTypes.ENUM(
          "Pending",
          "PartiallyReceived",
          "Received",
          "Cancelled",
          "Refused",
          "Added",
        ),
        defaultValue: "Pending",
      },
      SupplierID: DataTypes.INTEGER,
    },
    {
      tableName: "tbl_PurchaseOrder",
      timestamps: false,
    },
  );

  (PurchaseOrder as any).associate = (models: any) => {
    PurchaseOrder.belongsTo(models.Supplier, { foreignKey: "SupplierID" });
    PurchaseOrder.hasMany(models.POrderDetail, { foreignKey: "PO_ID" });
  };

  return PurchaseOrder;
};
