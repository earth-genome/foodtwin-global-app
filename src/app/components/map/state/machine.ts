import { bbox } from "@turf/bbox";
import { assign, createMachine, assertEvent, fromPromise } from "xstate";
import { StateEvents } from "./types/events";
import { StateActions } from "./types/actions";
import { BBox } from "geojson";
import { MapRef } from "react-map-gl";
import { GeoJSONFeature } from "mapbox-gl";
import { IMapPopup } from "../../map-popup";
import { EItemType } from "@/types/components";
import { FetchAreaResponse } from "@/app/api/areas/[id]/route";
import { worldViewState } from "..";

export enum EViewType {
  world = "world",
  area = "area",
}

export enum EAreaViewType {
  production = "production",
  transportation = "transportation",
  impact = "impact",
}

interface StateContext {
  viewType: EViewType | null;
  mapRef: MapRef | null;
  highlightedArea: GeoJSONFeature | null;
  currentAreaId: string | null;
  currentArea: FetchAreaResponse | null;
  currentAreaFeature: GeoJSONFeature | null;
  currentAreaViewType: EAreaViewType | null;
  mapPopup: IMapPopup | null;
  mapBounds: BBox | null;
  eventHandlers: {
    mousemove: boolean;
  };
}

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggLYCGADl2gCusMJzTMA2gAYAuolC80sXG1xoW8kAA9EARgAcAZiIB2AGz7dUswE4ArHbOGATDYA0IAJ6I7zoobNfQwAWYJCnKRtnAF9oj1RMHDoSckoaOkZmdi4+AWEwITZpOSQQRWVVdU0dBEM7KSIbfTMTZ10bFydg-Q9vBAMG3RcpXWdXYOsnG1j49Cw8QhSKKlpCTNYOQQoEDbAyYs1ylTUNUpqAWkNDfSJ9ZzMpMYfnQyl9dy9Ec9siA11dEx2GxNe4GYIzEAJebJHj8MSCdi4FhQdbZWF5dgHUpHSqnUAXMy6OxEZzmO5SOqjRwfPrfaxEUI2N5Ah6AuwmCFQpKLbhkMDcBAAMzAbAAxgALJEoiDqMBEJHUNAAazlXIWxF5-KFIolUoQCrQou4uOKWIUSmOVTOehGfnq13ewTM3QBhl6iGcUhMDJMXoCvuBhiJnLm3OIvG4MAQ6G4EHoZrKFtx1S+HVMDl8vl0wXqQLs7oQ52cdl0DMcJmCYxMNhMrSGIcS6qIEajMbjEl0JXNFROKYQrUGLOLNlGjzuBfOBm9w0rL3+vruDehixbYGjaFj8ecXcTPat+JthhsRBaR5c12zBh6n0LLSI5bCXv+umdBiXYebkbX8MRyNRHFXDEilkQ4k17a1bwBRoHWzOp9AcIwJ2aYkbBaatuidd4onfJtNQFVYCB2dg9ileMQOxMD920RATBCX4X2LUYX18d4CzsUIGUMWs7DuDpHBfHDkjw9JCCItgSL-DsdxxcCD37bNGmzZ1UMiSx2QLf4zD8T0rkrKl7laQSeT5fC6DEiSUQkbdQL3PFqP7ex-BHRwc2zExs2cDTbAaat7CMIFmiJQwjI1EyRMI3gyDQCBBFFXF-wQLYUHM-ZyO7S07IuK4bjuZ57keV59HgtjK1+Iq-KkKRHB4jk4khUNcLCgiEEi6LYvipgNhyOEhBEMRJDS3cMr7YJq38f5gnsAEjHudiC30J17yql4Rw6LDpjqtUhKaszWpiuKTgS9F4REQoExkqiamcO573ch4LAmIqC1sMxGhHJ1mOuJ0Yk2hrtq1Zq2DIbgWFgRQyDYY1Ds67IkpS87KMyr5stufKngKt5ipvf4gUadjJpLQIRnZEKiGEwHgdB8HIY6rIOGO3rRHEMAEdsvsnhPdijxsJ0R0sExrz6IYvV+O72WBBbJdJ8mzKBkGwfIGnobp7q8lOwRgOkxGRseW6gzeWj7qJMwNLCY9XAHdp6ngmtpZ20TcE4CM4oSuHdlSrW2Ygy5rlRvLnkKmk9AsG4HD9MwnCMJwzDtgGzMd522CO3ITqZgbPeGiCXG9HmeYj5pugrE3sfsYli0qocHBCYLfsbf7TIdp3uBdmH6ZTxmzsGi6kf6LTFK41D3gW4sTA03KfU0lpTzGfRYjqlhorgTQtsIGzM7k759B89iw5eCkml0CcrEsJyunaFx6m6UnSGWcK1+Tb3RnN+5MKKp5RsF1M-AFiweMJIv-iz1rsuYgDMESqGRPfWS9k6TaSkKEV4PMAQGE8jec47ljztFGAXVCRJFzAI-MJYUYpJSQIol7OSVh4G3HYkMLeIRQikgLMEUsLR4LD0mmEZ07FSaATbFAy6XwnDfx3vUPeR5LATjCN6IEIxgQMVJE4XhX4gJSgET3OkwQTzWFrO0UIYRP6FmBFoz0WEQjVleBHWODdCLuzUeQ9e9ldEMjkd0fWmEg61ArEQeBrwqpFWeI8cEBDGpx1Entdq0Du59m+MSIMzhRqjQFmyGsbEDD3hmlpIMtZJpANmHXYyYTCJyyporKGVFomP1GD4l09wxiPArCwjSRJvRD1aCCBcdhrHhX1E3OK6iYlFV+KEL0AUFqPGBF5Z0jRQhYXeFpHMtVYhAA */
    id: "globeView",

    types: {
      context: {} as StateContext,
      events: {} as StateEvents,
      actions: {} as StateActions,
    },

    context: {
      viewType: EViewType.world,
      mapRef: null,
      highlightedArea: null,
      currentAreaId: null,
      currentArea: null,
      currentAreaFeature: null,
      currentAreaViewType: null,
      mapPopup: null,
      mapBounds: null,
      eventHandlers: {
        mousemove: true,
      },
    },

    states: {
      "world:view": {
        on: {
          "event:map:mousemove": {
            target: "world:view",
            actions: "action:setHighlightedArea",
          },

          "event:map:mouseout": {
            target: "world:view",
            actions: "action:clearHighlightedArea",
          },

          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },
        },

        entry: "action:enterWorldMapView",
      },

      "map:mounting": {
        on: {
          "event:map:mount": {
            target: "page:load",
            actions: "action:setMapRef",
            reenter: true,
          },
        },
      },

      "area:fetching": {
        invoke: {
          src: "actor:fetchArea",
          input: ({ context: { currentAreaId, currentArea } }) => ({
            areaId: currentAreaId,
            currentArea,
          }),
          onDone: {
            target: "area:view:entering",
            actions: ["action:setCurrentArea", "action:setAreaMapView"],
            reenter: true,
          },
        },
      },

      "page:load": {
        always: [
          {
            target: "world:view",
            guard: "guard:isWorldView",
          },
          {
            target: "area:view:entering",
            guard: "guard:isCurrentAreaLoaded",
          },
          {
            target: "area:fetching",
            reenter: true,
          },
        ],

        entry: {
          type: "action:parseUrl",
        },
      },

      "page:mounting": {
        on: {
          "event:page:mount": {
            target: "map:mounting",
            reenter: true,
          },
        },
      },

      "area:view:entering": {
        always: [
          {
            target: "area:view:production",
            guard: "guard:isAreaProductionView",
          },
          {
            target: "area:view:transportation",
            guard: "guard:isAreaTransportationView",
          },
          {
            target: "area:view:impact",
            reenter: true,
          },
        ],
      },

      "area:view:production": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },

          "event:map:mousemove": {
            target: "area:view:production",
            actions: "action:setHighlightedArea",
          },

          "event:map:mouseout": {
            target: "area:view:production",
            actions: "action:clearHighlightedArea",
          },
        },

        entry: "action:setProductionAreaView",
      },

      "area:view:transportation": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },

          "event:map:mousemove": {
            target: "area:view:transportation",
            actions: "action:setHighlightedArea",
          },

          "event:map:mouseout": {
            target: "area:view:transportation",
            actions: "action:clearHighlightedArea",
          },
        },

        entry: "action:setTransportationAreaView",
      },

      "area:view:impact": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },

          "event:map:mousemove": {
            target: "area:view:impact",
            actions: "action:setHighlightedArea",
          },

          "event:map:mouseout": {
            target: "area:view:impact",
            actions: "action:clearHighlightedArea",
          },
        },

        entry: "action:setImpactAreaView",
      },
    },

    initial: "page:mounting",
  },
  {
    actions: {
      "action:parseUrl": assign(() => {
        // Parse area view URLs
        const pathname = window.location.pathname;
        if (pathname.startsWith("/area/")) {
          const [, , areaId] = pathname.split("/");

          let areaViewType = null;

          if (pathname.includes("#transportation")) {
            areaViewType = EAreaViewType.transportation;
          } else if (pathname.includes("#impact")) {
            areaViewType = EAreaViewType.impact;
          } else {
            areaViewType = EAreaViewType.production;
          }

          return {
            viewType: EViewType.area,
            currentAreaId: areaId,
            currentAreaViewType: areaViewType,
          };
        }

        // default to world view
        return {
          viewType: EViewType.world,
        };
      }),

      "action:resetAreaHighlight": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        if (mapRef && currentArea) {
          const features = mapRef.querySourceFeatures("area-tiles", {
            filter: ["==", "id", currentArea.id],
            sourceLayer: "default",
          });

          for (let i = 0, len = features.length; i < len; i++) {
            const feature = features[i];
            if (feature.id) {
              mapRef.setFeatureState(
                {
                  source: "area-tiles",
                  sourceLayer: "default",
                  id: feature.id,
                },
                { selected: false }
              );
            }
          }
        }

        return {};
      }),
      "action:setMapRef": assign(({ event }) => {
        assertEvent(event, "event:map:mount");

        return {
          mapRef: event.mapRef,
        };
      }),
      "action:setHighlightedArea": assign(({ event, context }) => {
        assertEvent(event, "event:map:mousemove");

        const { highlightedArea, mapRef } = context;

        if (!mapRef) {
          return {};
        }

        if (highlightedArea) {
          mapRef.setFeatureState(highlightedArea, {
            hover: false,
          });
        }

        const features = mapRef.queryRenderedFeatures(event.mapEvent.point, {
          layers: ["ports-point", "area-clickable-polygon"],
        });

        const feature = features && features[0];

        let highlightArea = null;
        if (feature && feature.layer?.id === "area-clickable-polygon") {
          mapRef.setFeatureState(feature, { hover: true });
          highlightArea = feature;
        }

        const layerToIconTypeMap: Record<string, EItemType> = {
          "ports-point": EItemType.node,
          "area-clickable-polygon": EItemType.area,
        };

        const itemType = feature?.layer?.id
          ? layerToIconTypeMap[feature.layer.id]
          : undefined;

        return {
          highlightedArea: highlightArea,
          mapPopup: feature?.properties
            ? {
                id: feature.properties.id,
                label: feature.properties.name,
                itemType: itemType || EItemType.area,
                longitude: event.mapEvent.lngLat.lng,
                latitude: event.mapEvent.lngLat.lat,
              }
            : null,
        };
      }),
      "action:clearHighlightedArea": assign(({ event, context }) => {
        assertEvent(event, "event:map:mouseout");

        const { highlightedArea, mapRef } = context;

        if (!mapRef) {
          return {};
        }

        if (highlightedArea) {
          mapRef.setFeatureState(highlightedArea, {
            hover: false,
          });
        }

        return {
          highlightedArea: null,
          mapPopup: null,
        };
      }),
      "action:setCurrentArea": assign(({ event, context }) => {
        assertEvent(event, "xstate.done.actor.0.globeView.area:fetching");
        const { mapRef, currentAreaFeature } = context;

        // Reset the previous selected area, if any
        if (currentAreaFeature?.id) {
          mapRef?.setFeatureState(
            {
              source: "area-tiles",
              sourceLayer: "default",
              id: currentAreaFeature.id,
            },
            { selected: false }
          );
        }

        const features = mapRef?.querySourceFeatures("area-tiles", {
          filter: ["==", "id", event.output.id],
          sourceLayer: "default",
        });
        const feature = features && features[0];
        if (feature && feature.id) {
          mapRef?.setFeatureState(
            {
              source: "area-tiles",
              sourceLayer: "default",
              id: feature.id,
            },
            { selected: true }
          );
        }

        return {
          currentArea: event.output,
          currentAreaFeature: feature,
        };
      }),
      "action:setProductionAreaView": assign(({ context }) => {
        const { mapRef } = context;

        if (mapRef) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "visible");
        }

        return {};
      }),

      "action:setTransportationAreaView": assign(({ context }) => {
        const { mapRef } = context;

        if (mapRef) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "none");
        }

        return {};
      }),
      "action:setImpactAreaView": assign(({ context }) => {
        const { mapRef } = context;

        if (mapRef) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "none");
        }

        return {};
      }),
      "action:setAreaMapView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        if (!mapRef || !currentArea || !currentArea.boundingBox) {
          return {};
        }

        mapRef.resize();

        const bounds = bbox(currentArea.boundingBox);

        mapRef.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          {
            padding: {
              top: 100,
              left: 100,
              bottom: 100,
              right: 100,
            },
          }
        );

        return {
          mapBounds: bounds,
        };
      }),
      "action:enterWorldMapView": assign(({ context }) => {
        const { mapRef, currentAreaFeature } = context;

        if (mapRef) {
          if (currentAreaFeature?.id) {
            mapRef.setFeatureState(
              {
                source: "area-tiles",
                sourceLayer: "default",
                id: currentAreaFeature.id,
              },
              { selected: false }
            );
          }

          mapRef.resize();
          mapRef.fitBounds(worldViewState.bounds);
        }

        return {
          currentAreaId: null,
          currentArea: null,
          currentAreaFeature: null,
        };
      }),
      "action:area:clear": assign({
        currentAreaId: null,
        currentArea: null,
      }),
    },
    guards: {
      "guard:isWorldView": ({ context }) => {
        return context.viewType === EViewType.world;
      },
      "guard:isAreaProductionView": () => {
        return window.location.hash === `#${EAreaViewType.production}`;
      },
      "guard:isAreaTransportationView": () => {
        return window.location.hash === `#${EAreaViewType.transportation}`;
      },
      "guard:isAreaImpactView": () => {
        return window.location.hash === `#${EAreaViewType.impact}`;
      },
      "guard:isCurrentAreaLoaded": ({ context }) => {
        return context.currentArea?.id === context.currentAreaId;
      },
    },
    actors: {
      "actor:fetchArea": fromPromise<
        FetchAreaResponse,
        { areaId: string; currentArea: FetchAreaResponse }
      >(async ({ input }) => {
        const { areaId, currentArea } = input;
        if (areaId === currentArea?.id) {
          return currentArea;
        }
        const response = await fetch(`/api/areas/${input.areaId}`);
        return await response.json();
      }),
    },
  }
);
