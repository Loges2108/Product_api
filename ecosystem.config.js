module.exports = {
  apps: [
    {
      name: "product-api-dev",

      script:
        "./src/server.js",

      env: {
        ENV_FILE:
          ".env.dev"
      }
    },

    {
      name: "product-api-sit",

      script:
        "./src/server.js",

      env: {
        ENV_FILE:
          ".env.sit"
      }
    },

    {
      name: "product-api-uat",

      script:
        "./src/server.js",

      env: {
        ENV_FILE:
          ".env.uat"
      }
    }
  ]
};