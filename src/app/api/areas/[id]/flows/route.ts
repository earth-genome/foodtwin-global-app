import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { FeatureCollection, LineString, MultiLineString } from "geojson";

interface FlowGeometryRow {
  fromAreaId: string;
  toAreaId: string;
  geojson: LineString | MultiLineString;
}

interface FlowRow {
  fromAreaId: string;
  foodGroupId: number;
  foodGroupSlug: string;
  toAreaId: string;
  totalValue: number;
}

type FlowGeometryGeojson = FeatureCollection<
  LineString | MultiLineString,
  {
    fromAreaId: string;
    toAreaId: string;
    flows: {
      value: number;
      foodGroupId: number;
      foodGroupSlug: string;
    }[];
  }
>;

export interface FromToFlowsResponse {
  flowGeometriesGeojson: FlowGeometryGeojson;
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
      fg3.id as "foodGroupId",
      fg3.slug as "foodGroupSlug",
      sum("Flow"."value") as "totalValue"
    FROM
      "Flow"
    INNER JOIN
      "FoodGroup" as fg1 ON "Flow"."foodGroupId" = fg1."id"
    INNER JOIN
      "FoodGroup" as fg2 ON fg1."parentId" = fg2."id"
    INNER JOIN
      "FoodGroup" as fg3 ON fg2."parentId" = fg3."id"
    WHERE
      "Flow"."fromAreaId" = ${id}
    GROUP BY
      "Flow"."fromAreaId",
      "Flow"."toAreaId",
      fg3."id",
      "foodGroupSlug"
    ORDER BY
      "totalValue" DESC
    LIMIT 500
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
      "geojson"::jsonb as "geojson"
    FROM
      "FlowGeometry"
    WHERE
      "fromAreaId" = ${id} AND "toAreaId" IN (${Prisma.join(toAreaIds)});
  `;

  const flowGeometriesGeojson: FlowGeometryGeojson = {
    type: "FeatureCollection",
    features: flowGeometries.map((f) => {
      const toAreaFlows = flows
        .filter((flow) => flow.toAreaId === f.toAreaId)
        .map((flow) => ({
          foodGroupId: flow.foodGroupId,
          foodGroupSlug: flow.foodGroupSlug,
          value: flow.totalValue,
        }));

      return {
        type: "Feature",
        properties: {
          fromAreaId: f.fromAreaId,
          toAreaId: f.toAreaId,
          flows: toAreaFlows,
        },
        geometry: f.geojson as LineString | MultiLineString,
      };
    }),
  };

  return NextResponse.json({
    flowGeometriesGeojson,
  });
}
