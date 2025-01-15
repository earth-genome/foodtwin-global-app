import crypto from "crypto";
import fs from "fs-extra";
import path from "path";
import { execa } from "execa";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";
import { listFilesRecursively, log } from "./utils";

import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import {
  EDGE_IDS_SQLITE_DB_PATH,
  FLOWS_FOLDER,
  POSTGRES_CONNECTION_STRING,
  SEED_DATA_PATH,
} from "./config";

const filesIngestLog = path.resolve(SEED_DATA_PATH, "file_ingest_log.txt");

export function logFileIngest(message: Error | string) {
  const currentTimestamp = new Date().toISOString();
  const logMessage =
    message instanceof Error
      ? `${currentTimestamp}: ${message.stack}\n`
      : `${currentTimestamp}: ${message}\n`;
  // eslint-disable-next-line no-console
  console.log(logMessage);

  // Log to file
  fs.appendFileSync(filesIngestLog, logMessage);
}

enum FlowType {
  SEA_DOMESTIC = "SEA_DOMESTIC",
  SEA_REEXPORT = "SEA_REEXPORT",
  LAND_DOMESTIC = "LAND_DOMESTIC",
  LAND_REEXPORT = "LAND_REEXPORT",
  WITHIN_COUNTRY = "WITHIN_COUNTRY",
}

interface FoodGroupFile {
  path: string;
  size: number;
  foodGroup: {
    id: number;
    name: string;
  };
}

let memoryDb: Database;

export const ingestFlows = async (prisma: PrismaClient) => {
  memoryDb = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await loadEdgeIds();

  const foodGroups = await prisma.foodGroup.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      level: 1,
      name: "Cloves",
    },
    orderBy: {
      name: "asc",
    },
    take: 1,
  });

  const allFlowFiles = (await listFilesRecursively(FLOWS_FOLDER)).filter(
    (filePath: string) => {
      const filename = path.basename(filePath);
      return filename.startsWith("Flows_") && filename.endsWith(".csv.gz");
    }
  );

  // Process each food group
  for (const foodGroup of foodGroups) {
    // Find all files for this food group
    const foodGroupFiles = allFlowFiles.filter((filePath: string) => {
      const filename = path.basename(filePath);

      // First normalize any special spaces to regular spaces
      const normalizedFilename = filename.replace(/[\u00A0\s]+/g, " ").trim();
      const normalizedFoodGroup = foodGroup.name
        .replace(/[\u00A0\s]+/g, " ")
        .trim();

      // Then encode
      const encodedFilename = encodeURIComponent(normalizedFilename);
      const encodedFoodGroup = encodeURIComponent(normalizedFoodGroup);

      return encodedFilename.includes(encodedFoodGroup);
    });

    if (foodGroupFiles.length === 0) {
      log(`No flow files found for ${foodGroup.name}`);
      continue;
    }

    // Delete existing flows for this food group
    await cascadeDeleteFlows(prisma, foodGroup.id, foodGroup.name);
    log(`Cleared existing flows for ${foodGroup.name}`);

    // Process each file for this food group
    for (const filePath of foodGroupFiles) {
      log(`Ingesting flows for ${foodGroup.name} from ${filePath}...`);
      try {
        await ingestFlowFile(prisma, {
          path: filePath,
          size: fs.statSync(filePath).size,
          foodGroup,
        });
        logFileIngest(`Ingested flows for ${foodGroup.name} from ${filePath}`);
      } catch (error) {
        logFileIngest(
          `Error ingesting flows for ${foodGroup.name} from ${filePath}`
        );
        logFileIngest(error as Error);
      }
    }

    log(`Completed ingestion for ${foodGroup.name}`);
  }
};

