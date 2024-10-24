import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface FlowDestination {
  id: string;
  name: string;
}

export interface FetchAreaResponse {
  id: string;
  name: string;
  boundingBox: GeoJSON.Feature;
  flowDestinations: GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    FlowDestination
  >;
}

interface DestinationArea {
  id: string;
  name: string;
  geometry: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const area = await prisma.area.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const [boundingBox, destinationAreas] = await Promise.all([
      prisma.$queryRaw`
        SELECT ST_AsGeoJSON(ST_Extent(ST_Transform(limits, 4326))) as geojson FROM "Area" WHERE id = ${id}
      `,
      prisma.$queryRaw`
        select "Area"."id", "Area"."name", ST_AsGeoJSON(ST_Transform(limits, 4326)) as geometry from "Flow" LEFT JOIN "Area" ON "Flow"."toAreaId" = "Area"."id" where "fromAreaId" = ${id};
      `,
    ]);

    const flowDestinations = {
      type: "FeatureCollection",
      features: (destinationAreas as DestinationArea[]).map(
        ({ id, name, geometry }) => ({
          type: "Feature",
          properties: {
            id,
            name,
          },
          geometry: JSON.parse(geometry),
        })
      ),
    };

    const result = {
      ...area,
      boundingBox:
        JSON.parse((boundingBox as { geojson: string }[])[0]?.geojson) || null, // Extract the bounding box as GeoJSON
      flowDestinations,
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
