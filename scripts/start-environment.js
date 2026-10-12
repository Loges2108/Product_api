const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const supportedEnvironments = ["DEV", "SIT", "UAT"];
const appEnvironment = (
  process.argv[2] || process.env.APP_ENV || "DEV"
).toUpperCase();

if (!supportedEnvironments.includes(appEnvironment)) {
  console.error(
    `Unsupported environment: ${appEnvironment}. Use DEV, SIT, or UAT.`
  );
  process.exit(1);
}

const envFile =
  process.env.ENV_FILE || `.env.${appEnvironment.toLowerCase()}`;
const resolvedEnvFile = path.resolve(envFile);

if (!fs.existsSync(resolvedEnvFile)) {
  console.error(`Environment file not found: ${resolvedEnvFile}`);
  process.exit(1);
}

process.env.APP_ENV = appEnvironment;
process.env.ENV_FILE = resolvedEnvFile;

function runCommand(command, args, shell = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell,
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
    console.log(`Environment: ${appEnvironment}`);
    console.log(`Environment file: ${resolvedEnvFile}`);
    console.log("========================================");
    console.log("");

    // 1. Create database if missing
    console.log("Checking database...");
    await runCommand("node", ["scripts/create-database.js"]);

    // 2. Run pending migrations
    console.log("");
    console.log("Checking database migrations...");
    const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
    await runCommand(
      npxCommand,
      ["sequelize-cli", "db:migrate"],
      process.platform === "win32"
    );

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