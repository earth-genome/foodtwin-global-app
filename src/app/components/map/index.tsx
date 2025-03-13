"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Map, {
  MapMouseEvent,
  MapRef,
  LngLatBoundsLike,
  Source,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import MapPopup from "@/app/components/map-popup";

import { MachineContext, MachineProvider } from "./state";
import EdgeLayer from "./layers/edges";
import Legend from "./legend";
import FoodGroupsLayer from "./layers/foodgroups";
import AreaLayers from "./layers/areas";
import PortsLayer from "./layers/ports";
import { AREA_SOURCE_ID, AREA_VIEW_BOUNDS_PADDING } from "./constants";
import DestinationAreasLayer from "./layers/destination-areas";
import { EItemType } from "@/types/components";

// Environment variables used in this component

const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const mapboxStyleUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;
const VECTOR_TILES_URL = process.env.NEXT_PUBLIC_VECTOR_TILES_URL;

export const worldViewState = {
  bounds: [
    [-170, -70],
    [170, 80],
  ],
} as {
  bounds: LngLatBoundsLike;
};

function loadIcons(map: mapboxgl.Map) {
  const icons = [
    { name: "port-icon", url: "/icons/port.png" },
    { name: "shipping_container-icon", url: "/icons/shipping_container.png" },
    { name: "producing_area-icon", url: "/icons/producing_area.png" },
  ];

  icons.forEach((icon) => {
    map.loadImage(icon.url, (error, image) => {
      if (error) throw error;
      if (map && image) {
        map.addImage(icon.name, image);
      }
    });
  });
}

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

  const handleZoomEnd = useCallback(() => {
    actorRef.send({
      type: "event:map:zoomend",
    });
  }, [actorRef]);

  useEffect(() => {
    actorRef.send({
      type: "event:page:mount",
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
          try {
            const [minLng, minLat, maxLng, maxLat] = JSON.parse(
              feature?.properties?.bbox
            );
            mapRef.current.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              { padding: AREA_VIEW_BOUNDS_PADDING }
            );
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Error parsing bbox", error);
          }

          router.push(`/area/${feature.properties.id}`);
        }
      }
    }
  }, []);

  return (
    <div className="w-full h-full relative flex-1">
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

          const map = mapRef.current?.getMap();

          if (!map) return;

          loadIcons(map);
        }}
        onMouseMove={eventHandlers.mousemove ? handleMouseMove : undefined}
        onMouseOut={eventHandlers.mousemove ? handleMouseOut : undefined}
        onZoomEnd={eventHandlers.zoomEnd ? handleZoomEnd : undefined}
        style={{ width: "100%", height: "100%", flex: 1 }}
        mapStyle={mapboxStyleUrl}
      >
        <Source
          id={AREA_SOURCE_ID}
          type="vector"
          tiles={[`${VECTOR_TILES_URL}/areas/{z}/{x}/{y}.pbf`]}
        ></Source>

        <FoodGroupsLayer />
        <EdgeLayer />
        <AreaLayers />
        <DestinationAreasLayer />
        <PortsLayer />

        {mapPopup && <MapPopup {...mapPopup} />}
        {currentArea && (
          <MapPopup
            id={currentArea.id}
            longitude={currentArea.centroid.coordinates[0]}
            latitude={currentArea.centroid.coordinates[1]}
            label={currentArea.name}
            itemType={EItemType.area}
            colorScheme="dark"
          />
        )}
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
