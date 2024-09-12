/*
  Warnings:

  - The primary key for the `Node` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_str` on the `Node` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "Edge" DROP CONSTRAINT "Edge_fromNodeId_fkey";

-- DropForeignKey
ALTER TABLE "Edge" DROP CONSTRAINT "Edge_toNodeId_fkey";

-- DropIndex
DROP INDEX "Node_id_str_idx";

-- DropIndex
DROP INDEX "Node_id_str_key";

-- AlterTable
ALTER TABLE "Edge" ALTER COLUMN "fromNodeId" SET DATA TYPE TEXT,
ALTER COLUMN "toNodeId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Node" DROP CONSTRAINT "Node_pkey",
DROP COLUMN "id_str",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Node_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Node_id_seq";

-- CreateIndex
CREATE INDEX "Node_id_idx" ON "Node"("id");

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
