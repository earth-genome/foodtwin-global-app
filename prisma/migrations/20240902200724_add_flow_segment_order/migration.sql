/*
  Warnings:

  - Added the required column `mode` to the `FlowSegment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `FlowSegment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FlowSegment" ADD COLUMN     "mode" TEXT NOT NULL,
ADD COLUMN     "order" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "flow_segment_composite_idx" ON "FlowSegment"("flowId", "order");
