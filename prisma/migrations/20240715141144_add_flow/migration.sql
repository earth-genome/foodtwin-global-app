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
    "geom" geometry(LineString, 3857) NOT NULL,
    "fromNodeId" INTEGER NOT NULL,
    "toNodeId" INTEGER NOT NULL,

    CONSTRAINT "Edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "fromAreaId" TEXT NOT NULL,
    "toAreaId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EdgeToFlow" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EdgeToFlow_AB_unique" ON "_EdgeToFlow"("A", "B");

-- CreateIndex
CREATE INDEX "_EdgeToFlow_B_index" ON "_EdgeToFlow"("B");

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_fromAreaId_fkey" FOREIGN KEY ("fromAreaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_toAreaId_fkey" FOREIGN KEY ("toAreaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EdgeToFlow" ADD CONSTRAINT "_EdgeToFlow_A_fkey" FOREIGN KEY ("A") REFERENCES "Edge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EdgeToFlow" ADD CONSTRAINT "_EdgeToFlow_B_fkey" FOREIGN KEY ("B") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
