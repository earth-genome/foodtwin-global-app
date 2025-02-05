/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv-flow").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRaw`
      DROP MATERIALIZED VIEW IF EXISTS "EdgeFlowAggregation";
    `;

    await prisma.$executeRaw`
      CREATE MATERIALIZED VIEW "EdgeFlowAggregation" AS
        SELECT fse."edgeId", COUNT(fs."flowId") AS "flowCount", SUM(f.value) AS "flowSum"
        FROM public."FlowSegmentEdges" fse
        INNER JOIN public."FlowSegment" fs ON fse."flowSegmentId" = fs."id"
        INNER JOIN public."Flow" f ON fs."flowId" = f."id"
        GROUP BY fse."edgeId";
    `;
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
