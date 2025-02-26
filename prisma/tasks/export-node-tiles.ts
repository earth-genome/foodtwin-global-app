/* eslint-disable no-console */
import fs from "fs-extra";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { PUBLIC_PATH, TILES_PATH } from "../seed/config";
import { execa } from "execa";

const prisma = new PrismaClient();

const LAYER_ID = "nodes";

const NODE__NDJSON_PATH = path.join(PUBLIC_PATH, `${LAYER_ID}.ndjson`);
const NODE__TILES_PATH = path.join(TILES_PATH, LAYER_ID);

async function main() {
  // Ensure the output directories exist and it's empty
  await fs.remove(NODE__TILES_PATH);
  await fs.ensureDir(NODE__TILES_PATH);

  // Remove, if exists, nodes.ndjson file
  await fs.remove(NODE__NDJSON_PATH);

  const nodes = (await prisma.$queryRaw`
    SELECT
      id,
      ((ctid::text::point)[0]::bigint << 32) | (ctid::text::point)[1]::bigint AS id_int,
      name,
      type,
      ST_AsGeoJSON(ST_Transform(geom, 4326)) as geometry 
    FROM "Node"
    WHERE type IN ('PORT', 'INLAND_PORT' , 'RAIL_STATION', 'ADMIN' ) 
  `) as {
    id: string;
    id_int: number;
    name: string;
    type: string;
    geometry: string;
  }[];

  const ndjsonStream = fs.createWriteStream(NODE__NDJSON_PATH);

  for (const port of nodes) {
    const feature = {
      type: "Feature",
      id: Number(port.id_int), // Must be a number
      properties: {
        id: port.id,
        name: port.name,
        type: port.type,
      },
      geometry: JSON.parse(port.geometry),
    };
    ndjsonStream.write(JSON.stringify(feature) + "\n");
  }

  ndjsonStream.end();
  console.log(`Exported ${nodes.length} nodes to ${NODE__NDJSON_PATH}`);

  ndjsonStream.on("finish", async () => {
    await execa(
      `tippecanoe -n ${LAYER_ID} -N ${LAYER_ID} -z10 -r1 -e ${NODE__TILES_PATH} --no-tile-stats -l default --drop-densest-as-needed --extend-zooms-if-still-dropping ${NODE__NDJSON_PATH} --force`,
      {
        shell: true,
        stdio: "inherit",
      }
    );
    console.log(`Exported ${nodes.length} nodes to ${NODE__TILES_PATH}`);

    console.log("Uploading tiles to S3");
    await execa(
      `s5cmd cp --content-encoding=gzip ${NODE__TILES_PATH} "s3://globalfoodtwin-map-tiles/"`,
      {
        shell: true,
        stdio: "inherit",
      }
    );

    console.log("Upload completed");
    await fs.remove(NODE__NDJSON_PATH);
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
