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
import Legend from "./legend";
import FoodGroupsLayer from "./layers/foodgroups";
import AreaLayers from "./layers/areas";
import { AREA_SOURCE_ID } from "./constants";
import { EItemType } from "@/types/components";
import ParticlesLayer from "./layers/particles";

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

  // Handle container resize when side panel opens/closes
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        // Trigger map resize to ensure proper viewport calculations
        mapRef.current.resize();
      }
    };

    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(handleResize);

    if (mapRef.current) {
      const mapContainer = mapRef.current.getContainer();
      if (mapContainer) {
        resizeObserver.observe(mapContainer);
      }
    }

    // Also listen for window resize as fallback
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [mapRef.current]);

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
    <div className="w-full h-full relative flex-1 z-10">
      <Legend />
      <Map
        mapboxAccessToken={mapboxAccessToken}
        ref={mapRef}
        initialViewState={worldViewState}
        minZoom={1.5} // to avoid duplicate continents
        maxZoom={8} // to avoid overzoom
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
        <AreaLayers />
        {currentArea && <ParticlesLayer areaId={currentArea.id} />}

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
