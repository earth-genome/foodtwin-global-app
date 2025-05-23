"use client";

import { TripsLayer } from "@deck.gl/geo-layers";
import { PARTICLE_CONFIG } from "./config";
import { ParticleDataWithTimestamps } from "./types";
import { useAnimationFrame } from "./use-animation";
import { DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl";
import useSWR from "swr";
import { fetchParticlePaths } from "./fetch";
import { ensure2DCoordinates } from "./utils";
import { generateTripPath } from "./trip-generator";

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

  const particleData: ParticleDataWithTimestamps[] = pathsData.features.map(
    (feature) => {
      const { path, timestamps } = generateTripPath(
        feature.geometry.coordinates.map(ensure2DCoordinates),
        10000
      );
      return {
        path,
        timestamps,
        color: PARTICLE_CONFIG.appearance.color,
      };
    }
  );

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
