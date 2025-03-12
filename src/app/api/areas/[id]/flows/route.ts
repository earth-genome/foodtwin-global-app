import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const flows = await prisma.$queryRaw`
    SELECT
      "foodGroupId",
      "toAreaId",
      "type",
      "sumValue",
      ST_AsGeoJSON("multiLineStringGeom") as geomWkb
    FROM
      "AreaFlowsGeometries"
    WHERE
      "fromAreaId" = ${id}
  `;

  return NextResponse.json({ flows });
}
