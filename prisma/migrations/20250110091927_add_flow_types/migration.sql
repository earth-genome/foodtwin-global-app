/*
  Warnings:

  - Added the required column `type` to the `Flow` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FlowType" AS ENUM ('SEA_DOMESTIC', 'SEA_REEXPORT', 'LAND_DOMESTIC', 'LAND_REEXPORT', 'WITHIN_COUNTRY');

-- DropForeignKey
ALTER TABLE "Flow" DROP CONSTRAINT "Flow_foodGroupId_fkey";

-- DropForeignKey
ALTER TABLE "FlowSegment" DROP CONSTRAINT "FlowSegment_flowId_fkey";

-- AlterTable
ALTER TABLE "Flow" ADD COLUMN     "type" "FlowType" NOT NULL;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_foodGroupId_fkey" FOREIGN KEY ("foodGroupId") REFERENCES "FoodGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowSegment" ADD CONSTRAINT "FlowSegment_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
