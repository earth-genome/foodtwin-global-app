"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { DeckProps } from "@deck.gl/core";
import { TripsLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Layer, Source, useControl } from "react-map-gl";
import { AreaFlowsResponse } from "@/app/api/areas/[id]/flows/route";
import { Position } from "geojson";
import { distance, point } from "@turf/turf";
import { Flow, Path, Trip, Waypoint } from "@/types/data";
import { hexToRgb } from "@/utils/general";
import useAnimationFrame from "@/hooks/useAnimationFrame";

const TRAIL_LENGTH = 0.15;
const WIDTH_MIN_PIXELS = 2.5;

interface DataType {
  fromAreaId: string;
  toAreaId: string;
  waypoints: Waypoint[];
}

export type Category = "Vegetables" | "Nuts" | "Grain" | "Fruits" | "Potatoes";

const CATEGORIES: Category[] = [
  "Grain",
  "Nuts",
  "Vegetables",
  "Fruits",
  "Potatoes",
];

export const CATEGORIES_PROPS: Record<
  Category,
  { name: string; color: string }
> = {
  Vegetables: {
    name: "Vegetables",
    color: "#1C9440",
  },
  Nuts: {
    name: "Nuts",
    color: "#414EC8",
  },
  Grain: {
    name: "Grain",
    color: "#F67300",
  },
  Fruits: {
    name: "Fruits",
    color: "#EC59A8",
  },
  Potatoes: {
    name: "Tubers",
    color: "#873912",
  },
};

export const CATEGORIES_COLORS = Object.fromEntries(
  Object.entries(CATEGORIES_PROPS).map(([cat, { color }]) => [cat, color])
);

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

const getPathTrips = (
  path: Path,
  flow: Flow,
  {
    numParticlesMultiplicator = 1,
    // numParticlesPer1000K = 100,
    fromTimestamp = 0,
    toTimeStamp = 100,
    intervalHumanize = 0.5, // Randomize particle start time (0: emitted at regular intervals, 1: emitted at "fully" random intervals)
    speedKps = 100, // Speed in km per second
    speedKpsHumanize = 0.5, // Randomize particles trajectory speed (0: stable duration, 1: can be 0 or 2x the speed)
    maxParticles = 500,
    colors = CATEGORIES_COLORS,
  } = {},
  zoomMultiplier: number
): Trip[] => {
  const numParticles = Math.min(
    flow.value * numParticlesMultiplicator,
    maxParticles
  );

  const speedZoomMultiplier = (3 - zoomMultiplier + 2) / 3;
  const baseSpeedKps = speedKps * speedZoomMultiplier;

  const d = toTimeStamp - fromTimestamp;
  // const numParticles = (path.totalDistance / 1000) * numParticlesPer1000K;
  const interval = d / numParticles;

  const trips = [];

  for (let i = 0; i < numParticles; i++) {
    const humanizeSpeedKps =
      (Math.random() - 0.5) * 2 * baseSpeedKps * speedKpsHumanize;
    const humanizedSpeedKps = baseSpeedKps + humanizeSpeedKps;

    const baseDuration = path.totalDistance / humanizedSpeedKps;

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

    if (!flow.valuesRatiosByFoodGroup) continue;
    const randomCategoryRatio = Math.random();
    const categoryIndex =
      flow.valuesRatiosByFoodGroup.reduce(
        (acc, ratio, i) => {
          if (acc !== null) return acc;
          if (randomCategoryRatio < ratio) return i;
          return acc;
        },
        null as number | null
      ) || 0;
    const category = CATEGORIES[categoryIndex];
    const categoryColor = colors[category];
    const color = hexToRgb(categoryColor);
    // console.log(waypoints)
    trips.push({
      waypoints: waypointsAccumulator.waypoints,
      color: [...color, 255],
      foodGroup: category,
    });
  }
  return trips;
};

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then(({ flows }) => {
      const exampleFlow = flows[0];

      const multiLinestring = exampleFlow.geojson.coordinates;

      const exampleFlowPaths: Path[] = multiLinestring.map((lineString) => ({
        coordinates: lineString,
        ...getDistances(lineString),
      }));

      const theTrips = getPathTrips(
        exampleFlowPaths[0],
        {
          value: 100,
          valuesRatiosByFoodGroup: [0.2, 0.2, 0.2, 0.2, 0.2],
          routeGeometry: exampleFlow.geojson,
        },
        {
          numParticlesMultiplicator: 1,
          fromTimestamp: 0,
          toTimeStamp: 100,
          intervalHumanize: 0.5,
          speedKps: 100,
          speedKpsHumanize: 0.5,
          maxParticles: 500,
          colors: CATEGORIES_COLORS,
        },
        1
      );

      return {
        exampleFlow,
        trips: theTrips,
      };
    })
    .catch((error) => {
      console.error("Error fetching area flows", error);
      throw error;
    });

const AreaFlowsLayer = ({ areaId }: { areaId: string }) => {
  const { data, error, isLoading } = useSWR<AreaFlowsResponse>(
    `/api/areas/${areaId}/flows`,
    fetcher
  );
  const [currentTime, setCurrentTime] = useState(0);
  useAnimationFrame((e) => setCurrentTime(e.time));

  const loopLength = 100;
  const currentFrame = useMemo(() => {
    const animationSpeed = 1;
    const animationSpeedZoom = 1;
    const speed = animationSpeed * animationSpeedZoom;
    return (currentTime * speed) % loopLength;
  }, [currentTime]);

  if (!data?.trips) {
    return null;
  }

  if (isLoading || error) {
    return null;
  }

  const tripsLayer = new TripsLayer<DataType>({
    id: `trips`,
    data: data.trips,
    getPath: (d: DataType) => d.waypoints.map((p) => p.coordinates),
    getTimestamps: (d: DataType) => d.waypoints.map((p) => p.timestamp),
    getColor: [0, 0, 0],
    currentTime: currentFrame,
    trailLength: TRAIL_LENGTH,
    capRounded: true,
    jointRounded: true,
    fadeTrail: true,
    widthMinPixels: WIDTH_MIN_PIXELS,
  });

  return (
    <>
      <Source id="source_id" type="geojson" data={data.exampleFlow.geojson}>
        <Layer
          id="layer_id"
          type="line"
          source="source_id"
          paint={{
            "line-color": "red",
          }}
        />
      </Source>
      <DeckGLOverlay layers={[tripsLayer]} />
    </>
  );
};

export default AreaFlowsLayer;
