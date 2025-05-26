import { Coordinate } from "../types";
import * as turf from "@turf/turf";
import { PARTICLE_CONFIG } from "../config";

/**
 * Calculates the optimal spacing between points along a path, ensuring the number of points
 * does not exceed configuration limits and spacing is within allowed bounds.
 */
export function findOptimalSpacing(
  path: Coordinate[],
  initialSpacing: number
): number {
  const line = turf.lineString(path);
  const length = turf.length(line, { units: "meters" });

  let currentSpacing = initialSpacing;
  let iterations = 0;

  while (iterations < PARTICLE_CONFIG.tripGeneration.maxIterations) {
    const numPoints = Math.ceil(length / currentSpacing);
    if (
      numPoints <= PARTICLE_CONFIG.tripGeneration.maxPoints &&
      currentSpacing >= PARTICLE_CONFIG.tripGeneration.minSpacing
    ) {
      return currentSpacing;
    }
    if (numPoints > PARTICLE_CONFIG.tripGeneration.maxPoints) {
      currentSpacing = Math.min(
        PARTICLE_CONFIG.tripGeneration.maxSpacing,
        Math.ceil(length / PARTICLE_CONFIG.tripGeneration.maxPoints)
      );
    } else if (currentSpacing < PARTICLE_CONFIG.tripGeneration.minSpacing) {
      currentSpacing = Math.min(
        PARTICLE_CONFIG.tripGeneration.maxSpacing,
        currentSpacing * 2
      );
    } else if (currentSpacing >= PARTICLE_CONFIG.tripGeneration.maxSpacing) {
      return currentSpacing;
    }
    iterations++;
  }
  return currentSpacing;
}
