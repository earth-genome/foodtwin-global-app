-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('MARITIME', 'PORT');

-- CreateTable
CREATE TABLE "Node" (
    "id" SERIAL NOT NULL,
    "id_str" TEXT NOT NULL,
    "name" TEXT,
    "type" "NodeType" NOT NULL,
    "centroid" geometry(Point, 3857) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edge" (
    "id" SERIAL NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "geom" geometry(MultiLineString, 3857) NOT NULL,
    "fromNodeId" INTEGER NOT NULL,
    "toNodeId" INTEGER NOT NULL,

    CONSTRAINT "Edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowEdges" (
    "edgeId" INTEGER NOT NULL,
    "flowId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "FlowEdges_pkey" PRIMARY KEY ("edgeId","flowId")
);

-- CreateTable
CREATE TABLE "Flow" (
    "id" SERIAL NOT NULL,
    "fromAreaId" TEXT NOT NULL,
    "toAreaId" TEXT NOT NULL,
    "food" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_id_str_key" ON "Node"("id_str");

-- CreateIndex
CREATE INDEX "Node_id_str_idx" ON "Node"("id_str");

-- CreateIndex
CREATE INDEX "Edge_fromNodeId_toNodeId_idx" ON "Edge"("fromNodeId", "toNodeId");

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowEdges" ADD CONSTRAINT "FlowEdges_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "Edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowEdges" ADD CONSTRAINT "FlowEdges_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_fromAreaId_fkey" FOREIGN KEY ("fromAreaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_toAreaId_fkey" FOREIGN KEY ("toAreaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
