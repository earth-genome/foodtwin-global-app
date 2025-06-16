/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import pLimit from "p-limit";
import "dotenv-flow/config";

const dbClient = new PrismaClient();

// Configuration
const UPDATE_BATCH_SIZE = 500;
const CONCURRENT_QUERIES = 20;
const GEOMETRY_SIMPLIFICATION_TOLERANCE = 1;
const COORDINATE_PRECISION_GRID = 0.01;

interface CountResult {
  count: bigint;
}

async function updateFlowGeometriesGeojson() {
  console.log("Starting flow geometry GeoJSON update for all flows...");
  console.log(`Batch Size: ${UPDATE_BATCH_SIZE}`);
  console.log(`Concurrent Queries: ${CONCURRENT_QUERIES}`);
  console.log(
    `Simplification tolerance: ${GEOMETRY_SIMPLIFICATION_TOLERANCE}m`
  );
  console.log(`Coordinate precision grid: ${COORDINATE_PRECISION_GRID}m`);

  const startTime = Date.now();

  try {
    // Get total count of geometries without geojson
    const totalResult = await dbClient.$queryRaw<CountResult[]>`
      SELECT COUNT(*) as count FROM "FlowGeometry";
    `;
    const totalGeometries = Number(totalResult[0].count);

    console.log(`Total flow geometries to process: ${totalGeometries}`);

    if (totalGeometries === 0) {
      console.log("No flow geometries found. Process complete.");
      return;
    }

    // Create a limit function to control concurrency
    const limit = pLimit(CONCURRENT_QUERIES);
    let processed = 0;
    let completed = 0;
    let offset = 0;

    // Create all tasks upfront
    const tasks: Promise<void>[] = [];

    while (processed < totalGeometries) {
      const currentOffset = offset;
      const batchSize = Math.min(
        UPDATE_BATCH_SIZE,
        totalGeometries - processed
      );

      const task = limit(async () => {
        try {
          await dbClient.$executeRaw`
            UPDATE "FlowGeometry" 
            SET "geojson" = (
              SELECT ST_AsGeoJSON(
                ST_ReducePrecision(
                  ST_SimplifyPreserveTopology(
                    ST_LineMerge(geometry),
                    ${GEOMETRY_SIMPLIFICATION_TOLERANCE}
                  ),
                  ${COORDINATE_PRECISION_GRID}
                ),
                4326
              )::jsonb
            )
            WHERE id IN (
              SELECT id FROM "FlowGeometry" 
              ORDER BY id 
              LIMIT ${batchSize} OFFSET ${currentOffset}
            );
          `;

          completed += batchSize;
          const totalDuration = (Date.now() - startTime) / 1000 / 60; // total minutes
          const cumulativeThroughput = completed / totalDuration; // overall geom/min

          console.log(
            `Completed: ${completed}/${totalGeometries} | ` +
              `Offset: ${currentOffset} | ` +
              `Batch size: ${batchSize} | ` +
              `Cumulative throughput: ${cumulativeThroughput.toFixed(0)} geom/min`
          );
        } catch (error) {
          console.error(
            `Error processing batch at offset ${currentOffset}:`,
            error
          );
          throw error;
        }
      });

      tasks.push(task);
      processed += batchSize;
      offset += batchSize;
    }

    console.log(`Created ${tasks.length} tasks, starting execution...`);

    await Promise.all(tasks);

    const remainingResult = await dbClient.$queryRaw<CountResult[]>`
      SELECT COUNT(*) as count FROM "FlowGeometry" 
      WHERE "geojson" IS NULL;
    `;
    const remainingGeometries = Number(remainingResult[0].count);

    if (remainingGeometries > 0) {
      console.warn(
        `WARNING: ${remainingGeometries} flow geometries still don't have geojson.`
      );
    } else {
      console.log("All flow geometries now have optimized GeoJSON!");
    }

    const totalDuration = (Date.now() - startTime) / 1000;
    const finalThroughput = (completed / totalDuration) * 60;
    console.log(
      `Flow geometry GeoJSON update completed in ${totalDuration.toFixed(2)}s! ` +
        `Final throughput: ${finalThroughput.toFixed(0)} geom/min`
    );
  } catch (error) {
    console.error("An error occurred during the process:", error);
  } finally {
    await dbClient.$disconnect();
    console.log("Prisma client disconnected.");
  }
}

updateFlowGeometriesGeojson();
