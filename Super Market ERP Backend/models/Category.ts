import { Sequelize, DataTypes as DT } from "sequelize";

export default (sequelize: Sequelize, DataTypes: typeof DT) => {
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

  (Category as any).associate = (models: any) => {
    Category.hasMany(models.Product, { foreignKey: "CategoryID" });
  };

  return Category;
};
