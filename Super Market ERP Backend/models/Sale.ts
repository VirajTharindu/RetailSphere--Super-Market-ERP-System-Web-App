import { Sequelize, DataTypes as DT } from "sequelize";

export default (sequelize: Sequelize, DataTypes: typeof DT) => {
  const Sale = sequelize.define(
    "Sale",
    {
      SaleID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      InvoiceNumber: {
        type: DataTypes.STRING(30),
        unique: true,
        allowNull: false,
      },

      SaleDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      CustomerID: { type: DataTypes.STRING(100), allowNull: true },

      UserID: { type: DataTypes.INTEGER, allowNull: false },

      TotalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
      },

      TotalCost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
      },

      TotalProfit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
      },

      PaymentMethod: {
        type: DataTypes.ENUM("CASH", "CARD"),
        allowNull: false,
        defaultValue: "CASH",
      },

      Status: {
        type: DataTypes.ENUM("COMPLETED", "PENDING", "CANCELLED", "REFUNDED"),
        allowNull: false,
        defaultValue: "COMPLETED",
      },
    },
    {
      tableName: "tbl_Sale",
      timestamps: false,
    },
  );

  (Sale as any).associate = (models: any) => {
    Sale.belongsTo(models.Customer, { foreignKey: "CustomerID" });
    Sale.belongsTo(models.User, { foreignKey: "UserID" });
    Sale.hasMany(models.SaleDetail, { foreignKey: "SaleID" });
  };

  return Sale;
};
