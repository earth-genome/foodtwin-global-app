import { FeatureCollection, LineString } from "geojson";

// Simple mock data with 5 LineStrings that can be used for particle animation
const MOCK_PATHS: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "path1",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-3.7038, 40.4168],
          [-0.1278, 51.5074],
          [2.3522, 48.8566],
          [4.3517, 50.8503],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "path2",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-3.7038, 40.4168],
          [-74.006, 40.7128],
          [-79.3832, 43.6532],
          [-75.6972, 45.4215],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "path3",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-3.7038, 40.4168],
          [2.3522, 48.8566],
          [4.3517, 50.8503],
          [12.4964, 41.9028],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "path4",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-3.7038, 40.4168],
          [55.2708, 25.2048],
          [72.8777, 19.076],
          [77.1025, 28.7041],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "path5",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-3.7038, 40.4168],
          [-46.6333, -23.5505],
          [-58.3816, -34.6037],
          [-70.6483, -33.4489],
        ],
      },
    },
  ],
};

export async function fetchParticlePaths(): Promise<
  FeatureCollection<LineString>
> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_PATHS;
}
