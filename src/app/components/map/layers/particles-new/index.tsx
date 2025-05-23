"use client";

import { TripsLayer } from "@deck.gl/geo-layers";
import { PARTICLE_CONFIG } from "./config";
import { ParticleDataWithTimestamps } from "./types";
import { useAnimationFrame } from "./use-animation";
import { DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl";
import { useTrips } from "./trips/use-trips";

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const ParticlesLayer = () => {
  const currentFrame = useAnimationFrame();
  const { particleData, isLoading } = useTrips();

  if (isLoading || !particleData) return null;

  const tripsLayer = new TripsLayer({
    id: "flow-particles",
    data: particleData,
    getPath: (d: ParticleDataWithTimestamps) => d.path,
    getTimestamps: (d: ParticleDataWithTimestamps) => d.timestamps,
    getColor: (d: ParticleDataWithTimestamps) => d.color,
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
