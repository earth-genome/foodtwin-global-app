"use client";
import React, { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Map, {
  Layer,
  Source,
  MapRef,
  MapMouseEvent,
  MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { LngLat } from "react-map-gl";

import { EItemType } from "@/types/components";
import MapPopup from "@/app/components/map-popup";
import { ProductionArea } from "@/types/data";

import { MachineContext, MachineProvider } from "./state";
import { selectors } from "./state/selectors";
import { Feature, Polygon } from "geojson";
import EdgeLayer from "./layers/edges";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

interface IHighlightArea extends Feature<Polygon, ProductionArea> {
  popupLocation: LngLat;
}

function GlobeInner() {
  const router = useRouter();
  const params = useParams<{ areaId: string }>();
  const actorRef = MachineContext.useActorRef();
  const mapRef = useRef<MapRef>(null);
  const [highlightArea, setHighlightArea] = useState<IHighlightArea>();

  // Selectors
  const pageIsMounting = MachineContext.useSelector((state) =>
    state.matches("Page is mounting")
  );
  const pageUrl = MachineContext.useSelector(selectors.pageUrl);
  const mapBounds = MachineContext.useSelector(selectors.mapBounds);

  // On mount, pass route parameters to the machine
  useEffect(() => {
    actorRef.send({
      type: "event:page:mounted",
      context: { areaId: params.areaId || null },
    });
  }, []);

  // Update the URL when necessary
  useEffect(() => {
    if (!pageIsMounting) {
      router.push(pageUrl);
    }
  }, [router, pageUrl, pageIsMounting]);

  useEffect(() => {
    if (mapRef.current && mapBounds) {
      const [x1, y1, x2, z2] = mapBounds;
      mapRef.current.fitBounds([x1, y1, x2, z2], {
        padding: 200,
        duration: 500,
      });
    }
  }, [mapBounds]);

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
            area: {
              type: "Feature",
              geometry: feature.geometry,
              properties: {
                id: feature.properties.id,
                name: feature.properties.name,
              },
            },
          });
        }
      }
    }
  }, []);

  const onMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!mapRef.current) return;
      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: ["area-clickable-polygon"],
      });

      const interactiveItem = features && features[0];
      if (interactiveItem) {
        setHighlightArea({
          ...interactiveItem.toJSON(),
          popupLocation: event.lngLat,
        } as IHighlightArea);
      } else {
        setHighlightArea(undefined);
      }
    },
    [setHighlightArea]
  );

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
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHighlightArea(undefined)}
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
                "fill-color": "rgba(250, 250, 249, 0.3)", // Transparent blue
              }}
            />
            {highlightArea?.properties?.id && (
              <Layer
                id="area-highlighted-polygon"
                type="fill"
                source-layer="default"
                filter={["==", ["get", "id"], highlightArea.properties.id]}
                paint={{
                  "fill-color": "rgba(250, 250, 249, 0.7)", // Highlighted color
                  "fill-outline-color": "rgba(0, 0, 0, 1)",
                }}
              />
            )}
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
                "circle-radius": 0.5,
              }}
            />
          </Source>

          <EdgeLayer />

          {highlightArea && (
            <MapPopup
              id={highlightArea.properties.id}
              itemType={EItemType.area}
              label={highlightArea.properties.name}
              longitude={highlightArea.popupLocation.lng}
              latitude={highlightArea.popupLocation.lat}
            />
          )}
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
