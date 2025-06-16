-- Add geojson column to FlowGeometry
ALTER TABLE "FlowGeometry"
ADD COLUMN "geojson" JSONB;