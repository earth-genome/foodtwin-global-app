import { FeatureCollection, LineString, Feature } from "geojson";
import { FromToFlowsResponse } from "@/app/api/areas/[id]/flows/route";
import { distance, point } from "@turf/turf";

interface Path {
  coordinates: [number, number][];
  distances: number[];
  totalDistance: number;
}

interface FlowFeatureProperties {
  fromAreaId: string;
  toAreaId: string;
  path: Path;
}

const getDistances = (coordinates: [number, number][]) => {
  const distances = [];
  for (let i = 1; i < coordinates.length; i++) {
    const waypoint = coordinates[i];
    const prevWaypoint = coordinates[i - 1];
    const dist = distance(point(prevWaypoint), point(waypoint));
    distances.push(dist);
  }

  const totalDistance = distances.reduce((a, b) => a + b, 0);
  return {
    distances,
    totalDistance,
  };
};

export async function fetchParticlePaths(
  areaId: string
): Promise<FeatureCollection<LineString, FlowFeatureProperties>> {
  const response = await fetch(`/api/areas/${areaId}/flows`);
  if (!response.ok) {
    throw new Error("Failed to fetch flows");
  }

  const { flowGeometriesGeojson }: FromToFlowsResponse = await response.json();

  const features: Feature<LineString, FlowFeatureProperties>[] =
    flowGeometriesGeojson.features.map((feature) => {
      const path: Path = {
        coordinates: feature.geometry.coordinates as [number, number][],
        ...getDistances(feature.geometry.coordinates as [number, number][]),
      };

      return {
        type: "Feature" as const,
        properties: {
          fromAreaId: feature.properties.fromAreaId,
          toAreaId: feature.properties.toAreaId,
          path,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: path.coordinates,
        },
      };
    });

  return {
    type: "FeatureCollection" as const,
    features,
  };
}
