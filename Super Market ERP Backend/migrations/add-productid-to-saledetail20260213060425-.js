"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("tbl_SaleDetail", "ProductID", {
    type: Sequelize.INTEGER,
    allowNull: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("tbl_SaleDetail", "ProductID");
}
