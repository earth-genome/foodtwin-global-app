/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv-flow").config();
const path = require("path");
const fs = require("fs");
const { askQuestion } = require("./utils");

const { DATABASE_URL, DUMP_FILE_PATH } = process.env;
const dumpFilePath = path.resolve(DUMP_FILE_PATH);

const restoreDb = async () => {
  const { execa } = await import("execa");

  if (!fs.existsSync(dumpFilePath)) {
    console.error(`Dump file ${dumpFilePath} does not exist.`);
    return;
  }

  console.log(
    `Preparing to restore dump file '${dumpFilePath}' to '${DATABASE_URL}'`
  );

  const answer = await askQuestion(
    `Are you sure you want to reset and restore the database? This will delete all existing data. (y/N): `
  );
  if (answer !== "yes" && answer !== "y") {
    console.log("Database restore aborted.");
    return;
  }

  try {
    console.log("Restoring database from dump file...");
    await execa(`pg_restore --clean -d ${DATABASE_URL} ${dumpFilePath}`, {
      shell: true,
    });
    console.log(`Database restore completed from ${dumpFilePath}`);
  } catch (error) {
    console.error(`Error restoring database: ${error.message}`);
  }
};

restoreDb();
