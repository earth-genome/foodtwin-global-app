import { Color } from "@deck.gl/core";

export const PARTICLE_CONFIG = {
  animation: {
    fps: 20, // Controls how smooth the animation is
    loopLength: 100, // How many frames before the animation loops
  },

  appearance: {
    trailLength: 5,
    widthMinPixels: 5,
    fadeTrail: true,
    capRounded: true,
    jointRounded: true,
    color: [0, 122, 255, 255] as Color,
  },

  tripGeneration: {
    maxPoints: 50, // Maximum number of points per trip
    minSpacing: 1000, // Minimum spacing in meters (1km)
    maxSpacing: 100000, // Maximum spacing in meters (100km)
    initialSpacing: 10000, // Default initial spacing in meters (10km)
    maxIterations: 10, // Maximum iterations for finding optimal spacing
  },

  particleCountScaling: {
    minParticles: 1,
    maxParticles: 10,
    minLengthKm: 400,
    maxLengthKm: 40000,
  },
} as const;
