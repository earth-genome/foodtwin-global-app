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
  destinationPorts: GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    DestinationPort
  >;
}

interface DestinationArea {
  id: string;
  name: string;
  geometry: string;
}

interface DestinationPort {
  id: string;
  id_int: string;
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

    const [boundingBox, destinationAreas, destinationPortsFeatures] =
      await Promise.all([
        prisma.$queryRaw`
        SELECT ST_AsGeoJSON(ST_Extent(ST_Transform(limits, 4326))) as geojson FROM "Area" WHERE id = ${id}
      `,
        prisma.$queryRaw`
        select "Area"."id", "Area"."name", ST_AsGeoJSON(ST_Transform(limits, 4326)) as geometry from "Flow" LEFT JOIN "Area" ON "Flow"."toAreaId" = "Area"."id" where "fromAreaId" = ${id};
      `,
        // TODO this is a temporary query to get the 10 closest ports to the area until there is maritime data in the database
        prisma.$queryRaw<DestinationPort[]>`
          SELECT 
            "Node"."id", 
            ((ctid::text::point)[0]::bigint << 32) | (ctid::text::point)[1]::bigint AS id_int,
            "Node"."name", 
            ST_AsGeoJSON(ST_Transform("Node"."geom", 4326)) as geometry
          FROM "Node"
          WHERE "Node"."type" = 'PORT'
          ORDER BY ST_Distance(
            ST_Transform(
              (SELECT ST_Centroid(ST_Transform("limits", 4326)) FROM "Area" WHERE "id" = ${id}),
              4326
            ),
            ST_Transform("Node"."geom", 4326)
          ) ASC
          LIMIT 10;
        `,
      ]);

    const flowDestinations: GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      FlowDestination
    > = {
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

    const destinationPorts: GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      FlowDestination
    > = {
      type: "FeatureCollection",
      features: (destinationPortsFeatures as DestinationPort[]).map(
        ({ id, id_int, name, geometry }) => ({
          type: "Feature",
          properties: {
            id,
            id_int: id_int.toString(),
            name,
          },
          geometry: JSON.parse(geometry), // Parse the GeoJSON geometry
        })
      ),
    };

    const result: FetchAreaResponse = {
      ...area,
      boundingBox:
        JSON.parse((boundingBox as { geojson: string }[])[0]?.geojson) || null, // Extract the bounding box as GeoJSON
      flowDestinations,
      destinationPorts,
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
