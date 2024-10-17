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
import { CircleLayerSpecification, FillLayerSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import MapPopup from "@/app/components/map-popup";

import { MachineContext, MachineProvider } from "./state";
import EdgeLayer from "./layers/edges";
import Legend from "./legend";
import { areaStyle, foodgroupsStyle } from "./cartography";

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
    <div className="flex flex-col w-full h-full relative">
      <Legend />
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
        style={{ width: "100%", height: "100%", flex: 1 }}
        mapStyle={mapboxStyleUrl}
      >
        <Source
          id="area-tiles"
          type="vector"
          tiles={[`${appUrl}/api/tiles/areas/{z}/{x}/{y}`]}
        >
          <Layer
            id="area-outline"
            type="line"
            source-layer="default"
            paint={{ "line-color": "#000", "line-width": 0.2 }}
          />
          <Layer
            id="area-clickable-polygon"
            type="fill"
            source-layer="default"
            paint={areaStyle as FillLayerSpecification["paint"]}
          />
        </Source>

        <Source
          id="foodgroups-source"
          type="vector"
          url="mapbox://devseed.dlel0qkq"
        >
          <Layer
            id="foodgroups-layer"
            type="circle"
            source-layer="foodgroup2max"
            paint={foodgroupsStyle as CircleLayerSpecification["paint"]}
          />
        </Source>

        <EdgeLayer />

        {mapPopup && <MapPopup {...mapPopup} />}
      </Map>
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
