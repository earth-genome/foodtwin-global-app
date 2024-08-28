"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { MachineContext, MachineProvider } from "./state";
import { selectors } from "./state/selectors";
import Map, {
  Layer,
  Source,
  MapRef,
  MapMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

function GlobeInner() {
  const router = useRouter();
  const params = useParams<{ areaId: string }>();
  const actorRef = MachineContext.useActorRef();
  const mapRef = useRef<MapRef>(null);

  // Selectors
  const pageIsMounting = MachineContext.useSelector((state) =>
    state.matches("Page is mounting")
  );
  const pageUrl = MachineContext.useSelector(selectors.pageUrl);

  // On mount, pass route parameters to the machine
  useEffect(() => {
    actorRef.send({
      type: "Page has mounted",
      context: { areaId: params.areaId || null },
    });
  }, []);

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
        if (feature?.properties?.id) {
          router.push(`/area/${feature.properties.id}`);
        }
      }
    }
  }, []);

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
                "fill-color": "rgb(173, 216, 230)", // Sea blue color
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
                "fill-color": "rgba(211, 211, 211, 0.3)", // Transparent blue
              }}
            />
          </Source>

          <Source
            id="edges-tiles"
            type="vector"
            tiles={[`${appUrl}/api/tiles/edges/{z}/{x}/{y}`]}
          >
            <Layer
              id="edge-line"
              type="line"
              source-layer="default"
              paint={{
                "line-color": "green",
                "line-width": 2,
              }}
            />
          </Source>

          <Source
            id="nodes-tiles"
            type="vector"
            tiles={[`${appUrl}/api/tiles/nodes/{z}/{x}/{y}`]}
          >
            <Layer
              id="node-point"
              type="circle"
              source-layer="default"
              paint={{
                "circle-color": "red",
                "circle-radius": 2,
              }}
            />
          </Source>
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
