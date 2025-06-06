"use client";

import { TripsLayer } from "@deck.gl/geo-layers";
import { PARTICLE_CONFIG } from "./config";
import { ParticleDataWithTimestamps } from "./types";
import { useAnimationFrame } from "./use-animation";
import { useTrips } from "./trips/use-trips";
import { DeckGLOverlay } from "./layers/deck-gl-overlay";
import { FlowPathsLayer } from "./layers/flow-paths-layer";
import { MachineContext } from "../../state";
import { EAreaViewType } from "../../state/machine";

interface ParticlesLayerProps {
  areaId: string;
}

const ParticlesLayer = ({ areaId }: ParticlesLayerProps) => {
  const currentFrame = useAnimationFrame();
  const { particleData, pathsData, isLoading } = useTrips(areaId);
  const areaViewType = MachineContext.useSelector(
    (state) => state.context.currentAreaViewType
  );

  if (
    isLoading ||
    !particleData ||
    !pathsData ||
    areaViewType !== EAreaViewType.transportation
  )
    return null;

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

  return (
    <>
      <FlowPathsLayer pathsData={pathsData} />
      <DeckGLOverlay layers={[tripsLayer]} />
    </>
  );
};

export default ParticlesLayer;
