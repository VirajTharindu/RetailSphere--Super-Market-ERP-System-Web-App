export default (sequelize, DataTypes) => {
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

  Customer.associate = (models) => {
    Customer.hasMany(models.Sale, { foreignKey: "CustomerID" });
  };

  return Customer;
};
