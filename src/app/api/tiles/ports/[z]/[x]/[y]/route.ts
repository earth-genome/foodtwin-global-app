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

  const zNum = Number(z);
  const xNum = Number(x);
  const yNum = Number(y);

  const query = `
    SELECT ST_AsMVT(tile, 'default', 4096, 'geom', 'id_int') FROM (
      SELECT
        id,
        ((ctid::text::point)[0]::bigint << 32) | (ctid::text::point)[1]::bigint AS id_int,
        name,
        ST_AsMVTGeom(
          geom,
          ST_TileEnvelope(${zNum}, ${xNum}, ${yNum})
        ) AS geom
      FROM "Node"
      WHERE type = 'PORT' AND ST_Intersects(
        geom,
        ST_TileEnvelope(${zNum}, ${xNum}, ${yNum})
      )
    ) AS tile;
  `;

  const tile = (await prisma.$queryRawUnsafe(query)) as Tile[];

  return new NextResponse(tile[0].st_asmvt, {
    headers: {
      "Content-Type": "application/vnd.mapbox-vector-tile",
    },
  });
}
