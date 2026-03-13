export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      CategoryID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      CategoryName: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      Description: DataTypes.TEXT,
    },
    {
      tableName: "tbl_Category",
      timestamps: false,
    },
  );

  Category.associate = (models) => {
    Category.hasMany(models.Product, { foreignKey: "CategoryID" });
  };

  return Category;
};
