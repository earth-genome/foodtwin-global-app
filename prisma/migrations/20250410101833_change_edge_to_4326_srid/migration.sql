-- This is an empty migration.
-- Changes Edge table to use SRID 4326
ALTER TABLE "Edge"
ALTER COLUMN "geom" TYPE geometry (MultiLineString, 4326) USING ST_SetSRID ("geom", 4326);