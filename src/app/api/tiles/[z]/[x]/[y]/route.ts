import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Tile {
  st_asmvt: Buffer;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { z: string; x: string; y: string } }
) {
  const { z, x, y } = params;

  if (
    !z ||
    !x ||
    !y ||
    isNaN(Number(z)) ||
    isNaN(Number(x)) ||
    isNaN(Number(y))
  ) {
    return NextResponse.json(
      { error: "Invalid tile coordinates" },
      { status: 400 }
    );
  }

  try {
    const zNum = Number(z);
    const xNum = Number(x);
    const yNum = Number(y);

    const query = `
      SELECT ST_AsMVT(tile) FROM (
        SELECT
          id,
          name,
          ST_AsMVTGeom(
            limits,
            ST_TileEnvelope(${zNum}, ${xNum}, ${yNum}, margin => 64.0 / 4096),
            extent => 4096, buffer => 128, clip_geom => false
          ) AS geom
        FROM "Area"
        WHERE ST_Intersects(
          limits,
          ST_TileEnvelope(${zNum}, ${xNum}, ${yNum}, margin => 64.0 / 4096)
        )
      ) AS tile;
    `;

    const tile = (await prisma.$queryRawUnsafe(query)) as Tile[];

    return new NextResponse(tile[0].st_asmvt, {
      headers: {
        "Content-Type": "application/vnd.mapbox-vector-tile",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
