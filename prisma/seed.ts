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
const EDGES_MARITIME_FILE = "edges_maritime_corrected.gpkg";
const EDGES_MARITIME_TABLENAME = "edges_maritime_corrected";

async function ingestData() {
  const { execa } = await import("execa");

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
    await prisma.$executeRaw`TRUNCATE "Area" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Node" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Edge" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Flow" RESTART IDENTITY CASCADE`;

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
      `-nln Node -append -nlt POINT -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT ID as id_str, name, upper(infra) as type, geom FROM ${NODES_MARITIME_TABLENAME}"`
    );

    // Check if edges file exists
    const EDGES_PATH = path.join(SEED_DATA_PATH, EDGES_MARITIME_FILE);
    if (!fs.existsSync(EDGES_PATH)) {
      console.error("Maritime edges file not found.");
      return;
    }

    console.log("Ingesting maritime edges...");
    await prisma.$executeRaw`DROP TABLE IF EXISTS "edge_temp"`;

    await runOgr2Ogr(
      EDGES_PATH,
      `-nln edge_temp -append -nlt LINESTRING -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT from_id as from_id_str, to_id as to_id_str, distance, length, geom FROM ${EDGES_MARITIME_TABLENAME}"`
    );

    await prisma.$executeRaw`
      INSERT INTO "Edge" ("fromNodeId", "toNodeId", "distance", "geom")
      SELECT
        n1."id" AS fromNodeId,
        n2."id" AS toNodeId,
        e."distance",
        e."geom"
      FROM "edge_temp" e
      JOIN "Node" n1 ON e."from_id_str" = n1."id_str"
      JOIN "Node" n2 ON e."to_id_str" = n2."id_str"
      WHERE n1."id" IS NOT NULL AND n2."id" IS NOT NULL
    `;

    await prisma.$executeRaw`DROP TABLE IF EXISTS "edge_temp"`;

    // list files starting with "Flow_" in the data directory
    const FLOW_FILES = fs
      .readdirSync(SEED_DATA_PATH)
      .filter((file: string) => file.startsWith("Flows_"));

    for (const file of FLOW_FILES) {
      const FLOW_PATH = path.resolve(path.join(SEED_DATA_PATH, file));
      await prisma.$executeRaw`DROP TABLE IF EXISTS "flows_temp"`;

      // Create temporary table for flows
      await prisma.$executeRaw`
        CREATE TABLE "flows_temp" (
          id INTEGER PRIMARY KEY,
          from_id_admin TEXT,
          to_id_admin TEXT,
          flow_id_str TEXT,
          edge_id TEXT,
          edge_order TEXT,
          flow_value FLOAT,
          flow_start_node_id INTEGER,
          flow_start_node_id_str TEXT,
          flow_end_node_id INTEGER,
          flow_end_node_id_str TEXT,
          edge_start_node_id INTEGER,
          edge_start_node_id_str TEXT,
          edge_end_node_id INTEGER,
          edge_end_node_id_str TEXT
        )
      `;

      const copyCommand = `\\copy flows_temp (id,from_id_admin,to_id_admin,flow_id_str,edge_id,edge_order,flow_value) FROM '${FLOW_PATH}' DELIMITER ',' CSV HEADER;`;

      await execa(`psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyCommand}"`, {
        shell: true,
      });

      await prisma.$executeRaw`
      UPDATE "flows_temp"
      SET 
        flow_start_node_id_str = split_part(flow_id_str, '_', 1),
        flow_end_node_id_str = split_part(flow_id_str, '_', 2),
        edge_start_node_id_str = split_part(edge_id, '_', 1),
        edge_end_node_id_str = split_part(edge_id, '_', 2)
      `;

      // ingest flows
      await prisma.$executeRaw`
        INSERT INTO "Flow" ("fromAreaId", "toAreaId", "food", "value")
        SELECT DISTINCT
          "from_id_admin" AS "fromAreaId",
          "to_id_admin" AS "toAreaId",
          'Food id',
          "flow_value" AS "value"
        FROM "flows_temp" f        
      `;
    }
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
