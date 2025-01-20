-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS "EdgeFlowAggregation";

/*
  Warnings:

  - The primary key for the `Edge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Edge` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `id_str` to the `Edge` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `edgeId` on the `FlowSegmentEdges` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "FlowSegmentEdges" DROP CONSTRAINT "FlowSegmentEdges_edgeId_fkey";

-- AlterTable
ALTER TABLE "Edge" DROP CONSTRAINT "Edge_pkey",
ADD COLUMN     "id_str" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Edge_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FlowSegmentEdges" DROP COLUMN "edgeId",
ADD COLUMN     "edgeId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "FlowSegmentEdges_edgeId_idx" ON "FlowSegmentEdges"("edgeId");

-- AddForeignKey
ALTER TABLE "FlowSegmentEdges" ADD CONSTRAINT "FlowSegmentEdges_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "Edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- CreateFunction
CREATE OR REPLACE FUNCTION refresh_edge_flow_aggregation()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW "EdgeFlowAggregation";
END;
$$ LANGUAGE plpgsql;