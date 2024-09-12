/*
  Warnings:

  - You are about to drop the column `centroid` on the `Node` table. All the data in the column will be lost.
  - Added the required column `geom` to the `Node` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Node" DROP COLUMN "centroid",
ADD COLUMN     "geom" geometry(Point, 3857) NOT NULL;
