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
    if (!["y", "yes"].includes(answer.toLowerCase())) {
      console.log("Database dump aborted.");
      return;
    }
  }

  // Ask if the user wants a production dump
  const isProductionDump = await askQuestion(
    `Is this a dump to transfer data to production? (y/N): `
  );

  let excludeTablesParam = "";
  if (["y", "yes"].includes(isProductionDump.toLowerCase())) {
    excludeTablesParam = `--exclude-table-data 'public."FlowSegmentEdges"'`;
    console.log("Excluding unnecessary tables for production dump.");
  }

  const { execa } = await import("execa");
  try {
    await execa(
      `pg_dump --format=c --no-owner --no-acl --verbose ${excludeTablesParam} -f ${dumpFilePath} ${DATABASE_URL}`,
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
