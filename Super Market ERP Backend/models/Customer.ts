import { Sequelize, DataTypes as DT } from "sequelize";

export default (sequelize: Sequelize, DataTypes: typeof DT) => {
  const Customer = sequelize.define(
    "Customer",
    {
      CustomerID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      FirstName: DataTypes.STRING(50),
      LastName: DataTypes.STRING(50),
      Phone: { type: DataTypes.STRING(15), unique: true },
      LoyaltyPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: "tbl_Customer",
      timestamps: false,
    },
  );

  (Customer as any).associate = (models: any) => {
    Customer.hasMany(models.Sale, { foreignKey: "CustomerID" });
  };

  return Customer;
};
