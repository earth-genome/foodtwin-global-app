import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { FeatureCollection } from "geojson";

interface FlowGeometryRow {
  fromAreaId: string;
  toAreaId: string;
  geojson: string;
}

interface FlowRow {
  fromAreaId: string;
  toAreaId: string;
  totalValue: number;
}

export interface FromToFlowsResponse {
  flows: FlowRow[];
  flowGeometriesGeojson: FeatureCollection;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<FromToFlowsResponse>> {
  const { id } = params;

  const flows = await prisma.$queryRaw<FlowRow[]>`
    SELECT
      "Flow"."fromAreaId",
      "Flow"."toAreaId",
      sum("Flow"."value") as "totalValue"
    FROM
      "Flow"
    WHERE
      "Flow"."fromAreaId" = ${id}
    GROUP BY
      "Flow"."fromAreaId",
      "Flow"."toAreaId"
    ORDER BY
      "totalValue" DESC
    LIMIT 250;
  `;

  const toAreaIds = flows.map((f) => f.toAreaId);

  if (toAreaIds.length === 0) {
    return NextResponse.json({
      flows,
      flowGeometriesGeojson: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }

  const flowGeometries = await prisma.$queryRaw<FlowGeometryRow[]>`
    SELECT
      "fromAreaId",
      "toAreaId",
      ST_AsGeoJSON(ST_LineMerge("geom"), 4326) as "geojson"
    FROM
      "FlowPairsGeometries"
    WHERE
      "fromAreaId" = ${id} AND "toAreaId" IN (${Prisma.join(toAreaIds)});
  `;

  const flowGeometriesGeojson: FeatureCollection = {
    type: "FeatureCollection",
    features: flowGeometries.map((f) => ({
      type: "Feature",
      properties: {
        fromAreaId: f.fromAreaId,
        toAreaId: f.toAreaId,
        totalValue: flows.find((flow) => flow.toAreaId === f.toAreaId)
          ?.totalValue,
      },
      geometry: JSON.parse(f.geojson),
    })),
  };

  return NextResponse.json({
    flows,
    flowGeometriesGeojson,
  });
}
