/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv-flow").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pointsEqual = (a, b) => a[0] === b[0] && a[1] === b[1];

async function main() {
  try {
    // Drop FlowPairsGeometries table if it exists
    await prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "FlowPairsGeometries"`
    );

    // Create the table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "FlowPairsGeometries" (
        id BIGINT PRIMARY KEY,
        "fromAreaId" TEXT NOT NULL,
        "toAreaId" TEXT NOT NULL,
        geom geometry(LineString, 4326) NOT NULL
      );
    `);

    const flowPairs = await prisma.$queryRaw`
      SELECT
        ANY_VALUE("id") as id,
        "fromAreaId",
        "toAreaId"
      FROM "Flow"
      WHERE "fromAreaId" LIKE 'ESP%'
      GROUP BY "fromAreaId", "toAreaId"
      limit 1;
    `;

    for (const oneFlowPair of flowPairs) {
      const flowGeometry = {
        type: "LineString",
        coordinates: [],
      };

      const flowSegments = await prisma.$queryRaw`
        SELECT * FROM "FlowSegment"
        WHERE "flowId" = ${oneFlowPair.id}
        ORDER BY "FlowSegment"."order";
      `;

      for (const flowSegment of flowSegments) {
        const flowSegmentGeometry = {
          type: "LineString",
          coordinates: [],
        };

        const flowSegmentEdges = (
          await prisma.$queryRaw`
          SELECT 
            "FlowSegmentEdges".id,
            "FlowSegmentEdges"."order",
            ST_AsGeoJSON(ST_Transform("Edge".geom, 4326)) as geom
          FROM "FlowSegmentEdges"
          JOIN "Edge" ON "FlowSegmentEdges"."edgeId" = "Edge"."id"
          WHERE "flowSegmentId" = ${flowSegment.id}
          ORDER BY "FlowSegmentEdges"."flowSegmentId", "FlowSegmentEdges"."order";
        `
        ).map((e) => ({ ...e, geom: JSON.parse(e.geom) }));

        for (const flowSegmentEdge of flowSegmentEdges) {
          const edgeGeometry = flowSegmentEdge.geom;

          let edgeLinestring;
          if (edgeGeometry.type === "LineString") {
            edgeLinestring = edgeGeometry.coordinates;
          } else if (
            edgeGeometry.type === "MultiLineString" &&
            edgeGeometry.coordinates.length === 1
          ) {
            edgeLinestring = edgeGeometry.coordinates[0];
          } else {
            console.warn(
              `Invalid edge geometry for flow segment ${flowSegment.id}, edge ${flowSegmentEdge.id}`
            );
            continue;
          }

          if (flowSegmentGeometry.coordinates.length === 0) {
            flowSegmentGeometry.coordinates = edgeLinestring;
          } else {
            const lastPoint =
              flowSegmentGeometry.coordinates[
                flowSegmentGeometry.coordinates.length - 1
              ];
            const edgeFirstPoint = edgeLinestring[0];
            const edgeLastPoint = edgeLinestring[edgeLinestring.length - 1];

            if (pointsEqual(lastPoint, edgeFirstPoint)) {
              flowSegmentGeometry.coordinates.push(...edgeLinestring.slice(1));
            } else if (pointsEqual(lastPoint, edgeLastPoint)) {
              console.log("reved ok");
              flowSegmentGeometry.coordinates.push(
                ...edgeLinestring.slice(0, edgeLinestring.length - 1).reverse()
              );
            } else {
              console.warn(
                `Segment discontinuity at flow segment ${flowSegment.id}, edge ${flowSegmentEdge.id}`
              );

              throw new Error(
                `Segment discontinuity at flow segment ${flowSegment.id}, edge ${flowSegmentEdge.id}`
              );
            }
          }
        }

        flowGeometry.coordinates.push(flowSegmentGeometry.coordinates);
      }

      flowGeometry.coordinates = flowGeometry.coordinates.flat();

      const geojsonString = JSON.stringify(flowGeometry);

      // Insert result into the table
      await prisma.$executeRawUnsafe(`
        INSERT INTO "FlowPairsGeometries" ("id", "fromAreaId", "toAreaId", geom)
        VALUES (
          ${oneFlowPair.id},
          '${oneFlowPair.fromAreaId}',
          '${oneFlowPair.toAreaId}',
          ST_GeomFromGeoJSON('${geojsonString}')
        );
      `);

      console.log(
        `✔ Processed flow ${oneFlowPair.fromAreaId} → ${oneFlowPair.toAreaId}`
      );
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
