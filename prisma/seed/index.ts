/* eslint-disable no-console */

import fs from "fs";
import { PrismaClient } from "@prisma/client";

import { log, msToMinutes, optimizeDb } from "./utils";
import { ingestFoodGroups } from "./foodgroups";
import { ingestNodes } from "./nodes";
import { ingestFlows } from "./flows";
import { ingestEdges } from "./edges";
import { POSTGRES_CONNECTION_STRING, SEED_DATA_PATH } from "./config";

const prisma = new PrismaClient();

async function ingestData() {
  const ingestStartTime = Date.now();
  log(`Preparing to seed data to '${POSTGRES_CONNECTION_STRING}'`);

  try {
    if (!SEED_DATA_PATH) {
      console.error(
        "SEED_DATA_PATH not defined. Please refer to the README for more information."
      );
      return;
    }

    if (!fs.existsSync(SEED_DATA_PATH)) {
      console.error(
        `Path ${SEED_DATA_PATH} was not found, a valid path must be defined to the SEED_DATA_PATH environment variable. Please refer to the README for more information.`
      );
      return;
    }

    await optimizeDb(prisma);
    await ingestNodes(prisma);
    await ingestEdges(prisma);
    await ingestFoodGroups(prisma);
    await ingestFlows(prisma);

    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW "EdgeFlowAggregation"`;
    log("Refreshed materialized view.");

    await prisma.$executeRaw`VACUUM FULL ANALYZE`;
    log("Vacuumed database.");
  } catch (error) {
    console.error("Error ingesting data:", error);
  } finally {
    log(
      `Data ingestion completed in ${msToMinutes(Date.now() - ingestStartTime)} minutes.`
    );
    await prisma.$disconnect();
  }
}

ingestData();
