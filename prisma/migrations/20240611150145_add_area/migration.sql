-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "centroid" geometry(Point, 3857),
    "limits" geometry(MultiPolygon, 3857),

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")

);

-- CreateIndex
CREATE INDEX "centroid_idx" ON "Area" USING GIST ("centroid");

-- CreateIndex
CREATE INDEX "limits_idx" ON "Area" USING GIST ("limits");