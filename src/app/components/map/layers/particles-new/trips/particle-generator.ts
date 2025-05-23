/**
 * Generates an array of particle data objects for a given path and its timestamps.
 * Each particle is offset in the animation loop to create a continuous, evenly-spaced flow effect.
 * The number of particles is determined by the path length using getNumParticles.
 *
 * @param path - Array of coordinates representing the path
 * @param timestamps - Array of timestamps for each waypoint
 * @returns Array of ParticleDataWithTimestamps, one for each particle
 */
import * as turf from "@turf/turf";
import { ensure2DCoordinates } from "../utils";
import { PARTICLE_CONFIG } from "../config";
import { ParticleDataWithTimestamps } from "../types";
import { getNumParticles } from "./particle-scaling";

export function generateParticlesForPath(
  path: number[][],
  timestamps: number[]
): ParticleDataWithTimestamps[] {
  const coords = path.map(ensure2DCoordinates);
  const line = turf.lineString(coords);
  const lengthKm = turf.length(line, { units: "kilometers" });
  const numParticles = getNumParticles(lengthKm);
  const loopLength = PARTICLE_CONFIG.animation.loopLength;
  return Array.from({ length: numParticles }, (_, i) => {
    const offset = (i * loopLength) / numParticles;
    const particleTimestamps = timestamps.map((t) => (t + offset) % loopLength);
    return {
      path: coords,
      timestamps: particleTimestamps,
      color: PARTICLE_CONFIG.appearance.color,
    };
  });
}
