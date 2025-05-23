import useSWR from "swr";
import { fetchParticlePaths } from "../fetch";
import { generateTripPath } from "./trip-generator";
import { ensure2DCoordinates } from "../utils";
import { ParticleDataWithTimestamps } from "../types";
import { PARTICLE_CONFIG } from "../config";

export function useTrips() {
  const {
    data: pathsData,
    isLoading,
    error,
  } = useSWR("particle-paths", fetchParticlePaths);

  const particleData: ParticleDataWithTimestamps[] | undefined =
    pathsData?.features.map((feature) => {
      const { path, timestamps } = generateTripPath(
        feature.geometry.coordinates.map(ensure2DCoordinates)
      );
      return {
        path,
        timestamps,
        color: PARTICLE_CONFIG.appearance.color,
      };
    });

  return {
    particleData,
    isLoading,
    error,
  };
}
