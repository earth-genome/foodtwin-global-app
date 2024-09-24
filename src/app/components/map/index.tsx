"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Map, {
  Layer,
  Source,
  MapRef,
  MapMouseEvent,
  MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import MapPopup from "@/app/components/map-popup";

import { MachineContext, MachineProvider } from "./state";
import { selectors } from "./state/selectors";
import EdgeLayer from "./layers/edges";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Colors
const SEA_BLUE = "rgb(173, 216, 230)";
const AREA_HIGHLIGHT_COLOR = "rgba(250, 250, 249, 0.7)";
const AREA_DEFAULT_COLOR = "rgba(250, 250, 249, 0.3)";
const AREA_HIGHLIGHT_OUTLINE_COLOR = "rgba(0, 0, 0, 1)";
const AREA_DEFAULT_OUTLINE_COLOR = "rgba(0, 0, 0, 0.3)";

function GlobeInner() {
  const router = useRouter();
  const params = useParams<{ areaId: string }>();
  const actorRef = MachineContext.useActorRef();
  const mapRef = useRef<MapRef>(null);

  // Selectors
  const pageIsMounting = MachineContext.useSelector((s) =>
    s.matches("page:mounting")
  );
  const mapIsMounting = MachineContext.useSelector((s) =>
    s.matches("map:mounting")
  );
  const pageUrl = MachineContext.useSelector(selectors.pageUrl);
  const mapBounds = MachineContext.useSelector(selectors.mapBounds);
  const eventHandlers = MachineContext.useSelector(
    (state) => state.context.eventHandlers
  );
  const mapPopup = MachineContext.useSelector(
    (state) => state.context.mapPopup
  );

  const handleMouseMove = useCallback((event: MapLayerMouseEvent) => {
    actorRef.send({
      type: "event:map:mousemove",
      mapEvent: event,
    });
  }, []);

  // On mount, pass route parameters to the machine
  useEffect(() => {
    actorRef.send({
      type: "event:page:mount",
      context: { areaId: params.areaId || null },
    });
  }, []);

  useEffect(() => {
    if (mapIsMounting && mapRef.current) {
      actorRef.send({
        type: "event:map:mount",
        mapRef: mapRef.current,
      });
    }
  }, [mapIsMounting, mapRef.current]);

  // Update the URL when necessary
  useEffect(() => {
    if (!pageIsMounting) {
      router.push(pageUrl);
    }
  }, [router, pageUrl, pageIsMounting]);

  const onClick = useCallback((event: MapMouseEvent) => {
    if (mapRef.current) {
      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: ["area-clickable-polygon"],
      });

      if (features.length > 0) {
        const feature = features[0];
        if (feature) {
          actorRef.send({
            type: "event:area:select",
            areaId: feature.properties.id,
          });
        }
      }
    }
  }, []);

  // Enable/disable map mousemove
  useEffect(() => {
    if (!mapRef.current) return;

    if (eventHandlers.mousemove) {
      mapRef.current.on("mousemove", handleMouseMove);
    } else {
      mapRef.current.off("mousemove", handleMouseMove);
    }
  }, [handleMouseMove, eventHandlers.mousemove, mapRef.current]);

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center">
      <div className="relative w-full h-full overflow-hidden">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 0,
            latitude: 0,
            zoom: 2,
          }}
          onClick={onClick}
          style={{ width: "100%", height: "100%" }}
        >
          <Source
            id="background"
            type="geojson"
            data={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [-180, -90],
                    [180, -90],
                    [180, 90],
                    [-180, 90],
                    [-180, -90],
                  ],
                ],
              },
            }}
          >
            <Layer
              id="background-layer"
              type="fill"
              paint={{
                "fill-color": SEA_BLUE,
              }}
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
              paint={{ "line-color": "#000", "line-width": 0.2 }}
            />
            <Layer
              id="area-clickable-polygon"
              type="fill"
              source-layer="default"
              paint={{
                "fill-color": [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  AREA_HIGHLIGHT_COLOR,
                  AREA_DEFAULT_COLOR,
                ],
                "fill-outline-color": [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  AREA_HIGHLIGHT_OUTLINE_COLOR,
                  AREA_DEFAULT_OUTLINE_COLOR,
                ],
              }}
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
