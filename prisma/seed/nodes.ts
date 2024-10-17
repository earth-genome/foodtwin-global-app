import { PrismaClient } from "@prisma/client";
import { log, runOgr2Ogr } from "./utils";
import {
  ADMIN_CENTROIDS_PATH,
  ADMIN_INDICATORS_PATH,
  ADMIN_LIMITS_PATH,
  ADMIN_LIMITS_TABLENAME,
  INLAND_PORTS_PATH,
  INLAND_PORTS_TABLENAME,
  NODES_MARITIME_TABLENAME,
  NODES_PATH,
  RAIL_STATIONS_PATH,
  RAIL_STATIONS_TABLENAME,
} from "./config";
import fs from "fs-extra";
import { parse } from "csv-parse";

enum IndicatorColumn {
  LIVESTOCK_SUM = "livestock_sum",
  TRAVEL_MEAN = "travel_mean",
  NUM_F_CHILDBEARING = "num_f_childbearing",
  NUM_ELDERLY = "num_elderly",
  NUM_UNDER5 = "num_under5",
  TOTALPOP = "totalpop",
  PCT_F_CHILDBEARING = "pct_f_childbearing",
  PCT_ELDERLY = "pct_elderly",
  PCT_UNDER5 = "pct_under5",
  GDPPC = "gdppc",
  HDI = "hdi",
  NUM_RURAL = "num_rural",
  PCT_RURAL = "pct_rural",
  AGGDP_2010 = "aggdp_2010",
}

interface AreaIndicatorsRow {
  ID: string;
  iso3: string;
  admin_name: string;
  [key: string]: string; // Index signature for dynamic access
}

export type AreaMeta = {
  [K in IndicatorColumn]?: number;
} & {
  iso3?: string;
};

export const ingestNodes = async (prisma: PrismaClient) => {
  await prisma.$executeRaw`TRUNCATE "Node" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE "Area" RESTART IDENTITY CASCADE`;
  log("Cleared nodes table.");

  await runOgr2Ogr(
    ADMIN_CENTROIDS_PATH,
    `-nln Node -append -nlt POINT -t_srs EPSG:3857 -sql "SELECT id, admin_name as name, 'ADMIN' as type, geom FROM admin_centroids"`
  );
  log('Ingested admin centroids to "Node" table...');

  // Copy admin centroids to "Area" table
  await prisma.$executeRaw`INSERT INTO "Area" ("id", "centroid", "name") SELECT id, ST_Transform(geom, 3857), name FROM "Node" WHERE type = 'ADMIN'`;

  // Ingest meta
  const areaIndicatorsCsv = await fs.readFile(ADMIN_INDICATORS_PATH, "utf-8");
  const areaIndicatorsRows = await new Promise<AreaIndicatorsRow[]>(
    (resolve, reject) => {
      parse(
        areaIndicatorsCsv,
        { columns: true, skip_empty_lines: true },
        (err, records) => {
          if (err) {
            reject(err);
          } else {
            resolve(records);
          }
        }
      );
    }
  );

  const indicatorColumns = Object.values(IndicatorColumn);

  for (const areaIndicatorsRow of areaIndicatorsRows) {
    await prisma.area.update({
      data: {
        meta: indicatorColumns.reduce(
          (acc, column) => {
            acc[column] = parseFloat(areaIndicatorsRow[column]);
            return acc;
          },
          {
            iso3: areaIndicatorsRow.iso3, // add iso3 as string
          } as Record<string, number | string>
        ),
      },
      where: { id: areaIndicatorsRow.ID },
    });
  }
  log("Ingested meta data...");

  // Update limits for areas
  await runOgr2Ogr(
    ADMIN_LIMITS_PATH,
    `-nln Area_limits_temp -overwrite -nlt MULTIPOLYGON -lco GEOMETRY_NAME=limits -sql "SELECT ID as id, geom as limits FROM ${ADMIN_LIMITS_TABLENAME}"`
  );
  await prisma.$executeRaw`UPDATE "Area" SET "limits" = (SELECT ST_Transform(limits, 3857) FROM "area_limits_temp" WHERE "Area"."id" = "area_limits_temp"."id")`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS "area_limits_temp"`;
  log(`Ingested area limits.`);

  await runOgr2Ogr(
    INLAND_PORTS_PATH,
    `-nln Node -append -nlt POINT -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT node_id as id, 'INLAND_PORT' as type, geom FROM ${INLAND_PORTS_TABLENAME}" -s_srs EPSG:4326`
  );
  log("Ingested inland ports...");

  await runOgr2Ogr(
    RAIL_STATIONS_PATH,
    `-nln Node -append -nlt POINT -t_srs EPSG:3857 -sql "SELECT DISTINCT node_id as id, 'RAIL_STATION' as type, geom FROM ${RAIL_STATIONS_TABLENAME}"`
  );
  log("Ingested rail nodes.");

  await runOgr2Ogr(
    NODES_PATH,
    `-nln Node -append -nlt POINT -lco GEOMETRY_NAME=geom -t_srs EPSG:3857 -sql "SELECT id, name, upper(infra) as type, geom as centroid FROM ${NODES_MARITIME_TABLENAME}"`
  );
  log(`Ingested maritime nodes.`);
};
