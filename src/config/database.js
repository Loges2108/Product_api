const { Sequelize } = require("sequelize");

const env = require("./env");

const sequelize = new Sequelize(
  env.DB_NAME,
  env.DB_USER,
  env.DB_PASSWORD,
  {
    host: env.DB_HOST,

    port: env.DB_PORT,

    dialect: "mssql",

    dialectModule: require("tedious"),

    dialectOptions: {
      options: {
        encrypt: env.DB_ENCRYPT,

        trustServerCertificate:
          env.DB_TRUST_SERVER_CERTIFICATE,

        requestTimeout: 60000
      }
    },

    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;