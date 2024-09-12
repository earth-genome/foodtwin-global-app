/*
  Warnings:

  - You are about to drop the column `edgeId` on the `Flow` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Flow" DROP CONSTRAINT "Flow_edgeId_fkey";

-- AlterTable
ALTER TABLE "Flow" DROP COLUMN "edgeId";
