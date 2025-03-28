/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv-flow").config();

const fs = require("fs");
const path = require("path");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// load query from file
const query = fs.readFileSync(
  path.resolve(__dirname, "./create-view-area-flows-geometries.sql"),
  "utf-8"
);

// Split the query into individual commands
const commands = query.split(";").filter((cmd: string) => cmd.trim() !== "");

async function main() {
  try {
    for (const command of commands) {
      await prisma.$executeRawUnsafe(command);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
