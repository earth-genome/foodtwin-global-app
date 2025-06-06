import { FeatureCollection, LineString, Feature } from "geojson";
import { FromToFlowsResponse } from "@/app/api/areas/[id]/flows/route";
import { distance, point } from "@turf/turf";

interface Path {
  coordinates: [number, number][];
  distances: number[];
  totalDistance: number;
}

export interface FlowFeatureProperties {
  fromAreaId: string;
  toAreaId: string;
  path: Path;
  flows?: {
    value: number;
    foodGroupId: number;
    foodGroupSlug: string;
  }[];
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

const createPath = (coordinates: [number, number][]): Path => {
  try {
    const distanceData = getDistances(coordinates);
    return {
      coordinates,
      ...distanceData,
    };
  } catch (error) {
    // Return safe fallback if distance calculation fails
    return {
      coordinates,
      distances: [],
      totalDistance: 0,
    };
  }
};

const createLineStringFeature = (
  coordinates: [number, number][],
  properties: {
    fromAreaId: string;
    toAreaId: string;
    flows: {
      value: number;
      foodGroupId: number;
      foodGroupSlug: string;
    }[];
  }
): Feature<LineString, FlowFeatureProperties> => {
  const path = createPath(coordinates);

  return {
    type: "Feature",
    properties: {
      fromAreaId: properties.fromAreaId,
      toAreaId: properties.toAreaId,
      path,
      flows: properties.flows,
    },
    geometry: {
      type: "LineString",
      coordinates,
    },
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

  const features: Feature<LineString, FlowFeatureProperties>[] = [];

  flowGeometriesGeojson.features.forEach((feature) => {
    if (feature.geometry.type === "MultiLineString") {
      // Convert each line in MultiLineString to separate LineString features
      const multiLineFeatures = feature.geometry.coordinates.map(
        (lineCoordinates) =>
          createLineStringFeature(
            lineCoordinates as [number, number][],
            feature.properties
          )
      );
      features.push(...multiLineFeatures);
    } else {
      // Handle single LineString
      const lineStringFeature = createLineStringFeature(
        feature.geometry.coordinates as [number, number][],
        feature.properties
      );
      features.push(lineStringFeature);
    }
  });

  return {
    type: "FeatureCollection",
    features,
  };
}
