/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const AREA_LIMITS_PATH =
  "./public/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson";

const AREA_CENTROID_PATH =
  "./public/naturalearth-3.3.0/ne_50m_populated_places_adm0cap.geojson";

const prisma = new PrismaClient();

async function ingestData() {
  try {
    const data = fs.readFileSync(AREA_LIMITS_PATH, "utf-8");
    const limits = JSON.parse(data);

    const dataCentroid = fs.readFileSync(AREA_CENTROID_PATH, "utf-8");
    const centroids = JSON.parse(dataCentroid);

    for (const feature of limits.features) {
      const { iso_a3: id, name } = feature.properties;

      const centroid = centroids.features.find(
        (c) => c.properties.SOV_A3 === id
      );

      if (!centroid) {
        console.error("No centroid found for", name);
        continue;
      }

      const limitsGeometry = JSON.stringify(feature.geometry);
      const centroidGeometry = JSON.stringify(centroid.geometry);

      await prisma.$executeRaw`
        INSERT INTO "Area" (id, name, centroid, limits)
        VALUES (
          ${id}, 
          ${name}, 
          ST_Transform(ST_GeomFromGeoJSON(${centroidGeometry}), 3857), 
          ST_Transform(ST_GeomFromGeoJSON(${limitsGeometry}), 3857)
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }

    console.log("Data ingestion complete");
  } catch (error) {
    console.error("Error ingesting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

ingestData();
