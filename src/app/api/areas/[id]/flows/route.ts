import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface FlowPairRow {
  fromAreaId: string;
  toAreaId: string;
  geojson: string;
}

interface FlowPair {
  fromAreaId: string;
  toAreaId: string;
  geojson: GeoJSON.MultiLineString;
}

export interface AreaFlowsResponse {
  flows: FlowPair[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const flows = await prisma.$queryRaw<FlowPairRow[]>`
    SELECT
      "fromAreaId",
      "toAreaId",
      ST_AsGeoJSON(ST_LineMerge("geom"), 4326) as "geojson"
    FROM
      "FlowPairsGeometries"
    WHERE
      "fromAreaId" = ${id}
    LIMIT 5;
  `;

  const result: AreaFlowsResponse = {
    flows: flows.map((flow) => ({
      ...flow,
      geojson: JSON.parse(flow.geojson) as GeoJSON.MultiLineString,
    })),
  };

  return NextResponse.json(result);
}
