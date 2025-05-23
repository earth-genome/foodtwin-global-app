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
    color: [0, 122, 255, 255] as Color,
  },
} as const;
