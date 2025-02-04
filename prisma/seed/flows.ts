import fs from "fs-extra";
import path from "path";
import pLimit from "p-limit";
import { execa } from "execa";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";
import { generateNumericId, listFilesRecursively, log } from "./utils";

import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import {
  FLOWS_FOLDER,
  POSTGRES_CONNECTION_STRING,
  SEED_DATA_PATH,
} from "./config";

const BATCH_SIZE = 500;
const WORKER_COUNT = 5;
const TRANSACTION_TIMEOUT = 60 * 60 * 1000;
const SKIP_FOOD_GROUPS = 0; // Skip food groups that have already been ingested

const limit = pLimit(WORKER_COUNT);

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
let edgesId: Record<string, number>;

export const ingestFlows = async (prisma: PrismaClient) => {
  memoryDb = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  const edges = await prisma.edge.findMany({
    select: {
      id: true,
      id_str: true,
    },
  });

  edgesId = edges.reduce(
    (acc, { id, id_str }) => {
      acc[id_str] = id;
      return acc;
    },
    {} as Record<string, number>
  ) as Record<string, number>;

  const foodGroups = await prisma.foodGroup.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      level: 1,
    },
    orderBy: {
      name: "asc",
    },
    skip: SKIP_FOOD_GROUPS,
  });

  const allFlowFiles = (await listFilesRecursively(FLOWS_FOLDER)).filter(
    (filePath: string) => {
      const filename = path.basename(filePath);
      return filename.startsWith("Flows_") && filename.endsWith(".csv.gz");
    }
  );

  log("Clearing all flows...");
  await prisma.$executeRaw`TRUNCATE "Flow" RESTART IDENTITY CASCADE`;

  log(`Dropping indexes for FlowSegmentEdges`);
  await dropFlowSegmentEdgesIndexes(prisma);

  // Process each food group
  for (const foodGroup of foodGroups) {
    // Clear any expanded csv flow files from previous runs before starting
    const expandedCsvFlowFiles = (
      await listFilesRecursively(FLOWS_FOLDER)
    ).filter((filePath: string) => {
      const filename = path.basename(filePath);
      return filename.startsWith("Flows_") && filename.endsWith(".csv");
    });

    for (const expandedCsvFlowFile of expandedCsvFlowFiles) {
      await fs.remove(expandedCsvFlowFile);
    }

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

  log("Recreating indexes for FlowSegmentEdges");
  await createFlowSegmentEdgesIndexes(prisma);
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

  const expandedFilePath = foodGroupFile.path.replace(".gz", "");
  await execa(`gunzip -c "${foodGroupFile.path}" > "${expandedFilePath}"`, {
    shell: true, // Use shell mode to support shell syntax like redirection
  });
  filePath = expandedFilePath;
  log("Expanded file...");

  const flowsTempFile = path.join(SEED_DATA_PATH, `flows_${foodGroup.id}.csv`);
  await fs.remove(flowsTempFile);
  const flowsTempFileWriteStream = await fs.createWriteStream(flowsTempFile);
  log("Created temporary files for flows ...");

  // Create a table for the CSV data
  await memoryDb.exec(`
    DROP TABLE IF EXISTS data;
    CREATE TABLE data (
      id INTEGER PRIMARY KEY,
      food_group_id INTEGER,
      flow_id INTEGER,
      flow_segment_id INTEGER,
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
          const flowCompositeId = `${row.from_id_admin}-${row.to_id_admin}-${foodGroup.id}-${flowType}-${row.flow_value}`;

          const flowId = generateNumericId(flowCompositeId);

          const csvRowSegmentOrder = row.path_num || row.segment_order;

          const csvRowMode = row.mode || "unknown";

          const flowSegmentId = generateNumericId(
            `${flowCompositeId}-${csvRowMode}-${csvRowSegmentOrder}`
          );
          // Discard paths not present in edges table, which should be roads edges not displayed in the map
          const pathsCsv = row.paths
            ?.replace(/['"[\]\s]/g, "")
            .split(",")
            .map((path: string) => edgesId[path])
            .filter((edgeId: string | undefined) => edgeId)
            .join(",");

          await memoryDb.run(
            "INSERT INTO data (food_group_id, flow_id, flow_segment_id, from_id_admin, to_id_admin, flow_value, mode, segment_order, paths_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              foodGroup.id,
              flowId.toString(),
              flowSegmentId.toString(),
              row.from_id_admin,
              row.to_id_admin,
              parseFloat(row.flow_value),
              csvRowMode,
              parseInt(csvRowSegmentOrder),
              pathsCsv,
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

  await memoryDb.exec(`
    CREATE TABLE IF NOT EXISTS flow_segments_edges_memory (
      flow_segment_id INTEGER,
      edge_id TEXT,
      flow_segment_edge_order INTEGER
    );
  `);

  log("Created in-memory table for flow segments edges...");

  await prisma.$executeRaw`ALTER TABLE "FlowSegment" DISABLE TRIGGER ALL;`;
  await prisma.$executeRaw`ALTER TABLE "FlowSegmentEdges" DISABLE TRIGGER ALL;`;

  const flowSegmentsEdgesCount = (
    await memoryDb.get(`SELECT count(*) from data;`)
  )["count(*)"];
  const batchCount = Math.ceil(flowSegmentsEdgesCount / BATCH_SIZE);
  const batchPromises = [] as Promise<void>[];
  let batchesToIngest = batchCount;

  await prisma.$transaction(
    async (tx) => {
      for (let i = 0; i < batchCount; i += 1) {
        batchPromises.push(
          limit(async () => {
            const flowSegmentsBatch = await memoryDb.all(
              `SELECT * FROM data LIMIT ${BATCH_SIZE} OFFSET ${BATCH_SIZE * i};`
            );

            const flowSegments = [] as [number, number, string, number][];
            const flowSegmentEdges = [] as [number, number, number][];
            flowSegmentsBatch.forEach(
              ({
                flow_segment_id,
                flow_id,
                mode,
                segment_order,
                paths_string,
              }) => {
                flowSegments.push([
                  flow_segment_id,
                  flow_id,
                  mode,
                  segment_order,
                ]);
                if (paths_string.length === 0) {
                  return;
                }
                const paths = paths_string
                  .split(",")
                  .map((path: string) => parseInt(path));
                paths.forEach((edgeId: number, i: number) => {
                  const order = i + 1;
                  flowSegmentEdges.push([flow_segment_id, edgeId, order]);
                });
              }
            );

            await tx.flowSegment.createMany({
              data: flowSegments.map(([id, flowId, mode, order]) => ({
                id,
                flowId,
                mode,
                order,
              })),
              skipDuplicates: true,
            });
            await tx.flowSegmentEdges.createMany({
              data: flowSegmentEdges.map(([flowSegmentId, edgeId, order]) => ({
                flowSegmentId,
                edgeId,
                order,
              })),
            });

            batchesToIngest -= 1;

            log(`Finished batch ${i + 1}, ${batchesToIngest} to go.`);
          })
        );
      }

      log("Waiting for all batches to complete...");

      await Promise.all(batchPromises);
    },
    {
      timeout: TRANSACTION_TIMEOUT,
    }
  );

  await prisma.$executeRaw`ALTER TABLE "FlowSegment" ENABLE TRIGGER ALL;`;
  await prisma.$executeRaw`ALTER TABLE "FlowSegmentEdges" ENABLE TRIGGER ALL;`;

  await flowsTempFileWriteStream.close();

  await fs.remove(expandedFilePath);
  await fs.remove(flowsTempFile);
  log("Cleaned up temporary csv files...");
}

async function cascadeDeleteFoodGroupFlows(
  prisma: PrismaClient,
  foodGroupId: number,
  foodGroupName: string
) {
  // Make sure indexes exists otherwise the delete will be slow
  await createFlowSegmentEdgesIndexes(prisma);

  await prisma.$transaction(
    async (tx) => {
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
    },
    {
      timeout: TRANSACTION_TIMEOUT,
    }
  );

  log(`Completed cascading delete for ${foodGroupName}`);
}

async function createFlowSegmentEdgesIndexes(prisma: PrismaClient) {
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "FlowSegmentEdges_edgeId_idx"
      ON public."FlowSegmentEdges" USING btree
      ("edgeId" ASC NULLS LAST)
      TABLESPACE pg_default;
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "FlowSegmentEdges_flowSegmentId_idx"
      ON public."FlowSegmentEdges" USING btree
      ("flowSegmentId" ASC NULLS LAST)
      TABLESPACE pg_default;
  `;

  log("Indexes created for FlowSegmentEdges");
}

// Function to drop indexes
async function dropFlowSegmentEdgesIndexes(prisma: PrismaClient) {
  await prisma.$executeRaw`
    DROP INDEX IF EXISTS public."FlowSegmentEdges_edgeId_idx";
  `;

  await prisma.$executeRaw`
    DROP INDEX IF EXISTS public."FlowSegmentEdges_flowSegmentId_idx";
  `;

  log("Indexes dropped for FlowSegmentEdges");
}
