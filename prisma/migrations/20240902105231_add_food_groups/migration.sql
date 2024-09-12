-- CreateTable
CREATE TABLE "FoodGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FoodGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodSubGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "foodGroupId" INTEGER NOT NULL,

    CONSTRAINT "FoodSubGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FoodSubGroup" ADD CONSTRAINT "FoodSubGroup_foodGroupId_fkey" FOREIGN KEY ("foodGroupId") REFERENCES "FoodGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
