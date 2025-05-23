/**
 * Returns the number of particles to animate along a path, scaling linearly
 * from minParticles to maxParticles as the path length increases from minLengthKm to maxLengthKm.
 * Ensures a minimum and maximum number of particles for visual clarity and performance.
 *
 * @param lengthKm - The length of the path in kilometers
 * @returns The number of particles to use for this path
 */
import { PARTICLE_CONFIG } from "../config";

export function getNumParticles(lengthKm: number): number {
  const { minParticles, maxParticles, minLengthKm, maxLengthKm } =
    PARTICLE_CONFIG.particleCountScaling;
  const t = Math.max(
    0,
    Math.min(1, (lengthKm - minLengthKm) / (maxLengthKm - minLengthKm))
  );
  const num = Math.ceil(minParticles + (maxParticles - minParticles) * t);
  return Math.max(minParticles, Math.min(maxParticles, num));
}
