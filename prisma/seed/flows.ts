import fs from "fs-extra";
import path from "path";
import { execa } from "execa";
import { parse } from "csv-parse";
import { Prisma, PrismaClient } from "@prisma/client";
import { generateNumericId, listFilesRecursively, log } from "./utils";

import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import {
  FLOWS_FOLDER,
  POSTGRES_CONNECTION_STRING,
  SEED_DATA_PATH,
} from "./config";
import { splitLineAtAntimeridian } from "../../lib/split-line-at-antimeridian";

const TRANSACTION_TIMEOUT = 60 * 60 * 1000;
const SKIP_FOOD_GROUPS = 0; // Skip food groups that have already been ingested
const FLOW_FILE_SIZE_LIMIT_MB = 10;

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
  flowType: FlowType;
}

interface FlowData {
  from_id_admin: string;
  to_id_admin: string;
  flow_value: string;
  path_num?: string;
  segment_order?: string;
  mode?: string;
  paths?: string;
}

let memoryDb: Database;
let edgesId: Record<string, number>;

const newFlowGeometries = new Map<
  string,
  {
    edges: number[];
    fromAreaId: string;
    toAreaId: string;
    sourceFlowId: bigint;
  }
>();

export const ingestFlows = async (
  prisma: PrismaClient,
  specificFoodGroups?: { id: number; name: string }[]
) => {
  memoryDb = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  // Edges are loaded into memory to avoid multiple queries
  const edges = await prisma.edge.findMany({
    select: {
      id: true,
      id_str: true,
    },
  });

  // Map edges string ids to numeric ids
  edgesId = edges.reduce(
    (acc, { id, id_str }) => {
      acc[id_str] = id;
      return acc;
    },
    {} as Record<string, number>
  ) as Record<string, number>;

  const foodGroups =
    specificFoodGroups ||
    (await prisma.foodGroup.findMany({
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
    }));

  log(`Listing available flow files...`);
  const allFlowFiles = (await listFilesRecursively(FLOWS_FOLDER)).filter(
    (filePath: string) => {
      // Skip the AdditionalFiles directory entirely
      if (filePath.includes("/AdditionalFiles/")) {
        return false;
      }
      const filename = path.basename(filePath);
      // Only include files from foodgroup1 directories
      return (
        filename.startsWith("Flows_") &&
        filename.endsWith(".csv.gz") &&
        filePath.includes("/foodgroup1/")
      );
    }
  );

  log("Clearing all flows...");
  await prisma.$executeRaw`TRUNCATE "Flow" RESTART IDENTITY CASCADE`;

  // Process each food group
  for (const foodGroup of foodGroups) {
    log(`Clearing flows for ${foodGroup.name}`);
    await cascadeDeleteFoodGroupFlows(prisma, foodGroup.id, foodGroup.name);

    // Clear any expanded csv flow files from previous runs before starting
    const expandedCsvFlowFiles = (
      await listFilesRecursively(FLOWS_FOLDER)
    ).filter((filePath: string) => {
      // Skip the AdditionalFiles directory entirely
      if (filePath.includes("/AdditionalFiles/")) {
        return false;
      }
      const filename = path.basename(filePath);
      return filename.startsWith("Flows_") && filename.endsWith(".csv");
    });

    for (const expandedCsvFlowFile of expandedCsvFlowFiles) {
      await fs.remove(expandedCsvFlowFile);
    }

    // Find all files for this food group
    const foodGroupFiles = allFlowFiles
      .filter((filePath: string) => {
        const filename = path.basename(filePath);

        // First normalize any special spaces to regular spaces
        const normalizedFilename = filename
          .replace("Flows_", "")
          .replace(".csv.gz", "")
          .replace(/[\u00A0\s]+/g, " ")
          .replace(/_/g, " ") // replace underscores with spaces
          .trim();
        const normalizedFoodGroup = foodGroup.name
          .replace(/[\u00A0\s]+/g, " ") // Normalize spaces
          .trim();

        const encodedFilename = encodeURIComponent(normalizedFilename);
        const encodedFoodGroup = encodeURIComponent(normalizedFoodGroup);

        return encodedFilename === encodedFoodGroup;
      })
      .map((filePath) => {
        // Determine flow type based on the directory structure
        let flowType: FlowType;
        if (filePath.includes("/Sea_Domestic/")) {
          flowType = FlowType.SEA_DOMESTIC;
        } else if (filePath.includes("/Sea_ReExports/")) {
          flowType = FlowType.SEA_REEXPORT;
        } else if (filePath.includes("/Land_Domestic/")) {
          flowType = FlowType.LAND_DOMESTIC;
        } else if (filePath.includes("/Land_ReExports/")) {
          flowType = FlowType.LAND_REEXPORT;
        } else if (filePath.includes("/Within_Country/")) {
          flowType = FlowType.WITHIN_COUNTRY;
        } else {
          throw new Error(`Unknown flow type for file ${filePath}`);
        }

        return {
          path: filePath,
          size: fs.statSync(filePath).size,
          foodGroup,
          flowType,
        };
      });

    if (foodGroupFiles.length === 0) {
      log(`No flow files found for ${foodGroup.name}`);
      continue;
    }

    // Process each file for this food group
    for (const foodGroupFile of foodGroupFiles) {
      log(
        `Ingesting flows for ${foodGroup.name} from ${foodGroupFile.path}...`
      );
      try {
        await ingestFlowFile(prisma, foodGroupFile, foodGroupFile.flowType);
        logFileIngest(
          `Ingested flows for ${foodGroup.name} from ${foodGroupFile.path}`
        );
      } catch (error) {
        logFileIngest(
          `Error ingesting flows for ${foodGroup.name} from ${foodGroupFile.path}`
        );
        logFileIngest(error as Error);
      }
    }

    log(`Completed ingestion for ${foodGroup.name}`);
  }
};