async function ingestFlowFile(
  prisma: PrismaClient,
  foodGroupFile: FoodGroupFile
) {
  const { foodGroup } = foodGroupFile;
  log(`Ingesting flows for ${foodGroup.id} - ${foodGroup.name}...`);

  let filePath = foodGroupFile.path;

  let flowType: FlowType;

  if (filePath.includes("Sea_Domestic")) {
    flowType = FlowType.SEA_DOMESTIC;
  } else if (filePath.includes("Sea_ReExports")) {
    flowType = FlowType.SEA_REEXPORT;
  } else if (filePath.includes("Land_Domestic")) {
    flowType = FlowType.LAND_DOMESTIC;
  } else if (filePath.includes("Land_ReExports")) {
    flowType = FlowType.LAND_REEXPORT;
  } else if (filePath.includes("Within_Country")) {
    flowType = FlowType.WITHIN_COUNTRY;
  } else {
    throw new Error(`Unknown flow type for file ${filePath}`);
  }

  if (filePath.endsWith(".gz")) {
    const expandedFilePath = foodGroupFile.path.replace(".gz", "");
    await execa(`gunzip -c "${foodGroupFile.path}" > "${expandedFilePath}"`, {
      shell: true, // Use shell mode to support shell syntax like redirection
    });
    filePath = expandedFilePath;
    log("Expanded file...");
  }

  const flowsTempFile = path.join(SEED_DATA_PATH, `flows_${foodGroup.id}.csv`);
  await fs.remove(flowsTempFile);
  const flowsTempFileWriteStream = await fs.createWriteStream(flowsTempFile);

  const flowsSegmentsTempFile = path.join(
    SEED_DATA_PATH,
    `flow_segments_${foodGroup.id}.csv`
  );
  await fs.remove(flowsSegmentsTempFile);
  const flowsSegmentsTempFileWriteStream = await fs.createWriteStream(
    flowsSegmentsTempFile
  );

  const flowsSegmentsEdgesTempFile = path.join(
    SEED_DATA_PATH,
    `flow_segments_edges_${foodGroup.id}.csv`
  );
  await fs.remove(flowsSegmentsEdgesTempFile);
  const flowsSegmentsEdgesTempFileWriteStream = await fs.createWriteStream(
    flowsSegmentsEdgesTempFile
  );
  log(
    "Created temporary files for flows, flow segments and flow segments edges..."
  );

  // Create a table for the CSV data
  await memoryDb.exec(`
    DROP TABLE IF EXISTS data;
    CREATE TABLE data (
      id INTEGER PRIMARY KEY,
      food_group_id INTEGER,
      flow_id TEXT,
      flow_segment_id TEXT,
      edge_id TEXT,
      from_id_admin TEXT,
      to_id_admin TEXT,
      flow_value REAL,
      mode TEXT,
      segment_order INTEGER,
      paths_string TEXT
    );
  `);

  log("Created data table in memory database to ingest CSV Data...");

  await new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);

    const parseStream = parse({
      columns: true,
      skip_empty_lines: true,
    });

    readStream
      .pipe(parseStream)
      .on("data", async (row) => {
        try {
          const flowId = `${row.from_id_admin}-${row.to_id_admin}-${foodGroup.id}-${flowType}-${row.flow_value}`;

          const csvRowSegmentOrder = row.path_num || row.segment_order;

          const csvRowMode = row.mode || "unknown";

          const flowSegmentId = crypto
            .createHash("md5")
            .update(`${flowId}-${csvRowMode}-${csvRowSegmentOrder}`)
            .digest("hex");

          const edgeId = `${row.from_id_admin}-${row.to_id_admin}`;

          await memoryDb.run(
            "INSERT INTO data (food_group_id, flow_id, flow_segment_id, edge_id, from_id_admin, to_id_admin, flow_value, mode, segment_order, paths_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              foodGroup.id,
              flowId,
              flowSegmentId,
              edgeId,
              row.from_id_admin,
              row.to_id_admin,
              parseFloat(row.flow_value),
              csvRowMode,
              parseInt(csvRowSegmentOrder),
              row.paths?.replace(/['"[\]\s]/g, ""),
            ]
          );
        } catch (error) {
          reject(error);
        }
      })
      .on("end", () => {
        readStream.close();
      })
      .on("close", () => {
        resolve();
      })
      .on("error", (error) => {
        reject(error);
      });
  });
  log("Parsed CSV file into memory...");

  const flows = await memoryDb.all(
    `SELECT DISTINCT flow_id, from_id_admin, to_id_admin, flow_value FROM data;`
  );
  log("Loaded flows into memory...");

  for (const flow of flows) {
    const { flow_id, from_id_admin, to_id_admin, flow_value } = flow;

    await flowsTempFileWriteStream.write(
      `${flow_id},${from_id_admin},${to_id_admin},${flow_value},${foodGroup.id},${flowType}\n`
    );
  }

  await flowsTempFileWriteStream.end();
  log(`Wrote flows to file ${flowsTempFile}...`);

  const copyFlowsCommand = `COPY \\"Flow\\" ("id", \\"fromAreaId\\", \\"toAreaId\\", "value", \\"foodGroupId\\", \\"type\\") FROM '${flowsTempFile}' WITH (FORMAT CSV, DELIMITER ',');`;
  await execa(
    `psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyFlowsCommand}"`,
    {
      shell: true,
    }
  );
  log("Copied flows to database...");

  // Delete duplicate flow segments by keeping only the first occurrence
  await memoryDb.exec(`
  WITH ranked_segments AS (
      SELECT
        id,
        flow_segment_id,
        ROW_NUMBER() OVER (PARTITION BY flow_segment_id ORDER BY id) AS rn
      FROM data
    )
    DELETE FROM data
    WHERE id IN (
      SELECT id
      FROM ranked_segments
      WHERE rn > 1
    );
  `);
  log("Deleted duplicate flow segments...");

  await memoryDb.exec(`
    CREATE TABLE IF NOT EXISTS flow_segments_edges_memory (
      flow_segment_id TEXT,
      edge_id TEXT,
      flow_segment_edge_order INTEGER
    );
  `);

  log("Created in-memory table for flow segments edges...");

  let remainingFlowSegmentsEdges = (
    await memoryDb.get(`SELECT count(*) from data;`)
  )["count(*)"];
  const batchSize = 100000;
  let currentBatch = 0;

  while (remainingFlowSegmentsEdges > 0) {
    const flowSegmentsEdgesBatch = await memoryDb.all(
      `SELECT * FROM data LIMIT ${batchSize} OFFSET ${currentBatch * batchSize};`
    );

    const flowSegmentEdges = [] as [string, string, number][];

    flowSegmentsEdgesBatch.forEach(
      ({ flow_segment_id, flow_id, mode, segment_order, paths_string }) => {
        flowsSegmentsTempFileWriteStream.write(
          `${flow_segment_id},${flow_id},${mode},${segment_order}\n`
        );

        const paths = paths_string.split(",");
        paths.forEach((edgeId: string, i: number) => {
          const order = i + 1;

          flowSegmentEdges.push([flow_segment_id, edgeId, order]);
        });
      }
    );

    await memoryDb.exec("BEGIN TRANSACTION;");
    const insertStatement = await memoryDb.prepare(
      `INSERT INTO flow_segments_edges_memory (flow_segment_id, edge_id, flow_segment_edge_order) VALUES (?, ?, ?);`
    );

    for (const edge of flowSegmentEdges) {
      await insertStatement.run(edge);
    }

    await memoryDb.exec("COMMIT;");
    await insertStatement.finalize();

    remainingFlowSegmentsEdges -= batchSize;
    currentBatch += 1;
    log(`Processed ${flowSegmentsEdgesBatch.length} flow segments edges...`);
  }

  // Delete not found edges
  await memoryDb.exec(`
    DELETE FROM flow_segments_edges_memory
    WHERE edge_id NOT IN (SELECT id FROM edges);
  `);
  log("Deleted flow segments edges not found in edges...");

  // write flow segments edges to file
  const flowSegmentsEdgesFinal = await memoryDb.all(
    `SELECT flow_segment_id, edge_id, flow_segment_edge_order FROM flow_segments_edges_memory`
  );

  flowSegmentsEdgesFinal.forEach(
    ({ flow_segment_id, edge_id, flow_segment_edge_order }) => {
      flowsSegmentsEdgesTempFileWriteStream.write(
        `${flow_segment_id},${edge_id},${flow_segment_edge_order}\n`
      );
    }
  );

  const copyFlowSegmentsCommand = `COPY \\"FlowSegment\\" (id, \\"flowId\\", mode, \\"order\\") FROM '${flowsSegmentsTempFile}' WITH (FORMAT CSV, DELIMITER ',');`;

  await execa(
    `psql -d ${POSTGRES_CONNECTION_STRING} -c "${copyFlowSegmentsCommand}"`,
    {
      shell: true,
    }
  );
  log("Copied flow segments to database...");

  // Copy flow segments edges to final table
  const copyFlowSegmentsEdgesCommand = `COPY \\"FlowSegmentEdges\\" (\\"flowSegmentId\\", \\"edgeId\\", \\"order\\") FROM '${flowsSegmentsEdgesTempFile}' WITH (FORMAT CSV, DELIMITER ',');`;
  await execa(
    `psql -d ${POSTGRES_CONNECTION_STRING}  -c "${copyFlowSegmentsEdgesCommand}"`,
    {
      shell: true,
    }
  );
  log("Copied flow segments edges to database...");

  await flowsTempFileWriteStream.close();
  await flowsSegmentsTempFileWriteStream.close();
  await flowsSegmentsEdgesTempFileWriteStream.close();

  await fs.remove(flowsTempFile);
  await fs.remove(flowsSegmentsTempFile);
  await fs.remove(flowsSegmentsEdgesTempFile);
  log("Cleaned up temporary csv files...");
}

