import { Sequelize, DataTypes as DT } from "sequelize";

export default (sequelize: Sequelize, DataTypes: typeof DT) => {
  const Supplier = sequelize.define(
    "Supplier",
    {
      SupplierID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      SupplierName: { type: DataTypes.STRING(100), allowNull: false },
      ContactNumber: { type: DataTypes.STRING(20), allowNull: false },
    },
    {
      tableName: "tbl_Supplier",
      timestamps: false,
    },
  );

  (Supplier as any).associate = (models: any) => {
    Supplier.hasMany(models.StockBatch, { foreignKey: "SupplierID" });
    Supplier.hasMany(models.PurchaseOrder, { foreignKey: "SupplierID" });
  };

  return Supplier;
};
