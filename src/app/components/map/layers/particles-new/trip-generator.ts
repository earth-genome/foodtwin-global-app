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

export function generateTripPath(
  path: Coordinate[],
  spacing = 10000
): TripPath {
  const tripPoints = generateEvenlySpacedPoints(path, spacing);
  return {
    path: tripPoints.map((p) => p.coordinates),
    timestamps: tripPoints.map((p) => p.timestamp),
  };
}
