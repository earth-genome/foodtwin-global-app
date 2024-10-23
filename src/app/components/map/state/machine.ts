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
  currentAreaViewType: EAreaViewType | null;
  mapPopup: IMapPopup | null;
  mapBounds: BBox | null;
  eventHandlers: {
    mousemove: boolean;
  };
}

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggLYCGADl2gCusMJzTMA2gAYAuolC80sXG1xoW8kAA9EAWgBMAdgDMRACwAOfVLMBWfRdvH9ATlu2ANCACeiMwDYif2MpAEYpEKczY399AF84r1RMHDoSckoaOkZmdi4+AWEwITZpOSQQRWVVdU0dBEMpIikXYzdbM0aza0N9L18EAKCQ8MjjaNiEpPQsPEJ0iipaQhzWDkEKBDWwMjLNKpU1DQr63WNjCyIrfyl9fRv9EIsXfr1-FyJQi1DQw1sXFzXL5mKYgZKzNI8fhiQTsXAsKCrPJQwrsPYVA41Y6gU7+UK2IhGfxWCK2UL6WzvV4IXQ3QJmMwuKSOFw3P62Qyg8GpebcMhgbgIABmYDYAGMABbwxEQdRgIjw6hoADW8u5c2IfIFwtFkulCEVaDF3CxZXRCiUh1qJ0Q4XJRFsEQszNu52pFMCtgslisgP8hhuMS5Mx5xF43BgCHQ3Ag9HNlUtWLqelaRHZ9nsoTsUn+nh8egpoXMlMM3SMLkMvVCxmDKQ1RHDkejsYkoXKFuqR2TCGCBOZz16LjMoSZAepBjJxf9ZcMFarNcSYJD9cbYCjaBjcf07YTnetONtEQ+-razguWa+FnH-od05Chh+oX8w4stYh81XqNUCKRHE-MLRWR9kTLsbRpPFDCIVoLG+aIvXcCxjHHCx-AJVlKyHb1iQBeJF3VNItUFZYCC2dgdmlOMgIxED920RAzwdANzhLRkHHual7ECGCOQfYx3BcEcQTw5cCP5Ii6FIthyJ-Vsd0xUCDwQVx6QibMBKHexqWnT4UI6J8rHsTlhLrUTtWIyTpMRCRt2AvdsTohBjADK5nRiTpq3uVlqWdJoAgCckUOcbpbDfUMiEIrJCAQXgyDQCBBDFLFfwQDYUAs3YqI7K17NOTygnQtw8VQow+nzBB7CaYJnizP5zgBUJQvrCLzLYMhuBYWBFDINgTSOZLUvS+N5No3L3ny-1CqfQzSoGfwb1aCszGZVldIa4z301MTIpI3BOHDRL+s2bYMrkmicoLMb3gmykppK6lZzMQlfneAS-lcZ4EkXFg4rgTR8MIWzsu7WlnTTDp3FdI9vnHcJviINpYliHMbgsIzphM+ZSEWbbAaTMDdHJD47mfYkYOJzorzK3QXH0NMUMcFDfn8r5GshAoAO-KBcYUhzaVuQkbGiFphwfKxxwfD4RwC59WXxKxWd5LaRXFKUEW5kbDxsK49IuVSGSMalhyCQwGe6RkJjsIT0Y2hsIzXZt1fO8DnDBuxHUeKHQnHaJIP+MJ6tiIkF2tsL-yEOE1eouzgZuR66UrQSGQuccAUe6xnlaTpWikOaFc2syJOO6VHe7YlAnODyyVcf5GQ4-RHqc2HwkrcZiTz8KtvMmK4oSvGsr73nUPh8lOk6E32QrDivgdRD7keX5S0Bdvmok1r2s68geoH4and0SsoIEgJ3kaSspAiLSh5gtp02ecY1pDprO4k3b9rYEv8cZKC7keNxvScpi8wDFnKYQSdw+JhDCL8T6cQgA */
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

        entry: "action:setWorldMapView",
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
          params: ({ event }) => ({
            pathname: event.pathname,
          }),
        },
      },

      "page:mounting": {
        on: {
          "event:page:mount": {
            target: "map:mounting",
            reenter: true,
            actions: [
              {
                type: "action:parseUrl",
                params: ({ event }) => ({
                  pathname: event.pathname,
                }),
              },
            ],
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
        },

        entry: "action:setProductionAreaView",
      },

      "area:view:transportation": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
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
        },

        entry: "action:setImpactAreaView",
      },
    },

    initial: "page:mounting",
  },
  {
    actions: {
      "action:parseUrl": assign((_, params: { pathname: string }) => {
        // Parse area view URLs
        if (params?.pathname?.startsWith("/area/")) {
          const [, , areaId] = params.pathname.split("/");

          let areaViewType = null;

          if (params.pathname.includes("#food-transportation")) {
            areaViewType = EAreaViewType.transportation;
          } else if (params.pathname.includes("#impact")) {
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
          currentAreaId: null,
          currentArea: null,
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
        const { mapRef } = context;

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
        };
      }),
      "action:setProductionAreaView": assign(({ context }) => {
        console.log("action:setProductionAreaView");

        // apply map effects for production view

        return {};
      }),
      "action:setTransportationAreaView": assign(({ context }) => {
        console.log("action:setTransportationAreaView");

        // apply map effects for transportation view

        return {};
      }),
      "action:setImpactAreaView": assign(({ context }) => {
        console.log("action:setImpactAreaView");

        // apply map effects for impact view

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
      "action:setWorldMapView": assign(({ context }) => {
        const { mapRef } = context;

        if (!mapRef) {
          return {};
        }

        mapRef.resize();

        mapRef.fitBounds(worldViewState.bounds);

        return {};
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
      "guard:isAreaProductionView": ({ context }) => {
        return window.location.hash === '#production';
      },
      "guard:isAreaTransportationView": ({ context }) => {
        return window.location.hash === '#transportation';
      },
      "guard:isAreaImpactView": ({ context }) => {
        return window.location.hash === '#impact';
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
