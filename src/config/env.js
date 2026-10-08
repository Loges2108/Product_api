const path = require("path");
const dotenv = require("dotenv");

const envFile = process.env.ENV_FILE || ".env";

const envPath = path.resolve(process.cwd(), envFile);

const result = dotenv.config({
  path: envPath
});

if (result.error) {
  throw new Error(
    `Unable to load environment file: ${envPath}`
  );
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV,

  APP_ENV: process.env.APP_ENV,

  PORT: Number(process.env.PORT || 5000),

  DB_HOST: process.env.DB_HOST,

  DB_PORT: Number(
    process.env.DB_PORT || 1433
  ),

  DB_NAME: process.env.DB_NAME,

  DB_USER: process.env.DB_USER,

  DB_PASSWORD: process.env.DB_PASSWORD,

  DB_ENCRYPT:
    process.env.DB_ENCRYPT === "true",

  DB_TRUST_SERVER_CERTIFICATE:
    process.env.DB_TRUST_SERVER_CERTIFICATE ===
    "true",

  AWS_REGION:
    process.env.AWS_REGION,

  AWS_S3_BUCKET:
    process.env.AWS_S3_BUCKET,

  S3_PREFIX:
    process.env.S3_PREFIX,

  MAX_FILE_SIZE_MB:
    Number(
      process.env.MAX_FILE_SIZE_MB || 5
    ),

  CORS_ORIGIN:
    process.env.CORS_ORIGIN
};