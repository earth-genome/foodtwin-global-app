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
  value: number;
  foodGroupId: number;
  foodGroupSlug: string;
  level2FoodGroupId: number | null;
  level2FoodGroupSlug: string | null;
  level3FoodGroupId: number | null;
  level3FoodGroupSlug: string | null;
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
      "Flow"."value",
      "Flow"."foodGroupId",
      "FoodGroup"."slug" as "foodGroupSlug",
      "Level2FoodGroup"."id" as "level2FoodGroupId",
      "Level2FoodGroup"."slug" as "level2FoodGroupSlug",
      "Level3FoodGroup"."id" as "level3FoodGroupId",
      "Level3FoodGroup"."slug" as "level3FoodGroupSlug"
    FROM
      "Flow"
      JOIN "FoodGroup" ON "Flow"."foodGroupId" = "FoodGroup"."id"
      LEFT JOIN "FoodGroup" AS "Level2FoodGroup" ON "FoodGroup"."parentId" = "Level2FoodGroup"."id"
      LEFT JOIN "FoodGroup" AS "Level3FoodGroup" ON "Level2FoodGroup"."parentId" = "Level3FoodGroup"."id"
    WHERE
      "Flow"."fromAreaId" = ${id}
    ORDER BY
      "Flow"."value" DESC  
    LIMIT 5;
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
      },
      geometry: JSON.parse(f.geojson),
    })),
  };

  return NextResponse.json({
    flows,
    flowGeometriesGeojson,
  });
}
