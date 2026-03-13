"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("tbl_Sale", "InvoiceNumber", {
    type: Sequelize.STRING(30),
    allowNull: false,
    unique: true,
  });

  await queryInterface.addColumn("tbl_Sale", "TotalCost", {
    type: Sequelize.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.addColumn("tbl_Sale", "TotalProfit", {
    type: Sequelize.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.addColumn("tbl_Sale", "Status", {
    type: Sequelize.ENUM("COMPLETED", "PENDING", "CANCELLED", "REFUNDED"),
    allowNull: false,
    defaultValue: "COMPLETED",
  });
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("tbl_Sale", "InvoiceNumber");
  await queryInterface.removeColumn("tbl_Sale", "TotalCost");
  await queryInterface.removeColumn("tbl_Sale", "TotalProfit");
  await queryInterface.removeColumn("tbl_Sale", "Status");
}
