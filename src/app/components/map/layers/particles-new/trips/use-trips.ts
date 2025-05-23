import useSWR from "swr";
import { fetchParticlePaths } from "../fetch";
import { generateTripPath } from "./trip-path";
import { ensure2DCoordinates } from "../utils";
import { ParticleDataWithTimestamps } from "../types";
import { FeatureCollection, LineString } from "geojson";
import { generateParticlesForPath } from "./particle-generator";

export function useTrips(areaId: string) {
  const {
    data: pathsData,
    isLoading,
    error,
  } = useSWR(areaId ? `particle-paths-${areaId}` : null, () =>
    fetchParticlePaths(areaId)
  );

  const particleData: ParticleDataWithTimestamps[] | undefined =
    pathsData?.features.flatMap((feature) => {
      const { path, timestamps } = generateTripPath(
        feature.geometry.coordinates.map(ensure2DCoordinates)
      );
      return generateParticlesForPath(path, timestamps);
    });

  return {
    particleData,
    pathsData: pathsData as FeatureCollection<LineString> | undefined,
    isLoading,
    error,
  };
}
