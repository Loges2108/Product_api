const {
  spawn
} = require("child_process");

const envFile = process.env.ENV_FILE;

if (!envFile) {
  console.error(
    "ENV_FILE is required."
  );

  process.exit(1);
}

function runCommand(
  command,
  args
) {
  return new Promise(
    (resolve, reject) => {
      const child = spawn(
        command,
        args,
        {
          stdio: "inherit",

          shell: true,

          env: {
            ...process.env,

            ENV_FILE: envFile
          }
        }
      );

      child.on(
        "close",
        (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(
              new Error(
                `${command} failed with exit code ${code}`
              )
            );
          }
        }
      );
    }
  );
}

async function startEnvironment() {
  try {
    console.log("");
    console.log(
      "========================================"
    );

    console.log(
      `Environment: ${envFile}`
    );

    console.log(
      "========================================"
    );

    console.log("");

    // ------------------------------------------------
    // 1. Create database if it does not exist
    // ------------------------------------------------

    console.log(
      "Checking database..."
    );

    await runCommand(
      process.platform === "win32"
        ? "node"
        : "node",
      [
        "scripts/create-database.js"
      ]
    );

    // ------------------------------------------------
    // 2. Run pending migrations
    // ------------------------------------------------

    console.log("");

    console.log(
      "Checking database migrations..."
    );

    await runCommand(
      process.platform === "win32"
        ? "npx"
        : "npx",
      [
        "sequelize-cli",
        "db:migrate"
      ]
    );

    // ------------------------------------------------
    // 3. Start API
    // ------------------------------------------------

    console.log("");

    console.log(
      "Starting API..."
    );

    console.log("");

    await runCommand(
      "node",
      [
        "src/server.js"
      ]
    );

  } catch (error) {
    console.error("");

    console.error(
      "Environment startup failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
}

startEnvironment();