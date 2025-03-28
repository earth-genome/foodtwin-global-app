/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv-flow").config();

const { PrismaClient, Prisma } = require("@prisma/client");
const pLimit = require("p-limit").default;

const prisma = new PrismaClient();

// --- Configuration ---
const BATCH_SIZE = 15;
const CONCURRENCY_LEVEL = 50;

// Create a limiter instance
const limit = pLimit(CONCURRENCY_LEVEL);

// Helper function to process a single batch based on offset
async function processBatchByOffset(offset: number): Promise<{
  offset: number;
  status: string;
  count: number | null;
  error?: unknown;
}> {
  const functionStart = Date.now();
  let batchPairs: { id: number }[] | null = null;
  try {
    batchPairs = await prisma.$queryRaw`
      SELECT id FROM "FlowPairs" ORDER BY id LIMIT ${BATCH_SIZE} OFFSET ${offset};
    `;
  } catch (fetchError) {
    console.error(`  [Offset ${offset}] Error fetching batch IDs:`, fetchError);
    return { offset, status: "fetch_error", count: null, error: fetchError };
  }

  if (!batchPairs || batchPairs.length === 0) {
    console.log(`  [Offset ${offset}] No pairs found, skipping.`);
    return { offset, status: "skipped", count: 0 };
  }

  const batchIds = batchPairs.map((pair) => pair.id);

  // Construct and execute the INSERT ... SELECT query
  const insertQuery = Prisma.sql`
      INSERT INTO "FlowPairsGeometries" (id, "fromAreaId", "toAreaId", geom)
      SELECT
          fp.id as id,
          fp."fromAreaId" as "fromAreaId", 
          fp."toAreaId" as "toAreaId",   
          ST_SimplifyPreserveTopology (ST_Transform (ST_Union (E.geom), 4326), 1000) AS geom
      FROM
          "FlowPairs" fp
      JOIN "FlowSegment" FS ON FS."flowId" = fp.id
      JOIN "FlowSegmentEdges" FSE ON FSE."flowSegmentId" = FS.id
      JOIN "Edge" E ON FSE."edgeId" = E.id
      WHERE
          fp.id IN (${Prisma.join(batchIds)})
      GROUP BY
          fp.id, fp."fromAreaId", fp."toAreaId"
      ON CONFLICT (id) DO NOTHING;
  `;

  try {
    const result = await prisma.$executeRaw(insertQuery);
    const duration = (Date.now() - functionStart) / 1000;
    console.log(
      `  [Offset ${offset}] Batch finished (${batchIds.length} IDs). Inserted (approx): ${result}. Duration: ${duration.toFixed(2)}s`
    );
    // Result of $executeRaw is often number of affected rows, may not be exact for ON CONFLICT
    return { offset, status: "success", count: batchIds.length };
  } catch (error) {
    const duration = (Date.now() - functionStart) / 1000;
    console.error(
      `  [Offset ${offset}] Error processing batch. Duration: ${duration.toFixed(2)}s`,
      error
    );
    return { offset, status: "error", count: null, error };
  }
}

