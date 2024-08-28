/*
  Warnings:

  - Added the required column `type` to the `Edge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EdgeType" AS ENUM ('LAND', 'MARITIME');

-- AlterTable
ALTER TABLE "Edge" ADD COLUMN     "type" "EdgeType" NOT NULL;
