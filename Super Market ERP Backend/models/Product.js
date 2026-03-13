export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      ProductID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ProductName: { type: DataTypes.STRING(100), allowNull: false },
      CategoryID: DataTypes.INTEGER,
      ReorderLevel: { type: DataTypes.INTEGER, defaultValue: 10 },
      UnitPrice: DataTypes.DECIMAL(10, 2),
    },
    {
      tableName: "tbl_Product",
      timestamps: false,
    },
  );

  Product.associate = (models) => {
    Product.belongsTo(models.Category, { foreignKey: "CategoryID" });
    Product.hasMany(models.StockBatch, { foreignKey: "ProductID" });
  };

  return Product;
};
