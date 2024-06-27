/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SEED_DATA_PATH = process.env.SEED_DATA_PATH as string;
const ADMIN_CENTROIDS_PATH = path.join(SEED_DATA_PATH, "admin_centroids.gpkg");
const ADMIN_LIMITS_PATH = path.join(SEED_DATA_PATH, "admin_polygons.gpkg");
const POSTGRES_CONNECTION_STRING = process.env.DATABASE_URL;

async function ingestData() {
  try {
    // Check if data path is defined
    if (!fs.existsSync(SEED_DATA_PATH)) {
      console.error(
        "Data path not found, you must define the SEED_DATA_PATH. Please refer to the README for more information."
      );
      return;
    }

    // Truncate all tables
    await prisma.$executeRaw`TRUNCATE "Area" RESTART IDENTITY CASCADE`;

    // Check if admin centroids file exists
    if (!fs.existsSync(ADMIN_CENTROIDS_PATH)) {
      console.error("Admin centroids file not found.");
      return;
    } else {
      console.log("Ingesting area centroids...");
    }

    await runOgr2Ogr(
      ADMIN_CENTROIDS_PATH,
      '-nln Area -append -nlt POINT -lco GEOMETRY_NAME=centroid -sql "SELECT ID as id, admin_name as name, geom AS centroid FROM admin_centroids"'
    );

    // Check if admin limits file exists
    if (!fs.existsSync(ADMIN_LIMITS_PATH)) {
      console.error("Admin limits file not found.");
      return;
    } else {
      console.log("Ingesting area limits...");
    }

    await runOgr2Ogr(
      ADMIN_LIMITS_PATH,
      '-nln Area_limits -overwrite -nlt MULTIPOLYGON -lco GEOMETRY_NAME=limits -sql "SELECT ID as id, geom as limits FROM admin_polygons"'
    );

    await prisma.$executeRaw`UPDATE "Area" SET "limits" = (SELECT ST_Transform(limits, 3857) FROM "area_limits" WHERE "Area"."id" = "area_limits"."id")`;
  } catch (error) {
    console.error("Error ingesting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function runOgr2Ogr(...args: string[]): Promise<void> {
  // Prisma doesn't like ESM imports, so we have to use CommonJS here
  const { execa } = await import("execa");

  const command = `ogr2ogr -f "PostgreSQL" PG:${POSTGRES_CONNECTION_STRING} ${args.join(" ")}`;

  await execa(command, { shell: true });
}

ingestData();
