import { Sequelize, DataTypes as DT } from "sequelize";

export default (sequelize: Sequelize, DataTypes: typeof DT) => {
  const SaleDetail = sequelize.define(
    "SaleDetail",
    {
      SaleDetailID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      SaleID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      BatchID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      ProductID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      Quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      UnitPriceSold: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      SubTotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },

      CostPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      SubTotalCost: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },

      Profit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "tbl_SaleDetail",
      timestamps: false,
    },
  );

  (SaleDetail as any).associate = (models: any) => {
    SaleDetail.belongsTo(models.Sale, { foreignKey: "SaleID" });
    SaleDetail.belongsTo(models.StockBatch, { foreignKey: "BatchID" });
    SaleDetail.belongsTo(models.Product, { foreignKey: "ProductID" });
  };

  return SaleDetail;
};
