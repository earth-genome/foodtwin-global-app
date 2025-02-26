/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * In this script we aim to get the first export hubs for each area, and the flows that go through them.
 * First, we query flows where the first segments end on a port
 * We then accumulate the sums per port
 * For the remaining flows, we get the next segment and repeat the process
 * Then we get the difference from the flows that passed through a port and the ones that didn't
 *
 */
async function main() {
  try {
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "idx_node_flow_aggregation";
      DROP MATERIALIZED VIEW IF EXISTS "NodeFlowAggregation";
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_flow_segment_edges" ON "FlowSegmentEdges" ("edgeId", "flowSegmentId");
      CREATE INDEX IF NOT EXISTS "idx_flow_area" ON "Flow" ("fromAreaId");
      CREATE INDEX IF NOT EXISTS "idx_node_type" ON "Node" ("type");
      CREATE INDEX IF NOT EXISTS "idx_flow_segment_composite" ON "FlowSegment" ("id", "flowId");
    `;

    await prisma.$executeRaw`
      CREATE MATERIALIZED VIEW "NodeFlowAggregation" AS      
        SELECT
            "Node"."id" ,
            "Flow"."fromAreaId" ,
            SUM("Flow"."value") AS flow_sum
        FROM
          "Node"
          JOIN
            "Edge" ON "Node"."id" = "Edge"."toNodeId"
          JOIN
            "FlowSegmentEdges" ON "Edge"."id" = "FlowSegmentEdges"."edgeId"
          JOIN
            "FlowSegment" ON "FlowSegmentEdges"."flowSegmentId" = "FlowSegment"."id"
          JOIN
            "Flow" ON "FlowSegment"."flowId" = "Flow"."id"
        WHERE
          "Node"."type" IN ('PORT', 'INLAND_PORT' , 'RAIL_STATION' ) 
        GROUP BY
          "Node"."id",
          "Flow"."fromAreaId"
        ORDER BY
          "Node"."id",
          "Flow"."fromAreaId"
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_node_flow_aggregation" ON "NodeFlowAggregation" ("id", "fromAreaId");
    `;
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
