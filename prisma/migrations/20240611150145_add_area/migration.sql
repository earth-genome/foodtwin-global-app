-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "centroid" geometry(Point, 4326),
    "limits" geometry(MultiPolygon, 4326),

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);
