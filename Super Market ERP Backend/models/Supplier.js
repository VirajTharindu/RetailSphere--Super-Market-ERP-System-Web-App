export default (sequelize, DataTypes) => {
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

  Supplier.associate = (models) => {
    Supplier.hasMany(models.StockBatch, { foreignKey: "SupplierID" });
    Supplier.hasMany(models.PurchaseOrder, { foreignKey: "SupplierID" });
  };

  return Supplier;
};
