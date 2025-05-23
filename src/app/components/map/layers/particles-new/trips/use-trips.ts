/**
 * useTrips - React hook for generating animated particle data for food flow visualization.
 *
 * This hook fetches flow path data for a given area, determines the maximum flow value per food group,
 * and generates particle animation data for each flow. The number of particles is scaled relative to the
 * flow value, and each particle is colored according to its food group. The result is a set of animated
 * particles that visually represent the magnitude and type of food flows on a map.
 *
 * Key steps:
 * 1. Fetch flow path data for the specified area.
 * 2. Find the maximum flow value for each food group (for scaling).
 * 3. For each flow, generate a number of particles proportional to its value.
 * 4. Assign each particle a color based on its food group.
 * 5. Distribute particles along the path with animation offsets for smooth looping.
 */
import useSWR from "swr";
import { fetchParticlePaths, FlowFeatureProperties } from "../fetch";
import { Feature, LineString, FeatureCollection } from "geojson";
import { generateTripPath } from "./trip-path";
import { ensure2DCoordinates } from "../utils";
import { ParticleDataWithTimestamps } from "../types";
import { PARTICLE_CONFIG } from "../config";
import { FoodGroupColors } from "../../../../../../../tailwind.config";
import { hexToRgba } from "@/utils/general";
import { getFoodGroupColor } from "@/utils/general";

// Helper to determine the number of particles for a flow, scaled by value
function getNumParticlesForFlow(
  value: number,
  max: number,
  cap: number
): number {
  if (!max || max <= 0) return 1;
  return Math.max(1, Math.round((value / max) * cap));
}

/**
 * useTrips - Main hook
 * @param areaId - The area to fetch and visualize flows for
 * @returns Animated particle data and loading/error state
 */
export function useTrips(areaId: string) {
  // Fetch flow path data for the area
  const {
    data: pathsData,
    isLoading,
    error,
  } = useSWR(areaId ? `particle-paths-${areaId}` : null, () =>
    fetchParticlePaths(areaId)
  );

  let particleData: ParticleDataWithTimestamps[] | undefined = undefined;

  if (pathsData) {
    // 1. Find the max value for each food group across all flows
    const maxValueByFoodGroup: Record<string, number> = {};
    for (const feature of pathsData.features as Feature<
      LineString,
      FlowFeatureProperties
    >[]) {
      for (const flow of feature.properties.flows || []) {
        const { foodGroupSlug: slug, value } = flow;
        if (!maxValueByFoodGroup[slug] || value > maxValueByFoodGroup[slug]) {
          maxValueByFoodGroup[slug] = value;
        }
      }
    }

    // 2. Generate particles for each flow in each feature
    particleData = [];
    for (const feature of pathsData.features as Feature<
      LineString,
      FlowFeatureProperties
    >[]) {
      // Generate the path and animation timestamps for this feature
      const { path, timestamps } = generateTripPath(
        feature.geometry.coordinates.map(ensure2DCoordinates)
      );
      const flows = feature.properties.flows || [];
      for (const flow of flows) {
        const slug = flow.foodGroupSlug;
        const value = flow.value;
        const max = maxValueByFoodGroup[slug] || 1;
        const cap =
          PARTICLE_CONFIG.particleCountScaling
            .maxParticlesPerFoodGroupPerGeometry;
        const color = getFoodGroupColor(slug); // Assign color by food group
        const numParticles = getNumParticlesForFlow(value, max, cap); // Scale particle count

        // Distribute particles along the path, offsetting animation for smooth looping
        for (let i = 0; i < numParticles; i++) {
          const offset =
            (i * PARTICLE_CONFIG.animation.loopLength) / numParticles;
          const particleTimestamps = timestamps.map(
            (t) => (t + offset) % PARTICLE_CONFIG.animation.loopLength
          );
          particleData.push({
            path,
            timestamps: particleTimestamps,
            color,
          });
        }
      }
    }
  }

  return {
    particleData,
    pathsData: pathsData as FeatureCollection<LineString> | undefined,
    isLoading,
    error,
  };
}
