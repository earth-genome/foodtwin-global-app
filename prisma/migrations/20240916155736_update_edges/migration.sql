-- Drop the materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS "EdgeFlowAggregation";

-- Remove refresh function
DROP FUNCTION IF EXISTS refresh_edge_flow_aggregation();

/*
  Warnings:

  - The primary key for the `Edge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Flow` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FlowSegment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `order` to the `FlowSegmentEdges` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FlowSegment" DROP CONSTRAINT "FlowSegment_flowId_fkey";

-- DropForeignKey
ALTER TABLE "FlowSegmentEdges" DROP CONSTRAINT "FlowSegmentEdges_edgeId_fkey";

-- DropForeignKey
ALTER TABLE "FlowSegmentEdges" DROP CONSTRAINT "FlowSegmentEdges_flowSegmentId_fkey";

-- AlterTable
ALTER TABLE "Edge" DROP CONSTRAINT "Edge_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Edge_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Edge_id_seq";

-- AlterTable
ALTER TABLE "Flow" DROP CONSTRAINT "Flow_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Flow_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Flow_id_seq";

-- AlterTable
ALTER TABLE "FlowSegment" DROP CONSTRAINT "FlowSegment_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "flowId" SET DATA TYPE TEXT,
ADD CONSTRAINT "FlowSegment_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "FlowSegment_id_seq";

-- AlterTable
ALTER TABLE "FlowSegmentEdges" ADD COLUMN     "order" INTEGER NOT NULL,
ALTER COLUMN "flowSegmentId" SET DATA TYPE TEXT,
ALTER COLUMN "edgeId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "FlowSegment" ADD CONSTRAINT "FlowSegment_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowSegmentEdges" ADD CONSTRAINT "FlowSegmentEdges_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "Edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowSegmentEdges" ADD CONSTRAINT "FlowSegmentEdges_flowSegmentId_fkey" FOREIGN KEY ("flowSegmentId") REFERENCES "FlowSegment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateMaterializedView
CREATE MATERIALIZED VIEW "EdgeFlowAggregation" AS
SELECT
  e.id AS "edgeId",
  f."foodGroupId",
  COUNT(DISTINCT fs.id) AS "flowCount",
  SUM(f.value) AS "flowSum"
FROM
  "Edge" e
  INNER JOIN "FlowSegmentEdges" fse ON e.id = fse."edgeId"
  INNER JOIN "FlowSegment" fs ON fse."flowSegmentId" = fs.id
  INNER JOIN "Flow" f ON fs."flowId" = f.id
GROUP BY
  e.id, f."foodGroupId"
HAVING
  COUNT(DISTINCT fs.id) > 0;

-- CreateIndex
CREATE INDEX "EdgeFlowAggregation_edgeId_foodGroupId_idx" ON "EdgeFlowAggregation"("edgeId", "foodGroupId");