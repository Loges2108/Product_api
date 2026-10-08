const env = require("./env");

module.exports = {
  development: {
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,

    dialect: "mssql",

    dialectOptions: {
      options: {
        encrypt: env.DB_ENCRYPT,

        trustServerCertificate:
          env.DB_TRUST_SERVER_CERTIFICATE
      }
    },

    logging: false
  },

  test: {
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,

    dialect: "mssql",

    dialectOptions: {
      options: {
        encrypt: env.DB_ENCRYPT,

        trustServerCertificate:
          env.DB_TRUST_SERVER_CERTIFICATE
      }
    },

    logging: false
  },

  production: {
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,

    dialect: "mssql",

    dialectOptions: {
      options: {
        encrypt: env.DB_ENCRYPT,

        trustServerCertificate:
          env.DB_TRUST_SERVER_CERTIFICATE
      }
    },

    logging: false
  }
};