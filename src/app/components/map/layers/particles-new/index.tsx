"use client";

import { TripsLayer } from "@deck.gl/geo-layers";
import { PARTICLE_CONFIG } from "./config";
import { ParticleData } from "./types";
import { useAnimationFrame } from "./use-animation";
import { DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl";
import useSWR from "swr";
import { fetchParticlePaths } from "./fetch";
import { ensure2DCoordinates } from "./utils";

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const ParticlesLayer = () => {
  const currentFrame = useAnimationFrame();
  const { data: pathsData, isLoading } = useSWR(
    "particle-paths",
    fetchParticlePaths
  );

  if (isLoading || !pathsData) return null;

  // Transform GeoJSON paths to particle data format
  const particleData: ParticleData[] = pathsData.features.map((feature) => ({
    path: feature.geometry.coordinates.map(ensure2DCoordinates),
    color: PARTICLE_CONFIG.appearance.color,
  }));

  const tripsLayer = new TripsLayer({
    id: "flow-particles",
    data: particleData,
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
