-- AlterTable
ALTER TABLE "FlowSegmentEdges" DROP CONSTRAINT "FlowSegmentEdges_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "FlowSegmentEdges_pkey" PRIMARY KEY ("id");