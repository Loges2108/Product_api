"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Products", {
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Products");
  }
};