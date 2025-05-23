"use client";

import { TripsLayer } from "@deck.gl/geo-layers";
import { PARTICLE_CONFIG } from "./config";
import { ParticleData } from "./types";
import { useAnimationFrame } from "./use-animation";
import { DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl";

// Convert config paths to particle data format
const TEST_DATA: ParticleData[] = PARTICLE_CONFIG.testData.paths.map(
  (path) => ({
    path: [path.from, path.to],
    color: path.color,
  })
);

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const ParticlesLayer = () => {
  const currentFrame = useAnimationFrame();

  const tripsLayer = new TripsLayer({
    id: "flow-particles",
    data: TEST_DATA,
    getPath: (d: ParticleData) => d.path,
    getTimestamps: () => [0, 100],
    getColor: (d: ParticleData) => d.color,
    currentTime: currentFrame,
    trailLength: PARTICLE_CONFIG.appearance.trailLength,
    widthMinPixels: PARTICLE_CONFIG.appearance.widthMinPixels,
    fadeTrail: PARTICLE_CONFIG.appearance.fadeTrail,
    capRounded: PARTICLE_CONFIG.appearance.capRounded,
    jointRounded: PARTICLE_CONFIG.appearance.jointRounded,
  });

  return <DeckGLOverlay layers={[tripsLayer]} />;
};

export default ParticlesLayer;
