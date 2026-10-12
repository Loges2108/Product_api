const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const envFile = process.env.ENV_FILE;

if (!envFile) {
  console.error("ENV_FILE is required.");
  process.exit(1);
}

const resolvedEnvFile = path.resolve(envFile);

if (!fs.existsSync(resolvedEnvFile)) {
  console.error(`Environment file not found: ${resolvedEnvFile}`);
  process.exit(1);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      cwd: process.cwd(),
      env: {
        ...process.env,
        ENV_FILE: resolvedEnvFile,
      },
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} failed with exit code ${code}`)
        );
      }
    });
  });
}

async function startEnvironment() {
  try {
    console.log("");
    console.log("========================================");
    console.log(`Environment file: ${resolvedEnvFile}`);
    console.log("========================================");
    console.log("");

    // 1. Create database if missing
    console.log("Checking database...");
    await runCommand("node", ["scripts/create-database.js"]);

    // 2. Run pending migrations
    console.log("");
    console.log("Checking database migrations...");
    await runCommand("npx", ["sequelize-cli", "db:migrate"]);

    // 3. Start API
    console.log("");
    console.log("Starting API...");
    console.log("");

    await runCommand("node", ["src/server.js"]);
  } catch (error) {
    console.error("");
    console.error("Environment startup failed:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

startEnvironment();