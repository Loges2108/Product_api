const { Sequelize } = require("sequelize");

const env = require("../src/config/env");

function validateDatabaseName(name) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(
      `Invalid database name: ${name}`
    );
  }
}

async function createDatabase() {
  validateDatabaseName(env.DB_NAME);

  const sequelize = new Sequelize(
    "master",
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
            env.DB_TRUST_SERVER_CERTIFICATE
        }
      },

      logging: false
    }
  );

  try {
    await sequelize.authenticate();

    console.log(
      `Connected to SQL Server master database.`
    );

    console.log(
      `Environment: ${env.APP_ENV}`
    );

    const [result] = await sequelize.query(
      `
      SELECT DB_ID(:databaseName) AS DatabaseId
      `,
      {
        replacements: {
          databaseName: env.DB_NAME
        }
      }
    );

    if (result[0].DatabaseId) {
      console.log(
        `Database "${env.DB_NAME}" already exists.`
      );
    } else {
      await sequelize.query(
        `CREATE DATABASE [${env.DB_NAME}]`
      );

      console.log(
        `Database "${env.DB_NAME}" created successfully.`
      );
    }
  } catch (error) {
    console.error(
      "Database creation failed:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

createDatabase();