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
const NODES_MARITIME_FILE = "nodes_maritime.gpkg";
const NODES_MARITIME_TABLENAME = "nodes_maritime";
const NODES_PATH = path.join(SEED_DATA_PATH, NODES_MARITIME_FILE);
const EDGES_LAND_FILE = path.join(
  SEED_DATA_PATH,
  "Geometry_Landmapping_hexcode_complete.csv"
);
const EDGES_MARITIME_FILE = "edges_maritime_corrected.gpkg";
const EDGES_MARITIME_TABLENAME = "edges_maritime_corrected";
const EDGES_PATH = path.join(SEED_DATA_PATH, EDGES_MARITIME_FILE);

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
    if (!checkFileExistence(EDGES_PATH, "Maritime edges file not found."))
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

    console.log("Clearing existing tables...");
    const truncateTablesStart = performance.now();
    await prisma.$executeRaw`TRUNCATE "Area" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Node" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Edge" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Flow" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE "FoodGroup" RESTART IDENTITY CASCADE`;
    console.log(
      `Cleared existing tables (${msToSeconds(performance.now() - truncateTablesStart)}s)`
    );

    console.log("Ingesting food groups and subgroups...");
    const ingestFoodGroupsStart = performance.now();
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
    console.log(
      `Ingested food groups and subgroups (${msToSeconds(performance.now() - ingestFoodGroupsStart)}s)`
    );

    console.log("Ingesting area centroids...");
    const ingestCentroidsStart = performance.now();
    await runOgr2Ogr(
      ADMIN_CENTROIDS_PATH,
      '-nln Area -append -nlt POINT -lco GEOMETRY_NAME=centroid -sql "SELECT ID as id, admin_name as name, geom AS centroid FROM admin_centroids"'
    );
    console.log(
      `Ingested area centroids (${msToSeconds(performance.now() - ingestCentroidsStart)}s)`
    );

    console.log("Ingesting area limits...");
    const ingestLimitsStart = performance.now();
    await runOgr2Ogr(
      ADMIN_LIMITS_PATH,
      `-nln Area_limits_temp -overwrite -nlt MULTIPOLYGON -lco GEOMETRY_NAME=limits -sql "SELECT ID as id, geom as limits FROM ${ADMIN_LIMITS_TABLENAME}"`
    );
    await prisma.$executeRaw`UPDATE "Area" SET "limits" = (SELECT ST_Transform(limits, 3857) FROM "area_limits_temp" WHERE "Area"."id" = "area_limits_temp"."id")`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "area_limits_temp"`;
    console.log(
      `Ingested area limits (${msToSeconds(performance.now() - ingestLimitsStart)}s)`
    );

    console.log("Ingesting inland ports...");
    const ingestInlandPortsStart = performance.now();
    await runOgr2Ogr(
      INLAND_PORTS_PATH,
      `-nln Node -append -nlt POINT -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT node_id as id_str, 'INLAND_PORT' as type, geom FROM ${INLAND_PORTS_TABLENAME}" -s_srs EPSG:4326`
    );
    console.log(
      `Ingested inland ports (${msToSeconds(performance.now() - ingestInlandPortsStart)}s)`
    );

    console.log("Ingesting rail stations...");
    const ingestRailStationStart = performance.now();
    await runOgr2Ogr(
      RAIL_STATIONS_PATH,
      `-nln rail_stations_temp -nlt POINT -overwrite -oo KEEP_GEOM_COLUMNS=NO -s_srs EPSG:4326 -t_srs EPSG:3857`
    );
    await prisma.$executeRaw`
      INSERT INTO "Node" ("id_str", "centroid", "type")
      SELECT DISTINCT node_id, geom, 'RAIL_STATION'::"NodeType" AS type
      FROM rail_stations_temp
    `;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "rail_stations_temp"`;
    console.log(
      `Ingested rail stations (${msToSeconds(performance.now() - ingestRailStationStart)}s)`
    );

    console.log("Ingesting maritime nodes...");
    const ingestMaritimeNodesStart = performance.now();
    await runOgr2Ogr(
      NODES_PATH,
      `-nln Node -append -nlt POINT -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT ID as id_str, name, upper(infra) as type, geom FROM ${NODES_MARITIME_TABLENAME}" -a_srs EPSG:4326`
    );
    console.log(
      `Ingested maritime nodes (${msToSeconds(performance.now() - ingestMaritimeNodesStart)}s)`
    );

    console.log("Ingesting land edges...");
    const ingestLandEdgesStart = performance.now();
    await prisma.$executeRaw`DROP TABLE IF EXISTS "land_edges_temp"`;
    await prisma.$executeRaw`
      CREATE TABLE "land_edges_temp" (
        column1 TEXT,
        column2 TEXT,
        edge_id TEXT,
        geometry GEOMETRY(MULTILINESTRING, 4326)
      )
    `;

    const copyLandEdgesCommand = `\\copy land_edges_temp (column1, column2, edge_id, geometry) FROM '${EDGES_LAND_FILE}' DELIMITER ',' CSV HEADER;`;
    await execa(
      `psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyLandEdgesCommand}"`,
      {
        shell: true,
      }
    );

    await prisma.$executeRaw`
      INSERT INTO "Edge" ("fromNodeId", "toNodeId", distance, "type", "geom")
      SELECT
          n1.id,
          n2.id,
          ST_Length(ST_Transform(le.geometry, 4326)::geography) AS distance,
          'LAND' AS type,
          ST_Transform(le.geometry, 3857) AS geom
      FROM
          land_edges_temp le
      JOIN
          "Node" n1 ON n1.id_str = split_part(le.edge_id, '-', 1)
      JOIN
          "Node" n2 ON n2.id_str = split_part(le.edge_id, '-', 2)
    `;
    console.log(
      `Ingested land edges (${msToSeconds(performance.now() - ingestLandEdgesStart)}s)`
    );

    // Export unmatched land edges
    const query = `
      COPY (
        SELECT
          le.edge_id
        FROM
          land_edges_temp le
        LEFT JOIN
          "Node" n1 ON n1.id_str = split_part(le.edge_id, '-', 1)
        LEFT JOIN
          "Node" n2 ON n2.id_str = split_part(le.edge_id, '-', 2)
        WHERE
          n1.id IS NULL OR n2.id IS NULL
      ) TO STDOUT CSV HEADER
    `;
    const outputFile = path.resolve(SEED_DATA_PATH, "unmatched_land_edges.csv");
    const command = `psql "${POSTGRES_CONNECTION_STRING}" -c "${query.replace(/"/g, '\\"')}" > "${outputFile}"`;
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error("psql error:", stderr);
    }
    console.log(
      `Ingested land edges and exported unmatched edges (${msToSeconds(performance.now() - ingestLandEdgesStart)}s)`
    );
    if (stdout) console.log(stdout);
    await prisma.$executeRaw`DROP TABLE IF EXISTS "land_edges_temp"`;

    const ingestWaterEdgesStart = performance.now();
    await prisma.$executeRaw`DROP TABLE IF EXISTS "edge_temp"`;
    await runOgr2Ogr(
      EDGES_PATH,
      `-nln edge_temp -append -nlt MULTILINESTRING -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT from_id as from_id_str, to_id as to_id_str, distance, length, geom FROM ${EDGES_MARITIME_TABLENAME}"`
    );

    await prisma.$executeRaw`
      INSERT INTO "Edge" ("fromNodeId", "toNodeId", "distance", "type", "geom")
      SELECT
        n1."id" AS fromNodeId,
        n2."id" AS toNodeId,
        e."distance",
        'MARITIME' AS type,
        e."geom"
      FROM "edge_temp" e
      JOIN "Node" n1 ON e."from_id_str" = n1."id_str"
      JOIN "Node" n2 ON e."to_id_str" = n2."id_str"
      WHERE n1."id" IS NOT NULL AND n2."id" IS NOT NULL
    `;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "edge_temp"`;
    console.log(
      `Inserted maritime edges (${msToSeconds(performance.now() - ingestWaterEdgesStart)}s)`
    );

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
          "node_id_str1" TEXT,
          "node_id_str2" TEXT,
          "node_id1" INTEGER,
          "node_id2" INTEGER,
          "edge_id" INTEGER,
          "flow_segment_id" INTEGER
        );
      `;
        log("Created intermediate table...");

        // Insert data into the intermediate table
        await prisma.$executeRaw`
        INSERT INTO flow_segments_intermediate ("flowId", "mode", "order", "node_id_str1", "node_id_str2")
        SELECT
          fs."flowId",
          fs."mode",
          fs."order",
          split_part(edge_str, '-', 1) AS id_str1,
          split_part(edge_str, '-', 2) AS id_str2
        FROM "flow_segments_temp" fs,
        LATERAL unnest(fs.paths) AS edge_str;
      `;
        log("Inserted flow segment edges...");

        // Create necessary indexes after data insertion
        await prisma.$executeRaw`CREATE INDEX idx_fsi_node_id_str1 ON flow_segments_intermediate (node_id_str1);`;
        await prisma.$executeRaw`CREATE INDEX idx_fsi_node_id_str2 ON flow_segments_intermediate (node_id_str2);`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_node_id_str ON "Node" (id_str);`;
        log("Created indexes...");

        // Update node ids using a more efficient join
        await prisma.$executeRaw`
        UPDATE flow_segments_intermediate fsi
        SET node_id1 = n1.id,
            node_id2 = n2.id
        FROM "Node" n1, "Node" n2
        WHERE n1.id_str = fsi.node_id_str1
          AND n2.id_str = fsi.node_id_str2;
      `;
        log("Updated node ids...");

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

        log("Checking for unmatched flow segment edges...");
        const unmatchedEdges = await prisma.$queryRaw`
        SELECT COUNT(*) AS count
        FROM flow_segments_intermediate
        WHERE edge_id IS NULL
      `;

        const flowSegmentCount = await prisma.$queryRaw`
        SELECT COUNT(*) AS count
        FROM flow_segments_intermediate
      `;

        log(
          `Unmatched flow segment edges: ${unmatchedEdges[0].count} / ${flowSegmentCount[0].count}`
        );

        await prisma.$executeRaw`
        DELETE FROM flow_segments_intermediate
        WHERE node_id1 IS NULL OR node_id2 IS NULL
      `;
        log("Cleaning up unmatched flow segment edges...");

        await prisma.$executeRaw`
        INSERT INTO "FlowSegment" ("flowId", "mode", "order")
        SELECT DISTINCT
          "flowId",
          "mode",
          "order"
        FROM flow_segments_intermediate
      `;
        log("Inserted flow segments...");

        log("Updating flow segment IDs...");
        await prisma.$executeRaw`
        UPDATE flow_segments_intermediate fsi
        SET flow_segment_id = fs.id
        FROM "FlowSegment" fs
        WHERE fs."flowId" = fsi."flowId"
          AND fs."mode" = fsi."mode"
          AND fs."order" = fsi."order"
      `;

        // TODO - log edges not found
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
