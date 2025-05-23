import { Coordinate, TripPoint, TripPath } from "./types";
import * as turf from "@turf/turf";
import { PARTICLE_CONFIG } from "./config";

function generateEvenlySpacedPoints(
  path: Coordinate[],
  spacing: number
): TripPoint[] {
  if (path.length < 2) return [{ coordinates: path[0], timestamp: 0 }];

  const line = turf.lineString(path);
  const length = turf.length(line, { units: "meters" });
  const numPoints = Math.ceil(length / spacing);
  const step = length / numPoints;

  const points: TripPoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const distance = i * step;
    const point = turf.along(line, distance, { units: "meters" });
    const timestamp =
      (distance / length) * PARTICLE_CONFIG.animation.loopLength;
    points.push({
      coordinates: point.geometry.coordinates as Coordinate,
      timestamp,
    });
  }

  return points;
}

function findOptimalSpacing(
  path: Coordinate[],
  initialSpacing: number
): number {
  const line = turf.lineString(path);
  const length = turf.length(line, { units: "meters" });

  // Start with initial spacing
  let currentSpacing = initialSpacing;
  let iterations = 0;

  while (iterations < PARTICLE_CONFIG.tripGeneration.maxIterations) {
    const numPoints = Math.ceil(length / currentSpacing);

    // If we're within limits, we're done
    if (
      numPoints <= PARTICLE_CONFIG.tripGeneration.maxPoints &&
      currentSpacing >= PARTICLE_CONFIG.tripGeneration.minSpacing
    ) {
      return currentSpacing;
    }

    // If we have too many points, increase spacing
    if (numPoints > PARTICLE_CONFIG.tripGeneration.maxPoints) {
      currentSpacing = Math.min(
        PARTICLE_CONFIG.tripGeneration.maxSpacing,
        Math.ceil(length / PARTICLE_CONFIG.tripGeneration.maxPoints)
      );
    }
    // If spacing is too small, increase it
    else if (currentSpacing < PARTICLE_CONFIG.tripGeneration.minSpacing) {
      currentSpacing = Math.min(
        PARTICLE_CONFIG.tripGeneration.maxSpacing,
        currentSpacing * 2
      );
    }
    // If we've hit max spacing, we're done
    else if (currentSpacing >= PARTICLE_CONFIG.tripGeneration.maxSpacing) {
      return currentSpacing;
    }

    iterations++;
  }

  // If we've hit max iterations, return the best we've got
  return currentSpacing;
}

export function generateTripPath(
  path: Coordinate[],
  initialSpacing = PARTICLE_CONFIG.tripGeneration.initialSpacing
): TripPath {
  const optimalSpacing = findOptimalSpacing(path, initialSpacing);
  const tripPoints = generateEvenlySpacedPoints(path, optimalSpacing);
  return {
    path: tripPoints.map((p) => p.coordinates),
    timestamps: tripPoints.map((p) => p.timestamp),
  };
}
