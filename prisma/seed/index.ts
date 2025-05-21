/* eslint-disable no-console */

import fs from "fs";
import { PrismaClient } from "@prisma/client";

import { log, msToMinutes, optimizeDb } from "./utils";
import { ingestFoodGroups } from "./foodgroups";
import { ingestNodes } from "./nodes";
import { ingestFlows } from "./flows";
import { ingestEdges } from "./edges";
import {
  POSTGRES_CONNECTION_STRING,
  SEED_DATA_PATH,
  IS_DEVELOPMENT,
  CLOVES_FOOD_GROUP,
  INGESTION_MODE,
} from "./config";

const prisma = new PrismaClient();

async function cleanupFlows(prisma: PrismaClient) {
  log("Cleaning up flows...");
  await prisma.$executeRaw`TRUNCATE "Flow" RESTART IDENTITY CASCADE`;
  log("Flows cleanup completed");
}

async function ingestData() {
  const ingestStartTime = Date.now();
  log(`Preparing to seed data to '${POSTGRES_CONNECTION_STRING}'`);
  log(`Running in ingestion mode: ${INGESTION_MODE}`);
  if (IS_DEVELOPMENT) {
    log("Running in development mode - will only ingest cloves data");
  }

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

    // Always clean up flows before any ingestion
    await cleanupFlows(prisma);

    // Infrastructure ingestion (nodes, edges, and food groups)
    if (INGESTION_MODE === "all" || INGESTION_MODE === "infra") {
      log("Ingesting infrastructure data (nodes, edges, and food groups)...");
      await ingestNodes(prisma);
      await ingestEdges(prisma);
      await ingestFoodGroups(prisma);
    }

    // Flows ingestion
    if (
      INGESTION_MODE === "all" ||
      INGESTION_MODE === "flows" ||
      INGESTION_MODE === "cloves"
    ) {
      if (INGESTION_MODE === "cloves" || IS_DEVELOPMENT) {
        const clovesGroup = await prisma.foodGroup.findFirst({
          where: { name: CLOVES_FOOD_GROUP },
        });

        if (!clovesGroup) {
          throw new Error(`Cloves food group not found in database`);
        }

        log("Ingesting cloves flows only...");
        await ingestFlows(prisma, [clovesGroup]);
      } else {
        log("Ingesting all flows...");
        await ingestFlows(prisma);
      }
    }
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
