/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const POSTGRES_CONNECTION_STRING = process.env.DATABASE_URL;
const SEED_DATA_PATH = process.env.SEED_DATA_PATH as string;
const ADMIN_CENTROIDS_PATH = path.join(SEED_DATA_PATH, "admin_centroids.gpkg");
const ADMIN_LIMITS_PATH = path.join(SEED_DATA_PATH, "admin_polygons.gpkg");
const ADMIN_LIMITS_TABLENAME = "admin_polygons";
const NODES_MARITIME_FILE = "nodes_maritime.gpkg";
const NODES_MARITIME_TABLENAME = "nodes_maritime";

async function ingestData() {
  try {
    // Check if data path is defined
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

    // Truncate all tables
    // await prisma.$executeRaw`TRUNCATE "Area" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Node" RESTART IDENTITY CASCADE`;

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
      `-nln Area_limits -overwrite -nlt MULTIPOLYGON -lco GEOMETRY_NAME=limits -sql "SELECT ID as id, geom as limits FROM ${ADMIN_LIMITS_TABLENAME}"`
    );

    await prisma.$executeRaw`UPDATE "Area" SET "limits" = (SELECT ST_Transform(limits, 3857) FROM "area_limits" WHERE "Area"."id" = "area_limits"."id")`;

    // Check if nodes file exists
    const NODES_PATH = path.join(SEED_DATA_PATH, NODES_MARITIME_FILE);
    if (!fs.existsSync(NODES_PATH)) {
      console.error("Maritime nodes file not found.");
      return;
    }

    console.log("Ingesting maritime nodes...");
    await runOgr2Ogr(
      NODES_PATH,
      `-nln Node -append -nlt POINT -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT ID as id, name, upper(infra) as type, geom FROM ${NODES_MARITIME_TABLENAME}"`
    );
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
