import { Coordinate, TripPath } from "../types";
import { PARTICLE_CONFIG } from "../config";
import { findOptimalSpacing } from "./point-spacing";
import { generateEvenlySpacedPoints } from "./evenly-spaced-points";

/**
 * Generates a trip path (coordinates and timestamps) with optimal point spacing.
 */
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