async function ingestFlowFile(
  prisma: PrismaClient,
  foodGroupFile: FoodGroupFile,
  flowType: FlowType
) {
  const { foodGroup } = foodGroupFile;
  log(`Ingesting flows for ${foodGroup.id} - ${foodGroup.name}...`);

  // Check if the file is too large to ingest
  const fileSize = fs.statSync(foodGroupFile.path).size;
  const sizeMB = fileSize / (1024 * 1024);
  if (sizeMB > FLOW_FILE_SIZE_LIMIT_MB) {
    log(`Skipping large file (${sizeMB.toFixed(1)}MB)`);
    return;
  }
  // Query existing flow geometries for this run
  const existingGeometriesQueryResult = (await prisma.$queryRaw`
    SELECT 
      CAST("fromAreaId" AS TEXT) || '_' || CAST("toAreaId" AS TEXT) AS id_str
    FROM "FlowGeometry"
  `) as { id_str: string }[];

  const existingFlowGeometriesIds = new Set(
    existingGeometriesQueryResult.map(
      (geometry: { id_str: string }) => geometry.id_str
    )
  );

  let filePath = foodGroupFile.path;
  let expandedFilePath = "";

  // Only gunzip if the file is gzipped
  if (filePath.endsWith(".gz")) {
    expandedFilePath = foodGroupFile.path.replace(".gz", "");
    await execa(`gunzip -c "${foodGroupFile.path}" > "${expandedFilePath}"`, {
      shell: true, // Use shell mode to support shell syntax like redirection
    });
    filePath = expandedFilePath;
    log("Expanded file...");
  }

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
      .on("data", async (row: FlowData) => {
        try {
          const flowCompositeId = `${row.from_id_admin}-${row.to_id_admin}-${foodGroup.id}-${flowType}-${row.flow_value}`;

          const flowId = generateNumericId(flowCompositeId);

          const flowGeometryId = `${row.from_id_admin}_${row.to_id_admin}`;
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
            .filter((edgeId): edgeId is number => typeof edgeId === "number")
            .join(",");

          // Append edges to flowGeometries
          if (!existingFlowGeometriesIds.has(flowGeometryId) && pathsCsv) {
            const newFlowGeometry = newFlowGeometries.get(flowGeometryId);
            const newEdges = pathsCsv.split(",").map(Number);

            if (newFlowGeometry && newFlowGeometry.sourceFlowId === flowId) {
              newFlowGeometry.edges.push(...newEdges);
            } else {
              newFlowGeometries.set(flowGeometryId, {
                edges: newEdges,
                fromAreaId: row.from_id_admin,
                toAreaId: row.to_id_admin,
                sourceFlowId: flowId,
              });
            }
          }

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
              parseInt(csvRowSegmentOrder || "0"),
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

  await flowsTempFileWriteStream.close();

  for (const [newFlowGeometryId, newFlowGeometryData] of newFlowGeometries) {
    // Query again to ensure we have the latest geometries (in case of race conditions)
    if (existingFlowGeometriesIds.has(newFlowGeometryId)) {
      log(`Skipping existing flow geometry for ${newFlowGeometryId}`);
      continue;
    }

    const newFlowGeometryEdges = (await prisma.$queryRaw<
      { id: number; geojson: string }[]
    >`
      SELECT "id", ST_AsGeoJSON(geom) AS geojson
      FROM "Edge"
      WHERE "id" IN (${Prisma.join(newFlowGeometryData.edges)})
      AND "id" IS NOT NULL;
    `) as unknown as { id: number; geojson: string }[];

    // Skip if no valid edges found
    if (newFlowGeometryEdges.length === 0) {
      log(
        `No valid edges found for flow geometry ${newFlowGeometryId}, skipping...`
      );
      continue;
    }

    // Merge the geometries into a single linestring
    const mergedEdgesLinestring = newFlowGeometryData.edges
      .map((edgeId) => newFlowGeometryEdges.find((edge) => edge.id === edgeId))
      .filter((edge) => edge !== undefined)
      .map((edge) => JSON.parse(edge.geojson))
      .reduce(
        (acc, edge) => {
          const edgeCoordinates =
            edge.type === "LineString"
              ? edge.coordinates
              : edge.coordinates.flat();

          acc.coordinates.push(...edgeCoordinates);

          return acc;
        },
        { type: "LineString", coordinates: [] }
      );

    // Skip if no coordinates were found
    if (mergedEdgesLinestring.coordinates.length === 0) {
      log(
        `No coordinates found for flow geometry ${newFlowGeometryId}, skipping...`
      );
      continue;
    }

    const mergedEdgesMultiLineString = splitLineAtAntimeridian(
      mergedEdgesLinestring
    );
    const mergedGeometryString = JSON.stringify(mergedEdgesMultiLineString);

    try {
      // insert the new flow geometry
      await prisma.$executeRaw`
        INSERT INTO "FlowGeometry" ("fromAreaId", "toAreaId", "geometry")
        VALUES (
          ${newFlowGeometryData.fromAreaId},
          ${newFlowGeometryData.toAreaId},        
          ST_SetSRID(ST_GeomFromGeoJSON(${mergedGeometryString}), 4326)
        );
      `;
      existingFlowGeometriesIds.add(newFlowGeometryId);
      log(`Inserted new flow geometry for ${newFlowGeometryId}`);
    } catch (error) {
      // If we get a unique constraint violation, the geometry was inserted by another process
      // Just add it to our set and continue
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "23505"
      ) {
        log(
          `Flow geometry ${newFlowGeometryId} already exists in database, skipping...`
        );
        existingFlowGeometriesIds.add(newFlowGeometryId);
      } else {
        throw error;
      }
    }
  }

  await fs.remove(expandedFilePath);
  await fs.remove(flowsTempFile);
  log("Cleaned up temporary csv files...");

  // Clear the newFlowGeometries Map after we've inserted all geometries
  newFlowGeometries.clear();
  log("Cleared newFlowGeometries Map...");
}

// Restore cascadeDeleteFoodGroupFlows
async function cascadeDeleteFoodGroupFlows(
  prisma: PrismaClient,
  foodGroupId: number,
  foodGroupName: string
) {
  await prisma.$transaction(
    async (tx) => {
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
