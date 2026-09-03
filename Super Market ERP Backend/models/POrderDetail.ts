import { Sequelize, DataTypes as DT, Model } from "sequelize";

export default (sequelize: Sequelize, DataTypes: typeof DT) => {
  const POrderDetail = sequelize.define(
    "POrderDetail",
    {
      PO_DetailID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      PO_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      ProductID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      QuantityRequested: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },

      QuantityReceived: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          isLessThanRequested(this: any, value: number) {
            if (value > this.QuantityRequested) {
              throw new Error(
                "QuantityReceived cannot exceed QuantityRequested",
              );
            }
          },
        },
      },

      Status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "Pending",
        validate: {
          isIn: [
            [
              "Pending",
              "PartiallyReceived",
              "Received",
              "Cancelled",
              "Refused",
              "Added",
            ],
          ],
        },
      },

      CostPriceofPOD: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0.0,
        },
      },

      ExpiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },

    {
      tableName: "tbl_PO_Detail",
      timestamps: false,
    },
  );

  (POrderDetail as any).associate = (models: any) => {
    POrderDetail.belongsTo(models.PurchaseOrder, { foreignKey: "PO_ID" });
    POrderDetail.belongsTo(models.Product, { foreignKey: "ProductID" });
  };

  return POrderDetail;
};