async function loadEdgeIds() {
  const diskDb = await open({
    filename: EDGE_IDS_SQLITE_DB_PATH,
    driver: sqlite3.Database,
  });

  await memoryDb.exec(`CREATE TABLE edges (id TEXT PRIMARY KEY);`);

  log("Created edges table in memory database...");

  // Use ATTACH DATABASE to connect disk and memory databases
  await memoryDb.exec(
    `ATTACH DATABASE '${EDGE_IDS_SQLITE_DB_PATH}' AS diskdb;`
  );
  log("Attached disk database to memory database...");

  // Bulk insert from disk to memory
  await memoryDb.exec(`INSERT INTO edges SELECT id FROM diskdb.edges;`);

  log("Bulk inserted edge IDs into memory database...");

  // Detach the disk database
  await memoryDb.exec(`DETACH DATABASE diskdb;`);

  // Close the disk database connection
  await diskDb.close();

  // log edges count
  const edgesCount = await memoryDb.get("SELECT COUNT(*) as count FROM edges;");
  log(`Loaded ${edgesCount.count} edge IDs into memory database.`);

  log("Completed loading edge IDs into memory database.");
}

async function cascadeDeleteFlows(
  prisma: PrismaClient,
  foodGroupId: number,
  foodGroupName: string
) {
  await prisma.$transaction(async (tx) => {
    // Delete FlowSegmentEdges
    await tx.$executeRaw`
        DELETE FROM "FlowSegmentEdges"
        WHERE "flowSegmentId" IN (
          SELECT "FlowSegment".id
          FROM "FlowSegment"
          JOIN "Flow" ON "FlowSegment"."flowId" = "Flow".id
          WHERE "Flow"."foodGroupId" = ${foodGroupId}
        )
      `;
    log(`Deleted FlowSegmentEdges for ${foodGroupName}...`);

    // Delete FlowSegments
    await tx.$executeRaw`
        DELETE FROM "FlowSegment"
        WHERE "flowId" IN (
          SELECT id FROM "Flow"
          WHERE "foodGroupId" = ${foodGroupId}
        )
      `;
    log(`Deleted FlowSegments for ${foodGroupName}...`);

    // Delete Flows
    await tx.$executeRaw`
        DELETE FROM "Flow"
        WHERE "foodGroupId" = ${foodGroupId}
      `;
    log(`Deleted Flows for ${foodGroupName}...`);
  });

  log(`Completed cascading delete for ${foodGroupName}`);
}
