"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Map, {
  Layer,
  Source,
  MapMouseEvent,
  MapRef,
  LngLatBoundsLike,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mask from "@turf/mask";
import { MultiPolygon } from "geojson";

import MapPopup from "@/app/components/map-popup";

import { MachineContext, MachineProvider } from "./state";
import EdgeLayer from "./layers/edges";
import {
  areaMaskOutlineStyle,
  areaMaskStyle,
  areaStyle,
  foodgroupsStyle,
  lineStyle,
} from "./cartography";

// Environment variables used in this component
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const mapboxStyleUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;

export const worldViewState = {
  bounds: [
    [-170, -70],
    [170, 80],
  ],
} as {
  bounds: LngLatBoundsLike;
};

function GlobeInner() {
  const router = useRouter();
  const pathname = usePathname();
  const actorRef = MachineContext.useActorRef();
  const mapRef = useRef<MapRef>(null);

  // Selectors
  const pageIsMounting = MachineContext.useSelector((s) =>
    s.matches("page:mounting")
  );
  const mapIsMounting = MachineContext.useSelector((s) =>
    s.matches("map:mounting")
  );
  const eventHandlers = MachineContext.useSelector(
    (state) => state.context.eventHandlers
  );
  const mapPopup = MachineContext.useSelector(
    (state) => state.context.mapPopup
  );
  const currentArea = MachineContext.useSelector(
    (state) => state.context.currentArea
  );

  const handleMouseMove = useCallback((event: MapMouseEvent) => {
    actorRef.send({
      type: "event:map:mousemove",
      mapEvent: event,
    });
  }, []);

  const handleMouseOut = useCallback(() => {
    actorRef.send({
      type: "event:map:mouseout",
    });
  }, [actorRef]);

  useEffect(() => {
    actorRef.send({
      type: "event:page:mount",
      pathname,
    });
  }, []);

  // Observe URL changes
  useEffect(() => {
    if (pageIsMounting || mapIsMounting) return;

    actorRef.send({
      type: "event:url:enter",
      pathname,
    });
  }, [pageIsMounting, mapIsMounting, pathname]);

  const onClick = useCallback((event: MapMouseEvent) => {
    if (mapRef.current) {
      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: ["area-clickable-polygon"],
      });

      if (features.length > 0) {
        const feature = features[0];
        if (feature?.properties) {
          router.push(`/area/${feature.properties.id}`);
        }
      }
    }
  }, []);

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center">
      <div className="relative w-full h-full overflow-hidden">
        <Map
          mapboxAccessToken={mapboxAccessToken}
          ref={mapRef}
          initialViewState={worldViewState}
          onClick={onClick}
          onLoad={() => {
            actorRef.send({
              type: "event:map:mount",
              mapRef: mapRef.current as MapRef,
            });
          }}
          onMouseMove={eventHandlers.mousemove ? handleMouseMove : undefined}
          onMouseOut={eventHandlers.mousemove ? handleMouseOut : undefined}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapboxStyleUrl}
        >
          {currentArea && (
            <Source
              id="highlight-mask"
              type="geojson"
              data={mask(currentArea.geometry as MultiPolygon)}
            >
              <Layer id="highlight-layer" type="fill" paint={areaMaskStyle} />
              <Layer
                id="highlight-layer-outline"
                type="line"
                paint={areaMaskOutlineStyle}
              />
            </Source>
          )}

          <Source
            id="foodgroups-source"
            type="vector"
            url="mapbox://devseed.dlel0qkq"
          >
            <Layer
              id="foodgroups-layer"
              type="circle"
              source-layer="foodgroup2max"
              paint={foodgroupsStyle}
            />
          </Source>

          <Source
            id="area-tiles"
            type="vector"
            tiles={[`${appUrl}/api/tiles/areas/{z}/{x}/{y}`]}
          >
            <Layer
              id="area-outline"
              type="line"
              source-layer="default"
              paint={lineStyle}
            />
            <Layer
              id="area-clickable-polygon"
              type="fill"
              source-layer="default"
              paint={areaStyle}
            />
          </Source>

          <EdgeLayer />

          {mapPopup && <MapPopup {...mapPopup} />}
        </Map>
      </div>
    </div>
  );
}

export default function Globe() {
  return (
    <MachineProvider>
      <GlobeInner />
    </MachineProvider>
  );
}
