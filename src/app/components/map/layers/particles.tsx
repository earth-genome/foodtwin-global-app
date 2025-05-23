"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { Color, DeckProps } from "@deck.gl/core";
import { TripsLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl";
import { distance, point } from "@turf/turf";
import { Flow, Path, Trip, Waypoint } from "@/types/data";
import { hexToRgb } from "@/utils/general";
import { FoodGroupColors } from "../../../../../tailwind.config";
import { Position } from "geojson";
import { FromToFlowsResponse } from "@/app/api/areas/[id]/flows/route";

const TRAIL_LENGTH = 0.07;
const WIDTH_MIN_PIXELS = 2.5;

interface DataType {
  fromAreaId: string;
  toAreaId: string;
  waypoints: Waypoint[];
  color: Color;
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const getDistances = (coordinates: Position[]) => {
  const distances = [];
  for (
    let waypointIndex = 1;
    waypointIndex < coordinates.length;
    waypointIndex++
  ) {
    const waypoint = coordinates[waypointIndex];
    const prevWaypoint = coordinates[waypointIndex - 1];
    const dist = distance(point(prevWaypoint), point(waypoint));
    distances.push(dist);
  }

  const totalDistance = distances.reduce((a, b) => a + b, 0);
  return {
    distances,
    totalDistance,
  };
};

const numParticlesMultiplier = 0.000001;
const fromTimestamp = 0;
const toTimeStamp = 100;
const intervalHumanize = 0.5; // Randomize particle start time (0: emitted at regular intervals; 1: emitted at "fully" random intervals)
const speedKps = 100; // Speed in km per second
const speedKpsHumanize = 0.5; // Randomize particles trajectory speed (0: stable duration; 1: can be 0 or 2x the speed)

const getParticleSpeed = (zoomMultiplier: number) => {
  const speedZoomMultiplier = (3 - zoomMultiplier + 2) / 3;
  const baseSpeedKps = speedKps * speedZoomMultiplier;
  const humanizeSpeedKps =
    (Math.random() - 0.5) * 2 * baseSpeedKps * speedKpsHumanize;
  return baseSpeedKps + humanizeSpeedKps;
};

const getPathTrips = (
  path: Path,
  flow: Pick<Flow, "value" | "foodGroupSlug">,
  zoomMultiplier: number,
  maxParticles: number
): Trip[] => {
  const numParticles = Math.min(
    flow.value * numParticlesMultiplier,
    maxParticles
  );

  //
  // REVIEW CALCULATIONS
  // vvvvvvvvvvvvvvvvvvvv
  //
  const d = toTimeStamp - fromTimestamp;
  // Interval is the time between each particle.
  const interval = d / numParticles;

  const trips = [];

  for (let i = 0; i < numParticles; i++) {
    const particleSpeedKps = getParticleSpeed(zoomMultiplier);

    const baseDuration = path.totalDistance / particleSpeedKps;

    const humanizeInterval =
      (Math.random() - 0.5) * 2 * interval * intervalHumanize;

    const timestampStart = fromTimestamp + i * interval + humanizeInterval;

    const timestampEnd = timestampStart + baseDuration;

    const timestampDelta = timestampEnd - timestampStart;
    const waypointsAccumulator = path.coordinates.reduce(
      (accumulator, currentCoords, currentIndex) => {
        const accDistance = accumulator.accDistance;
        const accDistanceRatio = accDistance / path.totalDistance;
        const timestamp = timestampStart + accDistanceRatio * timestampDelta;
        return {
          accDistance: accDistance + path.distances[currentIndex],
          waypoints: [
            ...accumulator.waypoints,
            { coordinates: currentCoords, timestamp: timestamp },
          ],
        };
      },
      { waypoints: [] as Waypoint[], accDistance: 0 }
    );

    const colorHex =
      FoodGroupColors[flow.foodGroupSlug as keyof typeof FoodGroupColors];

    const color = hexToRgb(colorHex.slice(1));

    trips.push({
      waypoints: waypointsAccumulator.waypoints,
      color: [...color, 255] as Color,
      foodGroup: "Grain",
    });
  }

  //
  // ^^^^^^^^^^^^^^^^^^^^
  // REVIEW CALCULATIONS
  //
  return trips;
};

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then(({ flowGeometriesGeojson }: FromToFlowsResponse) => {
      const flowsCount = flowGeometriesGeojson.features.reduce(
        (acc, f) => acc + f.properties.flows.length,
        0
      );

      const maxParticlesPerFlow = Math.floor(500 / flowsCount);

      const data = flowGeometriesGeojson.features
        .map((f) => {
          const flowPath = {
            coordinates: f.geometry.coordinates,
            ...getDistances(f.geometry.coordinates),
          };
          return f.properties.flows.flatMap((flow) =>
            getPathTrips(flowPath, flow, 1, maxParticlesPerFlow)
          );
        })
        .flat();

      return data;
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Error fetching area flows", error);
      throw error;
    });

const AreaParticlesLayer = ({ areaId }: { areaId: string }) => {
  const { data, error, isLoading } = useSWR<Trip[]>(
    `/api/areas/${areaId}/flows`,
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  const currentFrame = useFrame(20);

  if (!data) {
    return null;
  }

  if (isLoading || error) {
    return null;
  }

  const tripsLayer = new TripsLayer<DataType>({
    id: `trips`,
    data,
    getPath: (d: DataType) =>
      d.waypoints.map((p) => p.coordinates as [number, number]),
    getTimestamps: (d: DataType) => d.waypoints.map((p) => p.timestamp),
    getColor: (d: DataType) => d.color,
    currentTime: currentFrame,
    trailLength: TRAIL_LENGTH,
    capRounded: true,
    jointRounded: true,
    fadeTrail: true,
    widthMinPixels: WIDTH_MIN_PIXELS,
  });

  return <DeckGLOverlay layers={[tripsLayer]} />;
};

export default AreaParticlesLayer;

const useFrame = (fps: number) => {
  const [frame, setFrame] = useState(0);

  const loopLength = 100;
  useEffect(() => {
    let prev = 0;

    let rafId: number;
    let frame = 0;
    function tick(time: number) {
      const delta = time - prev;

      if (delta > 1000 / fps) {
        frame++;
        setFrame(frame % loopLength);
        prev = time;
      }

      rafId = requestAnimationFrame(tick);
    }

    tick(0);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return frame;
};
