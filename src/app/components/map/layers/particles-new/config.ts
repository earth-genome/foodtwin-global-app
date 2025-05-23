import { Color } from "@deck.gl/core";

export type Coordinate = [number, number];

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
  },

  testData: {
    paths: [
      {
        from: [-74.006, 40.7128] as Coordinate, // NY
        to: [28.9784, 41.0082] as Coordinate, // Istanbul
        color: [255, 0, 0, 255] as Color,
      },
    ],
  },
} as const;
