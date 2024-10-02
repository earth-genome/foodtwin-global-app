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

interface StateContext {
  viewType: EViewType | null;
  mapRef: MapRef | null;
  highlightedArea: GeoJSONFeature | null;
  currentAreaId: string | null;
  currentArea: FetchAreaResponse | null;
  mapPopup: IMapPopup | null;
  mapBounds: BBox | null;
  eventHandlers: {
    mousemove: boolean;
  };
}

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggIZlicKxgUYAMZsA2gAYAuolAAHNLFxtcaFrJAAPRADYATET16AHAGYA7OZPmAnHp06JAVgA0IAJ6IAtAEYnB0x0fYwAWQNM9cwljPQBfWLdUTBw6EnJKGjpGZnYEAFtOOXy0AFcBPLRmSRkkEAUlFTUNbQQ9JxsiGydnGwkQ8x0QoJ83TwRfHyIHPR87YKCTMxD4xPQsPEI0iipaQmzWDhKKBAOwMmqNeuVVdVqWoKIJHz0LV-9LK1HEU3aibuMdKZTBIJDpuj4+isQEl1qkCkUKiV2LgWFB9rl4cUkeJpJdFNcmndvIFJsDejobMYnMYaTovghwVMnCE+uYWf0nFYoTCUptuLwEAAzMBsYQACxRaIgajARBR1DQAGtZTyNsR+XxhaKJaiEPK0MJOI0WNULrUrsbmogfEMOsYJJSLOZjD5zPSuqYiCFjOYnM9Aj7maZuWteeqeHxdgwmAcuBGEMIhNwzfJ8ZaiQggp7HBCnE7zLM-PSBhJDOZTD5whZIj4fCHkmqiBrMnsY7lmwIhKIU3U0zcrQhbJMnE5HAMWcCzMZ6QDJmY9M4lqYbKYQk567C+fGo+iOJjEeVKmAexb+xnIh1Kw6Kf4bcY7PSIRYiK6qWD2vfOeYN2Gm9usm2hzHKc5y4uafaEqALReAMRADDYIRGDYvq9FY04eIgs5EPOEIFguvpxAk0Kho2cicDACDoJwED0CeEG3FBmEPCCoKUiuiFPKY9JDKSgyAiOVhdDo5Y-qR5FgJRaDUbRPg1KmDRnoxCDPA6L5RD4Og0vabJhPSwkGNS7TRCOdj3oRqwNqkZEUYiyKoruCDWRJtk4nJvYKZBWjEoCcEOrYpgAr0LI2PSLw6IYfQstSUTMjSyxQiwaAQHAGiqnQeIeQxXnjCEta+chK6BX0Dr0l4LwdMyNi1ghyEOKCwZEWlmykNsLYEBlBJZS0IQdIMuEROW9hriMGHKRp2GjmYlIum0PUNRZm7EPupR2VAHXpkpXirsYhiBFEDrtEMzohPSy7hVVCzekhzw2qJqTNlq4qSutinZTa9hwWEVJhEd7R6Kd1J-FVMTLiEYP2OZxGWVuApRi9nktC85hTK6GnCQMgTROhYwAqWVX+D1JjBO0Oh3ZsTmSdR8NdcSFZTMh-gAi8YOjnpUSPHhLK2N6HJk8QFMuc94GZQOW3dFMFhhAFAWVt6j4si+NgOBSILUvYXTxPEQA */
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
      mapPopup: null,
      mapBounds: null,
      eventHandlers: {
        mousemove: true,
      },
    },

    states: {
      "world:view": {
        on: {
          "event:area:select": {
            target: "area:fetching",
            actions: "action:setCurrentAreaId",
            reenter: true,
          },

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
          input: ({ context: { currentAreaId } }) => ({
            areaId: currentAreaId,
          }),
          onDone: {
            target: "area:view",
            actions: "action:setCurrentArea",
          },
        },
      },

      "area:view": {
        on: {
          "event:area:clear": {
            target: "world:view",
            actions: "action:area:clear",
            reenter: true,
          },

          "event:area:select": {
            target: "area:fetching",
            reenter: true,
            actions: "action:setCurrentAreaId",
          },

          "event:map:mousemove": {
            target: "area:view",
            actions: "action:setHighlightedArea",
          },

          "event:map:mouseout": {
            target: "area:view",
            actions: "action:clearHighlightedArea",
          },

          "event:url:enter": {
            target: "page:load",
            reenter: true,
            actions: {
              type: "action:parseUrl",
              params: ({ event }) => ({
                pathname: event.pathname,
              }),
            },
          },
        },

        entry: "action:setAreaMapView",
      },

      "page:load": {
        always: [
          {
            target: "world:view",
            guard: "guard:isWorldView",
          },
          {
            target: "area:fetching",
            reenter: true,
          },
        ],
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
    },

    initial: "page:mounting",
  },
  {
    actions: {
      "action:parseUrl": assign((_, params: { pathname: string }) => {
        if (params.pathname.startsWith("/area/")) {
          const [, , areaId] = params.pathname.split("/");

          return {
            viewType: EViewType.area,
            currentAreaId: areaId,
            currentArea: null,
          };
        }

        // default to world view
        return {
          viewType: EViewType.world,
          currentAreaId: null,
          currentArea: null,
        };
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
          layers: ["area-clickable-polygon"],
        });

        const feature = features && features[0];

        if (feature) {
          mapRef.setFeatureState(feature, { hover: true });
        }

        return {
          highlightedArea: feature || null,
          mapPopup: feature?.properties
            ? {
                id: feature.properties.id,
                label: feature.properties.name,
                itemType: EItemType.area,
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
      "action:setCurrentArea": assign(({ event }) => {
        assertEvent(event, "xstate.done.actor.0.globeView.area:fetching");

        return {
          currentArea: event.output,
        };
      }),
      "action:setAreaMapView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        if (!mapRef || !currentArea || !currentArea.boundingBox) {
          return {};
        }

        const bounds = bbox(currentArea.boundingBox);

        mapRef.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          {
            padding: 100,
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

        mapRef.fitBounds(worldViewState.bounds);

        return {};
      }),
      "action:setCurrentAreaId": assign(({ event }) => {
        assertEvent(event, "event:area:select");
        return {
          currentAreaId: event.areaId,
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
    },
    actors: {
      "actor:fetchArea": fromPromise<FetchAreaResponse, { areaId: string }>(
        async ({ input }) => {
          const response = await fetch(`/api/areas/${input.areaId}`);
          return await response.json();
        }
      ),
    },
  }
);
