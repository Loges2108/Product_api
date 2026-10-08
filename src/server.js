const express =
  require("express");

const cors =
  require("cors");

const helmet =
  require("helmet");

const env =
  require("./config/env");

const sequelize =
  require("./config/database");

const productRoutes =
  require("./routes/product.routes");

const errorMiddleware =
  require("./middleware/error.middleware");

const app =
  express();

app.use(
  helmet()
);

app.use(
  cors({
    origin:
      env.CORS_ORIGIN,

    credentials: true
  })
);

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.get(
  "/health",
  (req, res) => {
    res.status(200).json({
      success: true,

      environment:
        env.APP_ENV,

      database:
        env.DB_NAME,

      message:
        "API is running."
    });
  }
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "Route not found."
    });
  }
);

app.use(
  errorMiddleware
);

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("");
    console.log(
      "========================================"
    );

    console.log(
      "Database connected successfully"
    );

    console.log(
      `Environment : ${env.APP_ENV}`
    );

    console.log(
      `Database    : ${env.DB_NAME}`
    );

    console.log(
      `Port        : ${env.PORT}`
    );

    console.log(
      "========================================"
    );

    console.log("");

    app.listen(
      env.PORT,
      () => {
        console.log(
          `${env.APP_ENV} API running on port ${env.PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Unable to start server:"
    );

    console.error(
      error
    );

    process.exit(1);
  }
}

startServer();