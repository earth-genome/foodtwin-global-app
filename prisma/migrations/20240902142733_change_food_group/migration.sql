/*
  Warnings:

  - You are about to drop the `FoodSubGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FoodSubGroup" DROP CONSTRAINT "FoodSubGroup_foodGroupId_fkey";

-- AlterTable
ALTER TABLE "FoodGroup" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentId" INTEGER;

-- DropTable
DROP TABLE "FoodSubGroup";

-- CreateIndex
CREATE INDEX "FoodGroup_parentId_idx" ON "FoodGroup"("parentId");

-- AddForeignKey
ALTER TABLE "FoodGroup" ADD CONSTRAINT "FoodGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FoodGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
