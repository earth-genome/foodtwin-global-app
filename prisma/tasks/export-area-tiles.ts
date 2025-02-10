/* eslint-disable no-console */
import fs from "fs-extra";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { PUBLIC_PATH, TILES_PATH } from "../seed/config";
import { execa } from "execa";

const AREA_NDJSON_PATH = path.join(PUBLIC_PATH, "areas.ndjson");

const AREA_TILES_PATH = path.join(TILES_PATH, "areas");

const prisma = new PrismaClient();

async function main() {
  // Ensure the output directories exist and it's empty
  await fs.remove(AREA_TILES_PATH);
  await fs.ensureDir(AREA_TILES_PATH);

  // Remove, if exists, areas.ndjson file
  await fs.remove(AREA_NDJSON_PATH);

  const areas = (await prisma.$queryRaw`
    SELECT     
      id, 
      ((ctid::text::point)[0]::bigint << 32) | (ctid::text::point)[1]::bigint AS id_int,
      name, 
      (meta->>'totalpop')::float as totalpop, 
      ST_AsGeoJSON(ST_Transform(limits, 4326)) as geometry 
    FROM "Area"
    ORDER BY id;
  `) as {
    id: string;
    id_int: number;
    name: string;
    totalpop: number;
    geometry: string;
  }[];

  const ndjsonStream = fs.createWriteStream(AREA_NDJSON_PATH);

  for (const area of areas) {
    const feature = {
      type: "Feature",
      id: Number(area.id_int), // Must be a number
      properties: {
        id: area.id,
        name: area.name,
        totalpop: area.totalpop,
      },
      geometry: JSON.parse(area.geometry),
    };
    ndjsonStream.write(JSON.stringify(feature) + "\n");
  }

  ndjsonStream.end();

  ndjsonStream.on("finish", async () => {
    console.log("Exported areas to areas.ndjson");

    await execa(
      `tippecanoe -z10 -e ${AREA_TILES_PATH} -l default --drop-densest-as-needed ${AREA_NDJSON_PATH} --force`,
      {
        shell: true,
        stdio: "inherit",
      }
    );

    console.log("Exported areas to tiles");
    await fs.remove(AREA_NDJSON_PATH);
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
