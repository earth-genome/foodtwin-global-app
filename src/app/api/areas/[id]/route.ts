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
  centroid: GeoJSON.Point;
  boundingBox: GeoJSON.Feature;
  destinationAreas: AreaWithCentroidProps[];
  destinationAreasBbox: GeoJSON.Feature;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const areaRows = await prisma.$queryRaw<
      (AreaProps & { centroid: string })[]
    >`
      SELECT
        id,
        name,
        (meta->>'totalpop')::float as totalpop,
        ST_AsGeoJSON(ST_Transform("Area"."centroid", 4326)) as centroid
      FROM "Area"
      WHERE id = ${id}
      LIMIT 1;
    `;

    const area = areaRows[0];

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const [boundingBoxRows, destinationAreas, destinationAreasBbox] =
      (await Promise.all([
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
      ])) as [
        { geojson: string }[],
        (AreaProps & { centroid: string })[],
        { geojson: string }[],
      ];

    const result: FetchAreaResponse = {
      ...area,
      boundingBox: JSON.parse(boundingBoxRows[0]?.geojson) || null,
      centroid: JSON.parse(area.centroid),
      destinationAreas: destinationAreas.map((area) => ({
        ...area,
        centroid: JSON.parse(area.centroid) as GeoJSON.Point,
      })),
      destinationAreasBbox:
        JSON.parse(destinationAreasBbox[0]?.geojson) || null,
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
