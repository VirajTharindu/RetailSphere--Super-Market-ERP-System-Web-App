export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("tbl_SaleDetail", "CostPrice", {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  });

  await queryInterface.addColumn("tbl_SaleDetail", "SubTotalCost", {
    type: Sequelize.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.addColumn("tbl_SaleDetail", "Profit", {
    type: Sequelize.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("tbl_SaleDetail", "CostPrice");
  await queryInterface.removeColumn("tbl_SaleDetail", "SubTotalCost");
  await queryInterface.removeColumn("tbl_SaleDetail", "Profit");
}
