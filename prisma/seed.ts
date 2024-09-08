/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const { PrismaClient } = require("@prisma/client");
const execAsync = promisify(exec);

const prisma = new PrismaClient();

const POSTGRES_CONNECTION_STRING = process.env.DATABASE_URL;
const SEED_DATA_PATH = path.resolve(process.env.SEED_DATA_PATH as string);

const FOOD_GROUPS_LIST_FILE = path.join(
  SEED_DATA_PATH,
  "Commodity/UniqueFG1_FG2.csv"
);

const FOOD_GROUP_LEVEL0_FOLDER = path.join(
  SEED_DATA_PATH,
  "Flows/Land_V2/foodgroup2"
);

const ADMIN_CENTROIDS_PATH = path.join(SEED_DATA_PATH, "admin_centroids.gpkg");
const ADMIN_LIMITS_PATH = path.join(SEED_DATA_PATH, "admin_polygons.gpkg");
const ADMIN_LIMITS_TABLENAME = "admin_polygons";

const INLAND_PORTS_PATH = path.join(
  SEED_DATA_PATH,
  `IWWNodes_infrastructure.gpkg`
);
const INLAND_PORTS_TABLENAME = "IWWNodes_infrastructure";
const RAIL_STATIONS_PATH = path.join(
  SEED_DATA_PATH,
  `RailNodes_infrastructure.gpkg`
);
const RAIL_STATIONS_TABLENAME = "RailNodes_infrastructure";
const NODES_MARITIME_FILE = "nodes_maritime.gpkg";
const NODES_MARITIME_TABLENAME = "nodes_maritime";
const NODES_PATH = path.join(SEED_DATA_PATH, NODES_MARITIME_FILE);
const EDGES_LAND_FILE = path.join(
  SEED_DATA_PATH,
  "Geometry_Landmapping_hexcode_complete.csv"
);
const EDGES_MARITIME_FILE = "edges_maritime_corrected.gpkg";
const EDGES_MARITIME_TABLENAME = "edges_maritime_corrected";
const EDGES_MARITIME_PATH = path.join(SEED_DATA_PATH, EDGES_MARITIME_FILE);

function checkFileExistence(filePath: string, errorMessage: string) {
  if (!fs.existsSync(filePath)) {
    console.error(errorMessage);
    return false;
  }
  return true;
}

function round(value: number, decimals = 2) {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
}

function msToSeconds(ms: number) {
  return round(ms / 1000);
}

function msToMinutes(ms: number) {
  return round(ms / 60000);
}

let lastTimestamp = Date.now();

function log(message: string) {
  const currentTimestamp = Date.now();
  const diff = ((currentTimestamp - lastTimestamp) / 1000).toFixed(2); // Time difference in seconds
  const formattedTimestamp = new Date(currentTimestamp).toISOString(); // Format current time
  console.log(`[${formattedTimestamp}] (+${diff}s) ${message}`);
  lastTimestamp = currentTimestamp;
}