async function main() {
  console.log("Starting geometry generation process...");
  console.log(`Batch Size: ${BATCH_SIZE}, Concurrency: ${CONCURRENCY_LEVEL}`);
  const overallStart = Date.now();

  try {
    // --- 1. Prerequisites ---
    console.log("Step 1: Preparing prerequisites...");
    // ... (Keep your prerequisite steps: Drop/Create View, Drop/Create Empty Table)
    // Ensure prerequisite steps are complete before parallel processing begins
    console.log("  - Dropping/Creating FlowPairs materialized view...");
    await prisma.$executeRaw`DROP MATERIALIZED VIEW IF EXISTS "FlowPairs" CASCADE;`;
    await prisma.$executeRaw`
      CREATE MATERIALIZED VIEW "FlowPairs" AS
      SELECT ANY_VALUE ("id") as "id", "fromAreaId", "toAreaId"
      FROM "Flow" GROUP BY "fromAreaId", "toAreaId";
    `;
    console.log("  - FlowPairs materialized view created.");
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "FlowPairs_id_idx" ON "FlowPairs" ("id");`;
      console.log("  - Index on FlowPairs(id) ensured.");
    } catch (indexError) {
      console.warn(
        "  - Could not create index on FlowPairs(id), might affect performance:"
      );
    }
    console.log("  - Dropping/Creating empty FlowPairsGeometries table...");
    await prisma.$executeRaw`DROP TABLE IF EXISTS "FlowPairsGeometries" CASCADE;`;
    await prisma.$executeRaw`
      CREATE TABLE "FlowPairsGeometries" (
        id BIGINT PRIMARY KEY, "fromAreaId" TEXT, "toAreaId" TEXT,
        geom GEOMETRY(Geometry, 4326)
      );
    `;
    console.log("  - Empty FlowPairsGeometries table created.");
    console.log("Step 1 finished.");

    // --- 2. Parallel Batch Processing ---
    console.log(`Step 2: Populating FlowPairsGeometries in parallel...`);

    const totalResult =
      await prisma.$queryRaw`SELECT COUNT(*) as count FROM "FlowPairs";`;
    const totalPairs = Number(totalResult[0].count);
    console.log(`  - Total flow pairs to process: ${totalPairs}`);

    if (totalPairs === 0) {
      console.log("  - No flow pairs found. Skipping population.");
    } else {
      // Generate all potential task offsets
      const offsets: number[] = [];
      for (let offset = 0; offset < totalPairs; offset += BATCH_SIZE) {
        offsets.push(offset);
      }
      console.log(`  - Creating ${offsets.length} batch tasks...`);

      // Map offsets to limited promises
      const tasks = offsets.map((offset) => {
        // Wrap the call to processBatchByOffset with the limiter
        return limit(() => processBatchByOffset(offset));
      });

      // Execute tasks concurrently, respecting the limit
      console.log(
        `  - Starting parallel execution (Max ${CONCURRENCY_LEVEL} concurrent batches)...`
      );
      const results = await Promise.allSettled(tasks);
      console.log(`  - Parallel execution finished.`);

      // Process results (optional: log errors, count successes)
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          if (result.value.status === "success") successCount++;
          if (result.value.status === "skipped") skippedCount++;
          if (result.value.status === "fetch_error") errorCount++; // Count fetch errors too
        } else {
          // result.status === 'rejected' - Should not happen often if processBatchByOffset catches errors
          errorCount++;
          console.error("  - Unhandled rejection:", result.reason);
        }
      });
      console.log(
        `  - Batch Results: ${successCount} succeeded, ${errorCount} failed, ${skippedCount} skipped.`
      );
      if (errorCount > 0) {
        console.warn(
          `  - WARNING: ${errorCount} batches encountered errors. Check logs above.`
        );
      }
    }
    console.log("Step 2 finished.");

    // --- 3. Post-Processing ---
    console.log("Step 3: Creating indexes on FlowPairsGeometries...");
    console.log("  - Creating GIST index on geom column...");
    await prisma.$executeRaw`CREATE INDEX "FlowPairsGeometries_geom" ON "FlowPairsGeometries" USING GIST (geom);`;
    console.log("  - Indexes created.");
    console.log("  - Analyzing FlowPairsGeometries table...");
    await prisma.$executeRaw`VACUUM ANALYZE "FlowPairsGeometries";`;
    console.log("Step 3 finished.");

    const overallDuration = (Date.now() - overallStart) / 1000;
    console.log(
      `Geometry generation process completed successfully in ${overallDuration.toFixed(2)}s!`
    );
  } catch (e) {
    console.error("An error occurred during the process:", e);
  } finally {
    console.log("Disconnecting Prisma client...");
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
  }
}

main();
