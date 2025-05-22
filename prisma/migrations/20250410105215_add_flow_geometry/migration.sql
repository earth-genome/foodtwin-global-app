-- CreateTable
CREATE TABLE
    "FlowGeometry" (
        "id" BIGSERIAL NOT NULL,
        "fromAreaId" TEXT NOT NULL,
        "toAreaId" TEXT NOT NULL,
        "geometry" geometry (MultiLineString, 4326) NOT NULL,
        CONSTRAINT "FlowGeometry_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "unique_flow_pair" UNIQUE ("fromAreaId", "toAreaId")
    );

-- CreateIndex
CREATE INDEX "flow_geometry_pair_idx" ON "FlowGeometry" ("fromAreaId", "toAreaId");

-- AddForeignKey
ALTER TABLE "FlowGeometry" ADD CONSTRAINT "FlowGeometry_fromAreaId_fkey" FOREIGN KEY ("fromAreaId") REFERENCES "Area" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowGeometry" ADD CONSTRAINT "FlowGeometry_toAreaId_fkey" FOREIGN KEY ("toAreaId") REFERENCES "Area" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;