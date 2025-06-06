import fs from "fs-extra";
import path from "path";
import { parse } from "csv-parse";
import { execa } from "execa";
import { PrismaClient } from "@prisma/client";
import { log, runOgr2Ogr } from "./utils";
import { exec } from "child_process";
import { promisify } from "util";

import {
  EDGES_LAND_FILE,
  EDGES_LAND_FILE_TEMP,
  EDGES_MARITIME_PATH,
  EDGES_MARITIME_TABLENAME,
  POSTGRES_CONNECTION_STRING,
  SEED_DATA_PATH,
} from "./config";

const execAsync = promisify(exec);

export const ingestEdges = async (prisma: PrismaClient) => {
  await prisma.$executeRaw`TRUNCATE "Edge" RESTART IDENTITY CASCADE`;

  log("Cleared edges table.");

  await runOgr2Ogr(
    EDGES_MARITIME_PATH,
    `-nln Edge \
    -append \
    -nlt MULTILINESTRING \
    -lco GEOMETRY_NAME=geom \
    -sql "SELECT from_id || '-' || to_id AS id_str, from_id AS \\"fromNodeId\\", to_id AS \\"toNodeId\\", distance, 'MARITIME' AS type, geom FROM ${EDGES_MARITIME_TABLENAME}"`
  );
  log("Ingested maritime edges.");

  await fs.remove(EDGES_LAND_FILE_TEMP);
  const writeStream = fs.createWriteStream(EDGES_LAND_FILE_TEMP);

  await new Promise((resolve, reject) => {
    // Stream CSV into memory
    fs.createReadStream(EDGES_LAND_FILE)
      .pipe(
        parse({
          columns: true,
          trim: true,
          skip_empty_lines: true,
        })
      )
      .on("data", (data) => {
        const [fromNodeId, toNodeId] = data.edge_id.split("-");
        writeStream.write(
          `${data.edge_id},${fromNodeId},${toNodeId},${data.geometry}\n`
        );
      })
      .on("error", (error) => {
        reject(error);
      })
      .on("end", () => {
        writeStream.end();
        resolve(null);
      });
  });
  log("Parsed land edges.");

  await prisma.$executeRaw`DROP TABLE IF EXISTS "land_edges_temp"`;
  await prisma.$executeRaw`
    CREATE UNLOGGED TABLE "land_edges_temp" (
      id_str TEXT,
      from_node_id TEXT,
      to_node_id TEXT,
      geometry GEOMETRY(MULTILINESTRING, 4326)
    )
  `;

  const copyLandEdgesCommand = `\\COPY "land_edges_temp" ("id_str", from_node_id, to_node_id, "geometry") FROM '${EDGES_LAND_FILE_TEMP}' WITH (FORMAT CSV, DELIMITER ',');`;

  await execa(
    `psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyLandEdgesCommand}"`,
    {
      shell: true,
    }
  );
  log("Copied land edges to temporary table.");

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_land_edges_temp_from_node_id ON "land_edges_temp" ("from_node_id");
  `;
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_land_edges_temp_to_node_id ON "land_edges_temp" ("to_node_id");
  `;
  log("Created indexes on land edges temp table.");

  // export edges that don't have corresponding nodes
  const unmatchedLandEdgesQuery = `
    COPY (
      SELECT le.id_str
      FROM "land_edges_temp" le
      LEFT JOIN "Node" n1 ON n1.id = le."from_node_id"
      LEFT JOIN "Node" n2 ON n2.id = le."to_node_id"
      WHERE n1.id IS NULL OR n2.id IS NULL
    ) TO STDOUT CSV HEADER
  `;

  const outputFile = path.resolve(SEED_DATA_PATH, "unmatched_land_edges.csv");
  await fs.remove(outputFile);
  const command = `psql "${POSTGRES_CONNECTION_STRING}" -c "${unmatchedLandEdgesQuery.replace(/"/g, '\\"')}" > "${outputFile}"`;
  const { stderr } = await execAsync(command);
  if (stderr) {
    console.error("psql error:", stderr); // eslint-disable-line no-console
  }
  log(`Exported unmatched land edges to ${outputFile}`);

  // Drop land edges that don't have corresponding nodes
  await prisma.$executeRaw`
    DELETE FROM "land_edges_temp"
    WHERE "from_node_id" IS NULL
      OR "to_node_id" IS NULL
      OR NOT EXISTS (
          SELECT 1 FROM "Node"
          WHERE "id" = "land_edges_temp"."from_node_id"
      )
      OR NOT EXISTS (
          SELECT 1 FROM "Node"
          WHERE "id" = "land_edges_temp"."to_node_id"
      );
  `;
  log("Deleted land edges that don't have corresponding nodes.");

  // Delete duplicate land edges using the id column
  const duplicatedEdgesCount = await prisma.$executeRaw`
    WITH deleted AS (
      DELETE FROM "land_edges_temp"
      WHERE ctid NOT IN (
        SELECT min(ctid)
        FROM "land_edges_temp"
        GROUP BY id_str
      )
      RETURNING *
    )
    SELECT COUNT(*) FROM deleted
  `;
  log(`Deleted ${duplicatedEdgesCount} duplicate rows.`);

  // Disable triggers on Edge table
  await prisma.$executeRaw`
    ALTER TABLE "Edge" DISABLE TRIGGER ALL;
  `;

  await prisma.$executeRaw`
    INSERT INTO "Edge" ("id_str", "fromNodeId", "toNodeId", distance, "type", "geom")
    SELECT
        id_str,
        from_node_id,
        to_node_id,
        0,
        'LAND' AS type,
        ST_Transform(le.geometry, 4326) AS geom
    FROM
        land_edges_temp le
  `;
  log(`Ingested land edges.`);

  // drop temporary table
  await prisma.$executeRaw`DROP TABLE IF EXISTS "land_edges_temp"`;

  await prisma.$executeRaw`
    ALTER TABLE "Edge" ENABLE TRIGGER ALL;
  `;
  log(`Enabled triggers on Edge table.`);
};
