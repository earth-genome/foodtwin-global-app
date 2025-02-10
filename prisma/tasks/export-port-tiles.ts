/* eslint-disable no-console */
import fs from "fs-extra";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { PUBLIC_PATH, TILES_PATH } from "../seed/config";
import { execa } from "execa";

const prisma = new PrismaClient();

const LAYER_ID = "ports";

const PORT_NDJSON_PATH = path.join(PUBLIC_PATH, `${LAYER_ID}.ndjson`);
const PORT_TILES_PATH = path.join(TILES_PATH, LAYER_ID);

async function main() {
  // Ensure the output directories exist and it's empty
  await fs.remove(PORT_TILES_PATH);
  await fs.ensureDir(PORT_TILES_PATH);

  // Remove, if exists, ports.ndjson file
  await fs.remove(PORT_NDJSON_PATH);

  const ports = (await prisma.$queryRaw`
    SELECT
      id,
      ((ctid::text::point)[0]::bigint << 32) | (ctid::text::point)[1]::bigint AS id_int,
      name,
      ST_AsGeoJSON(ST_Transform(geom, 4326)) as geometry 
    FROM "Node"
    WHERE type = 'PORT'
  `) as {
    id: string;
    id_int: number;
    name: string;
    geometry: string;
  }[];

  const ndjsonStream = fs.createWriteStream(PORT_NDJSON_PATH);

  for (const port of ports) {
    const feature = {
      type: "Feature",
      id: Number(port.id_int), // Must be a number
      properties: {
        id: port.id,
        name: port.name,
      },
      geometry: JSON.parse(port.geometry),
    };
    ndjsonStream.write(JSON.stringify(feature) + "\n");
  }

  ndjsonStream.end();
  console.log(`Exported ${ports.length} ports to ${PORT_NDJSON_PATH}`);

  ndjsonStream.on("finish", async () => {
    await execa(
      `tippecanoe -n ${LAYER_ID} -N ${LAYER_ID} -z10 -r1 -e ${PORT_TILES_PATH} --no-tile-stats -l default --drop-densest-as-needed --extend-zooms-if-still-dropping ${PORT_NDJSON_PATH} --force`,
      {
        shell: true,
        stdio: "inherit",
      }
    );
    console.log(`Exported ${ports.length} ports to ${PORT_TILES_PATH}`);

    // remove metadata.json

    console.log("Uploading tiles to S3");
    await execa(
      `s5cmd cp --content-encoding=gzip ${PORT_TILES_PATH} "s3://globalfoodtwin-map-tiles/"`,
      {
        shell: true,
        stdio: "inherit",
      }
    );

    console.log("Upload completed");
    await fs.remove(PORT_NDJSON_PATH);
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