async function ingestData() {
  const ingestDataStart = performance.now();
  const { execa } = await import("execa");

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

    if (
      !checkFileExistence(
        ADMIN_CENTROIDS_PATH,
        "Admin centroids file not found."
      )
    )
      return;
    if (!checkFileExistence(ADMIN_LIMITS_PATH, "Admin limits file not found."))
      return;
    if (!checkFileExistence(NODES_PATH, "Maritime nodes file not found."))
      return;
    if (
      !checkFileExistence(EDGES_MARITIME_PATH, "Maritime edges file not found.")
    )
      return;

    // Terminate other sessions to avoid conflicts
    await prisma.$executeRaw`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = current_database()
        AND pid <> pg_backend_pid();
    `;

    // Set PostgreSQL optimizations for this session
    await prisma.$executeRaw`SET work_mem = '128MB'`;
    await prisma.$executeRaw`SET maintenance_work_mem = '1GB'`;
    await prisma.$executeRaw`SET synchronous_commit = 'off'`;
    await prisma.$executeRaw`SET wal_compression = 'on'`;
    await prisma.$executeRaw`SET effective_cache_size = '2GB'`;
    await prisma.$executeRaw`SET max_parallel_workers_per_gather = 4`;
    await prisma.$executeRaw`SET max_parallel_workers = 8`;
    await prisma.$executeRaw`SET log_min_duration_statement = 1000`;
    await prisma.$executeRaw`SET random_page_cost = 1.1`;

    const truncateTablesStart = performance.now();
    await prisma.$executeRaw`TRUNCATE "Area" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Node" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Edge" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Flow" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "FoodGroup" RESTART IDENTITY CASCADE`;
    log("Clearing existing tables...");

    console.log(
      `Cleared existing tables (${msToSeconds(performance.now() - truncateTablesStart)}s)`
    );

    await prisma.$executeRaw`DROP TABLE IF EXISTS "food_groups_temp"`;
    await prisma.$executeRaw`
      CREATE TABLE "food_groups_temp" (
        id SERIAL PRIMARY KEY,
        food_group TEXT,
        food_subgroup TEXT
      )
    `;
    const copyCommand = `\\copy food_groups_temp (food_group, food_subgroup) FROM '${FOOD_GROUPS_LIST_FILE}' DELIMITER ',' CSV HEADER;`;
    await execa(`psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyCommand}"`, {
      shell: true,
    });

    // Insert level 0 food groups
    await prisma.$executeRaw`
      INSERT INTO "FoodGroup" (name, level)
      SELECT DISTINCT food_group, 0
      FROM "food_groups_temp"
    `;

    // Insert level 1 food subgroups
    await prisma.$executeRaw`
      INSERT INTO "FoodGroup" (name, level, \"parentId\")
      SELECT DISTINCT food_subgroup, 1, fg.id
      FROM "food_groups_temp" fgt
      JOIN "FoodGroup"  fg ON fg.name = fgt.food_group
    `;

    await prisma.$executeRaw`DROP TABLE IF EXISTS "food_groups_temp"`;
    log(`Ingested food groups and subgroups.`);

    await runOgr2Ogr(
      ADMIN_CENTROIDS_PATH,
      `-nln Node -append -nlt POINT -t_srs EPSG:3857 -sql "SELECT id, admin_name as name, 'ADMIN' as type, geom FROM admin_centroids"`
    );
    log('Ingested admin centroids to "Node" table...');

    // Copy admin centroids to "Area" table
    await prisma.$executeRaw`INSERT INTO "Area" ("id", "centroid", "name") SELECT id, ST_Transform(geom, 3857), name FROM "Node" WHERE type = 'ADMIN'`;

    // Update limits for areas
    await runOgr2Ogr(
      ADMIN_LIMITS_PATH,
      `-nln Area_limits_temp -overwrite -nlt MULTIPOLYGON -lco GEOMETRY_NAME=limits -sql "SELECT ID as id, geom as limits FROM ${ADMIN_LIMITS_TABLENAME}"`
    );
    await prisma.$executeRaw`UPDATE "Area" SET "limits" = (SELECT ST_Transform(limits, 3857) FROM "area_limits_temp" WHERE "Area"."id" = "area_limits_temp"."id")`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "area_limits_temp"`;
    log(`Ingested area limits.`);

    await runOgr2Ogr(
      INLAND_PORTS_PATH,
      `-nln Node -append -nlt POINT -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT node_id as id, 'INLAND_PORT' as type, geom FROM ${INLAND_PORTS_TABLENAME}" -s_srs EPSG:4326`
    );
    log("Ingested inland ports...");

    await runOgr2Ogr(
      RAIL_STATIONS_PATH,
      `-nln Node -append -nlt POINT -t_srs EPSG:3857 -sql "SELECT DISTINCT node_id as id, 'RAIL_STATION' as type, geom FROM ${RAIL_STATIONS_TABLENAME}"`
    );
    log("Ingested rail nodes.");

    await runOgr2Ogr(
      NODES_PATH,
      `-nln Node -append -nlt POINT -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT id, name, upper(infra) as type, geom as centroid FROM ${NODES_MARITIME_TABLENAME}"`
    );
    log(`Ingested maritime nodes.`);

    await runOgr2Ogr(
      EDGES_MARITIME_PATH,
      `-nln Edge -append -nlt MULTILINESTRING -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT from_id as "fromNodeId", to_id as "toNodeId", distance, 'MARITIME' as type, geom FROM ${EDGES_MARITIME_TABLENAME}"`
    );
    log("Ingested maritime edges.");

    await prisma.$executeRaw`DROP TABLE IF EXISTS "land_edges_temp"`;
    await prisma.$executeRaw`
      CREATE UNLOGGED TABLE "land_edges_temp" (
        column1 TEXT,
        column2 TEXT,
        edge_id TEXT,
        geometry GEOMETRY(MULTILINESTRING, 4326),
        "fromNodeId" TEXT,
        "toNodeId" TEXT
      )
    `;

    const copyLandEdgesCommand = `\\copy land_edges_temp (column1, column2, edge_id, geometry) FROM '${EDGES_LAND_FILE}' DELIMITER ',' CSV HEADER;`;
    await execa(
      `psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyLandEdgesCommand}"`,
      {
        shell: true,
      }
    );
    log("Copied land edges to temporary table.");

    // update fromNodeId and toNodeId
    await prisma.$executeRaw`
      UPDATE "land_edges_temp" le
      SET "fromNodeId" = split_part(le.edge_id, '-', 1),
          "toNodeId" = split_part(le.edge_id, '-', 2)
    `;
    log("Updated edge node IDs in temporary table.");

    // export edges that don't have corresponding nodes
    const unmatchedLandEdgesQuery = `
      COPY (
        SELECT *
        FROM "land_edges_temp" le
        LEFT JOIN "Node" n1 ON n1.id = le."fromNodeId"
        LEFT JOIN "Node" n2 ON n2.id = le."toNodeId"
        WHERE n1.id IS NULL OR n2.id IS NULL
      ) TO STDOUT CSV HEADER
    `;

    const outputFile = path.resolve(SEED_DATA_PATH, "unmatched_land_edges.csv");
    const command = `psql "${POSTGRES_CONNECTION_STRING}" -c "${unmatchedLandEdgesQuery.replace(/"/g, '\\"')}" > "${outputFile}"`;
    const { stderr } = await execAsync(command);
    if (stderr) {
      console.error("psql error:", stderr);
    }
    log("Exported unmatched land edges.");

    // Drop land edges that don't have corresponding nodes
    await prisma.$executeRaw`
      DELETE FROM "land_edges_temp"
        WHERE "fromNodeId" IS NULL
          OR "toNodeId" IS NULL
          OR "fromNodeId" NOT IN (SELECT id FROM "Node")
          OR "toNodeId" NOT IN (SELECT id FROM "Node");
    `;
    log("Deleted land edges that don't have corresponding nodes.");

    // Disable triggers on Edge table
    await prisma.$executeRaw`
      ALTER TABLE "Edge" DISABLE TRIGGER ALL;
    `;

    await prisma.$executeRaw`
      INSERT INTO "Edge" ("fromNodeId", "toNodeId", distance, "type", "geom")
      SELECT
          "fromNodeId",
          "toNodeId",
          0,
          'LAND' AS type,
          ST_Transform(le.geometry, 3857) AS geom
      FROM
          land_edges_temp le
    `;
    log(`Ingested land edges.`);

    await prisma.$executeRaw`
      ALTER TABLE "Edge" ENABLE TRIGGER ALL;
    `;
    log(`Enabled triggers on Edge table.`);

    const foodGroups = (await prisma.foodGroup.findMany()) as {
      id: number;
      name: string;
      level: number;
      parentId: number | null;
    }[];

    // list files starting with "Flow_" in the data directory
    const foodGroupFiles = fs
      .readdirSync(FOOD_GROUP_LEVEL0_FOLDER)
      .filter((file: string) => file.startsWith("Flows_"))
      .filter((file: string) => file.endsWith(".gz"))
      .map((file: string) => {
        const foodGroupName = file.split("_")[1].split(".")[0];
        const foodGroup = foodGroups.find((fg) => fg.name === foodGroupName);
        const filePath = path.join(FOOD_GROUP_LEVEL0_FOLDER, file);
        const fileSize = fs.statSync(filePath).size; // Get file size in bytes

        return {
          path: filePath,
          size: fileSize,
          ...foodGroup,
        };
      })
      .sort(
        (
          a: {
            size: number;
          },
          b: {
            size: number;
          }
        ) => a.size - b.size
      ); // Sort files from smallest to largest

    for (const foodGroupFile of foodGroupFiles) {
      try {
        log(`Ingesting file '${foodGroupFile.name}'...`);

        const ingestFlowsStart = performance.now();
        await prisma.$executeRaw`DROP TABLE IF EXISTS "flows_temp"`;

        // Create temporary table for flows
        await prisma.$executeRaw`
        CREATE TABLE "flows_temp" (
          from_id_admin TEXT,
          to_id_admin TEXT,
          flow_value FLOAT,
          mode TEXT,
          segment_order INTEGER,
          paths TEXT
        )
      `;
        log("Created temporary table for flows...");

        await prisma.$executeRaw`CREATE INDEX idx_flows_temp_on_admins_and_value ON "flows_temp" (from_id_admin, to_id_admin, flow_value);`;
        log("Created indexes for temporary table...");

        const expandedFilePath = foodGroupFile.path.replace(".gz", "");
        await execa(
          `gunzip -c "${foodGroupFile.path}" > "${expandedFilePath}"`,
          {
            shell: true, // Use shell mode to support shell syntax like redirection
          }
        );
        log("Expanded file...");

        const copyCommand = `\\copy flows_temp (from_id_admin,to_id_admin,flow_value,mode,segment_order,paths) FROM '${expandedFilePath}' DELIMITER ',' CSV HEADER;`;
        await execa(
          `psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyCommand}"`,
          {
            shell: true,
          }
        );
        log("Copied data to temporary table...");

        await prisma.$executeRaw`
        INSERT INTO "Flow" ("fromAreaId", "toAreaId", "foodGroupId", "value")
        SELECT DISTINCT
          "from_id_admin" AS "fromAreaId",
          "to_id_admin" AS "toAreaId",
          ${foodGroupFile.id},
          "flow_value" AS "value"
        FROM "flows_temp" f
      `;
        log("Inserted flows...");

        await prisma.$executeRaw`DROP TABLE IF EXISTS "flow_segments_temp"`;
        await prisma.$executeRaw`
        CREATE TABLE "flow_segments_temp" (
          "flowId" INTEGER,
          "mode" TEXT,
          "order" INTEGER,
          "paths" TEXT[]
        )
      `;
        log("Created temporary table for flow segments...");

        await prisma.$executeRaw`
        INSERT INTO "flow_segments_temp" ("flowId", "mode", "order", "paths")
        SELECT
          (SELECT id FROM "Flow"
            WHERE "fromAreaId" = f."from_id_admin"
              AND "toAreaId" = f."to_id_admin"
              AND "foodGroupId" = ${foodGroupFile.id}
              AND "value" = f."flow_value"
          LIMIT 1) AS "flowId",  -- Subquery to get the correct flow ID
          f.mode,
          f.segment_order,
          CASE
            -- Handle stringified arrays: replace square brackets and single quotes to format correctly
          WHEN paths LIKE '[%]' THEN
            translate(replace(paths, '''', ''), '[]', '{}')::TEXT[]  -- Convert the stringified array to PostgreSQL array format
          ELSE
            ARRAY[paths]  -- For single path entries, wrap them in an array
          END AS paths_array
        FROM "flows_temp" f
      `;
        log("Moved flow segments to temporary table...");

        // Drop the table if it exists; no need to truncate first
        await prisma.$executeRaw`DROP TABLE IF EXISTS "flow_segments_intermediate" CASCADE`;
        log("Dropped intermediate table...");

        // Recreate the temporary table
        await prisma.$executeRaw`
        CREATE TABLE flow_segments_intermediate (
          "flowId" INTEGER,
          "mode" TEXT,
          "order" INTEGER,
          "node_id1" TEXT,
          "node_id2" TEXT,
          "edge_id" INTEGER,
          "flow_segment_id" INTEGER
        );
      `;
        log("Created intermediate table...");

        // Insert data into the intermediate table
        await prisma.$executeRaw`
        INSERT INTO flow_segments_intermediate ("flowId", "mode", "order", "node_id1", "node_id2")
        SELECT
          fs."flowId",
          fs."mode",
          fs."order",
          split_part(edge_str, '-', 1) AS node_id1,
          split_part(edge_str, '-', 2) AS node_id2
        FROM "flow_segments_temp" fs,
        LATERAL unnest(fs.paths) AS edge_str;
      `;
        log("Inserted flow segment edges...");

        // Update edge ids using the newly created index
        await prisma.$executeRaw`
          UPDATE flow_segments_intermediate fsi
          SET edge_id = e.id
          FROM "Edge" e
          WHERE e."fromNodeId" = fsi.node_id1
            AND e."toNodeId" = fsi.node_id2
            AND fsi.edge_id IS NULL;
        `;
        log("Updated edge ids...");

        // Export unmatched flow segment edges
        const unmatchedFlowSegmentsQuery = `
          COPY (
            SELECT *
            FROM flow_segments_intermediate fsi
            WHERE edge_id IS NULL
          ) TO STDOUT CSV HEADER
        `;
        const outputFile = path.resolve(
          SEED_DATA_PATH,
          `unmatched_flow_segments-${foodGroupFile.name}.csv`
        );
        const command = `psql "${POSTGRES_CONNECTION_STRING}" -c "${unmatchedFlowSegmentsQuery.replace(/"/g, '\\"')}" > "${outputFile}"`;
        const { stderr } = await execAsync(command);
        if (stderr) {
          console.error("psql error:", stderr);
        }
        log("Exported unmatched flow segments.");

        await prisma.$executeRaw`
          DELETE FROM flow_segments_intermediate
          WHERE node_id1 IS NULL OR node_id2 IS NULL
        `;
        log("Deleted flow segments with missing nodes before inserting...");

        await prisma.$executeRaw`
        INSERT INTO "FlowSegment" ("flowId", "mode", "order")
          SELECT DISTINCT
            "flowId",
            "mode",
            "order"
          FROM flow_segments_intermediate
        `;
        log("Inserted flow segments...");

        await prisma.$executeRaw`
          UPDATE flow_segments_intermediate fsi
          SET flow_segment_id = fs.id
          FROM "FlowSegment" fs
          WHERE fs."flowId" = fsi."flowId"
            AND fs."mode" = fsi."mode"
            AND fs."order" = fsi."order"
        `;
        log("Updated flow segment IDs in intermediate table...");

        await prisma.$executeRaw`
        INSERT INTO "FlowSegmentEdges" ("flowSegmentId", "edgeId")
          SELECT
            fsi.flow_segment_id,
            fsi.edge_id
          FROM flow_segments_intermediate fsi
          WHERE fsi.edge_id IS NOT NULL
        `;
        log("Inserted flow segment edges...");

        log("Cleaning up temporary tables...");
        await execa(`rm "${expandedFilePath}"`, { shell: true });

        log(
          `Ingested file '${foodGroupFile.name}' (${msToSeconds(performance.now() - ingestFlowsStart)}s)`
        );
      } catch (error) {
        log(`Error ingesting file '${foodGroupFile.name}': ${error}`);
      }
    }
    // cleanup
    await prisma.$executeRaw`DROP TABLE IF EXISTS "flow_segments_intermediate"`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "flow_segments_temp"`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "flows_temp"`;
    log("Cleaned up temporary tables.");

    console.log(
      `Data ingestion completed in ${msToMinutes(performance.now() - ingestDataStart)} minutes.`
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
