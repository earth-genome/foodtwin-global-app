/*
  Warnings:

  - You are about to drop the column `food` on the `Flow` table. All the data in the column will be lost.
  - You are about to drop the `FlowEdges` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `foodGroupId` to the `Flow` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FlowEdges" DROP CONSTRAINT "FlowEdges_edgeId_fkey";

-- DropForeignKey
ALTER TABLE "FlowEdges" DROP CONSTRAINT "FlowEdges_flowId_fkey";

-- AlterTable
ALTER TABLE "Flow" DROP COLUMN "food",
ADD COLUMN     "edgeId" INTEGER,
ADD COLUMN     "foodGroupId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "FlowEdges";

-- CreateTable
CREATE TABLE "FlowSegment" (
    "id" SERIAL NOT NULL,
    "flowId" INTEGER NOT NULL,

    CONSTRAINT "FlowSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowSegmentEdges" (
    "id" SERIAL NOT NULL,
    "flowSegmentId" INTEGER NOT NULL,
    "edgeId" INTEGER NOT NULL,

    CONSTRAINT "FlowSegmentEdges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FlowSegmentEdges_flowSegmentId_idx" ON "FlowSegmentEdges"("flowSegmentId");

-- CreateIndex
CREATE INDEX "FlowSegmentEdges_edgeId_idx" ON "FlowSegmentEdges"("edgeId");

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_foodGroupId_fkey" FOREIGN KEY ("foodGroupId") REFERENCES "FoodGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "Edge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowSegment" ADD CONSTRAINT "FlowSegment_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowSegmentEdges" ADD CONSTRAINT "FlowSegmentEdges_flowSegmentId_fkey" FOREIGN KEY ("flowSegmentId") REFERENCES "FlowSegment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowSegmentEdges" ADD CONSTRAINT "FlowSegmentEdges_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "Edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
