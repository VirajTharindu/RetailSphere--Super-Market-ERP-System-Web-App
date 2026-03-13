export default (sequelize, DataTypes) => {
  const StockBatch = sequelize.define(
    "StockBatch",
    {
      BatchID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ProductID: DataTypes.INTEGER,
      SupplierID: DataTypes.INTEGER,
      QuantityOnHand: { type: DataTypes.INTEGER, allowNull: false },
      CostPrice: DataTypes.DECIMAL(10, 2),
      ExpiryDate: DataTypes.DATE,
      POrderDetailID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "tbl_StockBatch",
      timestamps: false,
    },
  );

  StockBatch.associate = (models) => {
    StockBatch.belongsTo(models.Product, { foreignKey: "ProductID" });
    StockBatch.belongsTo(models.Supplier, { foreignKey: "SupplierID" });
    StockBatch.hasMany(models.SaleDetail, { foreignKey: "BatchID" });
    StockBatch.belongsTo(models.POrderDetail, {
      foreignKey: "POrderDetailID",
      targetKey: "PO_DetailID",
    });
  };

  return StockBatch;
};
