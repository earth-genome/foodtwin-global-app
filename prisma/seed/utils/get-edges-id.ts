import { Edge, PrismaClient } from "@prisma/client";

/**
 * Creates a virtual edge between two nodes by making a straight line.
 * @param prisma - Prisma client
 * @param fromNodeId - Source node ID
 * @param toNodeId - Target node ID
 * @returns The created edge
 */
async function createVirtualEdge(
  prisma: PrismaClient,
  fromNodeId: string,
  toNodeId: string
): Promise<Edge> {
  const edgeId = `${fromNodeId}-${toNodeId}`;

  const nodeCheck = await prisma.$queryRaw<
    { id: string; exists: boolean; has_geom: boolean }[]
  >`
    SELECT 
      id, 
      EXISTS(SELECT 1 FROM "Node" WHERE id = id) as exists,
      EXISTS(SELECT 1 FROM "Node" WHERE id = id AND geom IS NOT NULL) as has_geom
    FROM (VALUES (${fromNodeId}), (${toNodeId})) as nodes(id)
  `;

  const missingNodes = nodeCheck.filter((n) => !n.exists).map((n) => n.id);
  if (missingNodes.length > 0) {
    throw new Error(`Nodes not found in database: ${missingNodes.join(", ")}`);
  }

  const nodesWithoutGeom = nodeCheck
    .filter((n) => !n.has_geom)
    .map((n) => n.id);
  if (nodesWithoutGeom.length > 0) {
    throw new Error(
      `Nodes exist but have no geometry: ${nodesWithoutGeom.join(", ")}`
    );
  }

  const geometries = await prisma.$queryRaw<
    { id: string; geom: string | null }[]
  >`
    SELECT id, ST_AsText(geom) as geom
    FROM "Node"
    WHERE id IN (${fromNodeId}, ${toNodeId})
  `;

  if (geometries.length !== 2) {
    throw new Error(
      `Expected 2 nodes with geometries, found ${geometries.length}`
    );
  }

  try {
    const [edge] = await prisma.$queryRaw<{ id: number }[]>`
      WITH node_geoms AS (
        SELECT id, geom 
        FROM "Node" 
        WHERE id IN (${fromNodeId}, ${toNodeId})
      ),
      line_geom AS (
        SELECT ST_MakeLine(
          (SELECT geom FROM node_geoms WHERE id = ${fromNodeId}),
          (SELECT geom FROM node_geoms WHERE id = ${toNodeId})
        ) as geom
      )
      INSERT INTO "Edge" ("id_str", "fromNodeId", "toNodeId", "type", "distance", "geom")
      SELECT 
        ${edgeId} as id_str,
        ${fromNodeId} as "fromNodeId",
        ${toNodeId} as "toNodeId",
        'LAND' as type,
        0 as distance,
        ST_Transform(geom, 4326) as geom
      FROM line_geom
      WHERE geom IS NOT NULL
      RETURNING id
    `;

    if (!edge) {
      throw new Error(
        `Failed to create edge ${edgeId} - no edge returned from insert`
      );
    }

    return {
      id: edge.id,
      id_str: edgeId,
      fromNodeId,
      toNodeId,
      type: "LAND" as const,
      distance: 0,
    } satisfies Pick<
      Edge,
      "id" | "id_str" | "fromNodeId" | "toNodeId" | "type" | "distance"
    >;
  } catch (error) {
    throw new Error(
      `Failed to create edge ${edgeId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Gets numeric database IDs for edge string IDs.
 * Creates virtual edges for edges that don't exist in the database.
 * @param prisma - Prisma client
 * @param edgesIdStr - Array of edge string IDs
 * @returns Array of corresponding numeric IDs in same order
 */
export async function getEdgesId(
  prisma: PrismaClient,
  edgesIdStr: string[]
): Promise<number[]> {
  if (!edgesIdStr.length) return [];

  // Create a map to store the results
  const edgeIdMap = new Map<string, number>();

  // Query existing edges
  const existingEdges = await prisma.edge.findMany({
    select: {
      id_str: true,
      id: true,
    },
    where: {
      id_str: { in: edgesIdStr },
    },
  });

  // Store existing edges in the map
  existingEdges.forEach((edge) => {
    edgeIdMap.set(edge.id_str, edge.id);
  });

  // Find missing edges and try to create virtual ones
  const missingIds = edgesIdStr.filter((id) => !edgeIdMap.has(id));
  const failedEdges: string[] = [];

  for (const missingId of missingIds) {
    try {
      const [fromNodeId, toNodeId] = missingId.split("-");
      if (!fromNodeId || !toNodeId) {
        failedEdges.push(missingId);
        continue;
      }

      const virtualEdge = await createVirtualEdge(prisma, fromNodeId, toNodeId);
      edgeIdMap.set(missingId, virtualEdge.id);
    } catch (error) {
      failedEdges.push(missingId);
    }
  }

  // Check if any edges are still missing
  const notFoundIds = edgesIdStr.filter((id) => !edgeIdMap.has(id));
  if (notFoundIds.length > 0) {
    throw new Error(
      `Edge IDs not found and could not create virtual edges: ${notFoundIds.join(", ")}`
    );
  }

  // Return the IDs in the same order as requested
  return edgesIdStr.map((id) => {
    const edgeId = edgeIdMap.get(id);
    if (edgeId === undefined) {
      throw new Error(`Edge ID ${id} not found in map after processing`);
    }
    return edgeId;
  });
}
