import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface FetchAreaResponse {
  id: string;
  name: string;
  boundingBox: GeoJSON.Feature | null;
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

    const boundingBox = (await prisma.$queryRaw`
      SELECT ST_AsGeoJSON(ST_Extent(ST_Transform(limits, 4326))) as geojson FROM "Area" WHERE id = ${id}
    `) as { geojson: string }[];

    const result = {
      ...area,
      boundingBox: JSON.parse(boundingBox[0]?.geojson) || null, // Extract the bounding box as GeoJSON
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
