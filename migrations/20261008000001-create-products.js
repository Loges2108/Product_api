
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [result] = await queryInterface.sequelize.query(`
      SELECT CASE
        WHEN OBJECT_ID(N'dbo.Products', N'U') IS NOT NULL
        THEN 1
        ELSE 0
      END AS TableExists;
    `);

    if (Number(result[0].TableExists) === 1) {
      console.log("dbo.Products already exists. Skipping creation.");
      return;
    }

    console.log("dbo.Products does not exist. Creating table...");

    await queryInterface.createTable(
      { schema: "dbo", tableName: "Products" },
      {
        ProductId: {
          type: Sequelize.BIGINT,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        ProductName: {
          type: Sequelize.STRING(200),
          allowNull: false
        },
        Description: {
          type: Sequelize.STRING(1000),
          allowNull: true
        },
        Price: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: false
        },
        ImageKey: {
          type: Sequelize.STRING(500),
          allowNull: true
        }
      }
    );

    console.log("dbo.Products created successfully.");
  },

  async down(queryInterface) {
    // Do not run this automatically during application startup.
    // A rollback must be an intentional operation.
    await queryInterface.dropTable({
      schema: "dbo",
      tableName: "Products"
    });
  }
};
