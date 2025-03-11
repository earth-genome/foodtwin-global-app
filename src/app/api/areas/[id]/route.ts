import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface AreaProps {
  id: string;
  name: string;
  totalpop: number;
}

export interface AreaWithCentroidProps extends AreaProps {
  centroid: GeoJSON.Point;
}

export interface FetchAreaResponse {
  id: string;
  name: string;
  totalpop: number;
  boundingBox: GeoJSON.Feature;
  destinationAreas: AreaWithCentroidProps[];
  destinationAreasBbox: GeoJSON.Feature;
  destinationPorts: GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    DestinationPortProps
  >;
}

interface DestinationPortProps {
  id: string;
  id_int: string;
  name: string;
}

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

    const [
      boundingBoxRows,
      destinationAreas,
      destinationAreasBbox,
      destinationPortsRows,
    ] = (await Promise.all([
      prisma.$queryRaw`
        SELECT ST_AsGeoJSON(ST_Extent(ST_Transform(limits, 4326))) as geojson FROM "Area" WHERE id = ${id}
      `,
      prisma.$queryRaw`
        select
          "Area"."id",
          "Area"."name",
          ST_AsGeoJSON(ST_Transform("Area"."centroid", 4326)) as centroid,
          (meta->>'totalpop')::float as totalpop,
          "Flow".value
        from "Flow"
          LEFT JOIN "Area" ON "Flow"."toAreaId" = "Area"."id" where "fromAreaId" = ${id}
        GROUP BY "Area"."id", "Area"."name", "Area"."centroid", "Area"."meta", "Flow".value
        ORDER BY value DESC;
      `,
      prisma.$queryRaw`
          SELECT ST_AsGeoJSON(ST_Extent(ST_Transform("limits", 4326))) as geojson
          FROM "Area"
          WHERE "id" IN (SELECT "toAreaId" FROM "Flow" WHERE "fromAreaId" = ${id});
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
      (AreaProps & { centroid: string })[],
      { geojson: string }[],
      DestinationPortRow[],
    ];

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
      destinationAreas: destinationAreas.map((area) => ({
        ...area,
        centroid: JSON.parse(area.centroid) as GeoJSON.Point,
      })),
      destinationAreasBbox:
        JSON.parse(destinationAreasBbox[0]?.geojson) || null,
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
