DROP MATERIALIZED VIEW IF EXISTS "EdgeFlowAggregation";

/*
  Warnings:

  - The primary key for the `Flow` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FlowSegment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Flow` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `FlowSegment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `flowId` on the `FlowSegment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `flowSegmentId` on the `FlowSegmentEdges` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "FlowSegment" DROP CONSTRAINT "FlowSegment_flowId_fkey";

-- DropForeignKey
ALTER TABLE "FlowSegmentEdges" DROP CONSTRAINT "FlowSegmentEdges_flowSegmentId_fkey";

-- AlterTable
ALTER TABLE "Flow" DROP CONSTRAINT "Flow_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGINT NOT NULL,
ADD CONSTRAINT "Flow_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FlowSegment" DROP CONSTRAINT "FlowSegment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGINT NOT NULL,
DROP COLUMN "flowId",
ADD COLUMN     "flowId" BIGINT NOT NULL,
ADD CONSTRAINT "FlowSegment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FlowSegmentEdges" DROP COLUMN "flowSegmentId",
ADD COLUMN     "flowSegmentId" BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX "flow_segment_composite_idx" ON "FlowSegment"("flowId", "order");

-- CreateIndex
CREATE INDEX "FlowSegmentEdges_flowSegmentId_idx" ON "FlowSegmentEdges"("flowSegmentId");

-- AddForeignKey
ALTER TABLE "FlowSegment" ADD CONSTRAINT "FlowSegment_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowSegmentEdges" ADD CONSTRAINT "FlowSegmentEdges_flowSegmentId_fkey" FOREIGN KEY ("flowSegmentId") REFERENCES "FlowSegment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
