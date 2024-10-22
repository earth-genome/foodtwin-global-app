"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Map, { MapMouseEvent, MapRef, LngLatBoundsLike } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import MapPopup from "@/app/components/map-popup";

import { MachineContext, MachineProvider } from "./state";
import EdgeLayer from "./layers/edges";
import Legend from "./legend";
import FoodGroupsLayer from "./layers/foodgroups";
import AreaLayer from "./layers/area";

// Environment variables used in this component

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
  const params = useParams();
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
  const areaSelected = MachineContext.useSelector(
    (state) => !!state.context.currentArea
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
  }, [pageIsMounting, mapIsMounting, pathname, params]);

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
        <AreaLayer areaSelected={areaSelected} />
        <FoodGroupsLayer />
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
