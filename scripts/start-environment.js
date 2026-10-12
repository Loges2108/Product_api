
"use strict";

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = path.resolve(__dirname, "..");

const supportedEnvironments = ["DEV", "SIT", "UAT"];

const appEnvironment = (
  process.argv[2] ||
  process.env.APP_ENV ||
  "DEV"
).toUpperCase();

if (!supportedEnvironments.includes(appEnvironment)) {
  console.error(
    `Unsupported environment: ${appEnvironment}. Use DEV, SIT, or UAT.`
  );
  process.exit(1);
}

const envFile = process.env.ENV_FILE ||
  path.join(PROJECT_ROOT, `.env.${appEnvironment.toLowerCase()}`);

const resolvedEnvFile = path.resolve(envFile);

if (!fs.existsSync(resolvedEnvFile)) {
  console.error(`Environment file not found: ${resolvedEnvFile}`);
  process.exit(1);
}

process.env.APP_ENV = appEnvironment;
process.env.ENV_FILE = resolvedEnvFile;

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${command} ${args.join(" ")}`);

    const child = spawn(command, args, {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        APP_ENV: appEnvironment,
        ENV_FILE: resolvedEnvFile
      },
      shell: false
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} exited with code ${code}`
          )
        );
      }
    });
  });
}

async function startEnvironment() {
  const node = process.execPath;

  try {
    console.log("");
    console.log("========================================");
    console.log(`Environment: ${appEnvironment}`);
    console.log(`Environment file: ${resolvedEnvFile}`);
    console.log("========================================");

    // 1. Create the database only if it does not exist.
    console.log("\nChecking database...");
    await runCommand(node, [
      path.join(PROJECT_ROOT, "scripts", "create-database.js")
    ]);

    // 2. Apply pending migrations.
    console.log("\nChecking database migrations...");
    await runCommand(node, [
      require.resolve("sequelize-cli/lib/sequelize"),
      "db:migrate"
    ]);

    // 3. Start the API only if both previous steps succeeded.
    console.log("\nStarting API...");
    await runCommand(node, [
      path.join(PROJECT_ROOT, "src", "server.js")
    ]);
  } catch (error) {
    console.error("\nEnvironment startup failed:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

startEnvironment();
