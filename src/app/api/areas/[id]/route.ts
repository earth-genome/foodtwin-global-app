import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MultiPolygon } from "geojson";

export interface FetchAreaResponse {
  id: string;
  name: string;
  boundingBox: GeoJSON.Feature;
  geometry: MultiPolygon;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const areas = (await prisma.$queryRaw`
      SELECT id, name, ST_AsGeoJSON(ST_Transform(limits, 4326)) as geometry, ST_AsGeoJSON(ST_Extent(ST_Transform(limits, 4326))) as "boundingBox" FROM "Area" WHERE id = ${id} group by id, name
    `) as { boundingBox: string; geometry: string }[];

    if (areas.length === 0) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const result = {
      ...areas[0],
      geometry: JSON.parse(areas[0].geometry),
      boundingBox: JSON.parse(areas[0]?.boundingBox) || null, // Extract the bounding box as GeoJSON
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
