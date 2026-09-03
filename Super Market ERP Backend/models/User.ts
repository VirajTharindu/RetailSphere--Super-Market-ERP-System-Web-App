import { Sequelize, DataTypes as DT } from "sequelize";

export default (sequelize: Sequelize, DataTypes: typeof DT) => {
  const User = sequelize.define(
    "User",
    {
      UserID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
      PasswordHash: DataTypes.STRING(255),
      FullName: DataTypes.STRING(100),
      UserRole: DataTypes.ENUM("Admin", "Staff", "Manager"),
      IsMasterAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "tbl_User",
      timestamps: false,
    },
  );

  (User as any).associate = (models: any) => {
    User.hasMany(models.Sale, { foreignKey: "UserID" });
  };

  return User;
};
