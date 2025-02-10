/* eslint-disable no-console */
import fs from "fs-extra";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { PUBLIC_PATH, TILES_PATH } from "../seed/config";
import { execa } from "execa";

const prisma = new PrismaClient();

const EDGE_NDJSON_PATH = path.join(PUBLIC_PATH, "edges.ndjson");
const EDGE_TILES_PATH = path.join(TILES_PATH, "edges");

async function main() {
  // Ensure the output directories exist and it's empty
  await fs.remove(EDGE_TILES_PATH);
  await fs.ensureDir(EDGE_TILES_PATH);

  // Remove, if exists, edges.ndjson file
  await fs.remove(EDGE_NDJSON_PATH);

  const edges = (await prisma.$queryRaw`
    SELECT
      e.id,
      e.type,
      efa."totalFlowCount" AS "flowCount",
      efa."totalFlowSum" AS "flowSum",
      ST_AsGeoJSON(ST_Transform(e.geom, 4326)) as geometry 
    FROM "Edge" e
    INNER JOIN (
      SELECT 
        "edgeId", 
        SUM("flowCount")::INTEGER AS "totalFlowCount", 
        SUM("flowSum")::FLOAT AS "totalFlowSum"
      FROM "EdgeFlowAggregation"
      GROUP BY "edgeId"
      HAVING SUM("flowCount") > 0
    ) efa ON e.id = efa."edgeId";
  `) as {
    id: string;
    type: string;
    flowCount: number;
    flowSum: number;
    geometry: string;
  }[];

  const ndjsonStream = fs.createWriteStream(EDGE_NDJSON_PATH);

  for (const edge of edges) {
    const feature = {
      type: "Feature",
      id: edge.id,
      properties: {
        id: edge.id,
        type: edge.type,
        flowCount: edge.flowCount,
        flowSum: edge.flowSum,
      },
      geometry: JSON.parse(edge.geometry),
    };
    ndjsonStream.write(JSON.stringify(feature) + "\n");
  }

  ndjsonStream.end();
  console.log("Exported edges to edges.ndjson");

  ndjsonStream.on("finish", async () => {
    await execa(
      `tippecanoe -z10 -e ${EDGE_TILES_PATH} -l default --drop-densest-as-needed ${EDGE_NDJSON_PATH} --force`,
      {
        shell: true,
        stdio: "inherit",
      }
    );
    console.log("Exported edges to tiles");

    console.log("Uploading tiles to S3");
    await execa(
      `s5cmd cp --content-encoding=gzip "${EDGE_TILES_PATH}/**/*.pbf" "s3://globalfoodtwin-map-tiles/edges/"`,
      {
        shell: true,
        stdio: "inherit",
      }
    );

    console.log("Upload completed");
    await fs.remove(EDGE_NDJSON_PATH);
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
