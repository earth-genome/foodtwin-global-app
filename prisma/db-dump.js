/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv-flow").config();
const path = require("path");
const fs = require("fs");
const { askQuestion } = require("./utils");

const { DATABASE_URL, DUMP_FILE_PATH } = process.env;
const dumpFilePath = path.resolve(DUMP_FILE_PATH);

const dumpDb = async () => {
  console.log(`Dumping database to ${dumpFilePath}`);
  if (fs.existsSync(dumpFilePath)) {
    const answer = await askQuestion(
      `A dump file already exists. Do you want to overwrite it? (y/N): `
    );
    if (answer !== "yes" && answer !== "y") {
      console.log("Database dump aborted.");
      return;
    }
  }

  const { execa } = await import("execa");
  try {
    await execa(
      `pg_dump --format=c --no-owner --no-acl -f ${dumpFilePath} ${DATABASE_URL}`,
      {
        shell: true,
        stdio: "inherit",
      }
    );
    console.log(`Database dump completed: ${dumpFilePath}`);
  } catch (error) {
    console.error(`Error dumping database: ${error.message}`);
  }
};

dumpDb();
