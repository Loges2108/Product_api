module.exports = {
  apps: [
    {
      name: "product-api-dev",
      script: "./src/server.js",
      instances: 1,
      autorestart: true,
      env: {
        APP_ENV: "DEV",
        NODE_ENV: "production",
        PORT: 5001,
        ENV_FILE: "/var/www/product-api/.env.dev"
      }
    },
    {
      name: "product-api-sit",
      script: "./src/server.js",
      instances: 1,
      autorestart: true,
      env: {
        APP_ENV: "SIT",
        NODE_ENV: "production",
        PORT: 5002,
        ENV_FILE: "/var/www/product-api/.env.sit"
      }
    },
    {
      name: "product-api-uat",
      script: "./src/server.js",
      instances: 1,
      autorestart: true,
      env: {
        APP_ENV: "UAT",
        NODE_ENV: "production",
        PORT: 5003,
        ENV_FILE: "/var/www/product-api/.env.uat"
      }
    }
  ]
};