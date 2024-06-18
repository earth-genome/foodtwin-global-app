-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "centroid" geometry(Point, 3857),
    "limits" geometry(MultiPolygon, 3857),

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);
