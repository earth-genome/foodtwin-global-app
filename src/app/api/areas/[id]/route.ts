import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface FetchAreaResponse {
  id: string;
  name: string;
  totalpop: number;
  boundingBox: GeoJSON.Feature;
  destinationAreas: GeoJSON.FeatureCollection<GeoJSON.Geometry, AreaProps>;
  destinationPorts: GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    DestinationPortProps
  >;
}

interface AreaProps {
  id: string;
  name: string;
  totalpop: number;
}

interface DestinationPortProps {
  id: string;
  id_int: string;
  name: string;
}

type DestinationAreaRow = AreaProps & {
  geometry: string;
};

type DestinationPortRow = DestinationPortProps & {
  geometry: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const areaRows = await prisma.$queryRaw<AreaProps[]>`
      SELECT id, name, (meta->>'totalpop')::float as totalpop
      FROM "Area"
      WHERE id = ${id}
      LIMIT 1;
    `;

    const area = areaRows[0];

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const [boundingBoxRows, destinationAreasRows, destinationPortsRows] =
      (await Promise.all([
        prisma.$queryRaw`
        SELECT ST_AsGeoJSON(ST_Extent(ST_Transform(limits, 4326))) as geojson FROM "Area" WHERE id = ${id}
      `,
        prisma.$queryRaw`
        select "Area"."id", "Area"."name", (meta->>'totalpop')::float as totalpop, ST_AsGeoJSON(ST_Transform(limits, 4326)) as geometry from "Flow" LEFT JOIN "Area" ON "Flow"."toAreaId" = "Area"."id" where "fromAreaId" = ${id};
      `,
        // TODO this is a temporary query to get the 10 closest ports to the area until there is maritime data in the database
        prisma.$queryRaw`
          SELECT 
            "Node"."id", 
            ((ctid::text::point)[0]::bigint << 32) | (ctid::text::point)[1]::bigint AS id_int,
            "Node"."name", 
            ST_AsGeoJSON(ST_Transform("Node"."geom", 4326)) as geometry
          FROM "Node"
          WHERE "Node"."type" = 'PORT'
          ORDER BY ST_Distance(
            ST_Transform(
              (SELECT ST_Centroid(ST_Transform("limits", 4326)) FROM "Area" WHERE "id" = ${id}),
              4326
            ),
            ST_Transform("Node"."geom", 4326)
          ) ASC
          LIMIT 10;
        `,
      ])) as [
        { geojson: string }[],
        DestinationAreaRow[],
        DestinationPortRow[],
      ];

    const destinationAreas: GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      AreaProps
    > = {
      type: "FeatureCollection",
      features: destinationAreasRows.map(
        ({ id, name, totalpop, geometry }) => ({
          type: "Feature",
          properties: {
            id,
            name,
            totalpop,
          },
          geometry: JSON.parse(geometry),
        })
      ),
    };

    const destinationPorts: GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      DestinationPortProps
    > = {
      type: "FeatureCollection",
      features: destinationPortsRows.map(({ id, id_int, name, geometry }) => ({
        type: "Feature",
        properties: {
          id,
          id_int: id_int.toString(),
          name,
        },
        geometry: JSON.parse(geometry),
      })),
    };

    const result: FetchAreaResponse = {
      ...area,
      boundingBox: JSON.parse(boundingBoxRows[0]?.geojson) || null,
      destinationAreas,
      destinationPorts,
    };

    return NextResponse.json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching area:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
