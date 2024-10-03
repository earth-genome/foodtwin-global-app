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
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggIZlicKxgUYAMZsA2gAYAuolAAHNLFxtcaFrJAAPRADYATET16AHAGYA7OZPmAnHp06JAVgA0IAJ6IAtAEYnB0x0fYwAWQNM9cwljPQBfWLdUTBw6EnJKGjpGZnYEAFtOOXy0AFcBPLRmSRkkEAUlFTUNbQQ9JxsiGydnGwkQ8x0QoJ83TwRfHyIHPR87YKCTMxD4xPQsPEI0iipaQmzWDgKiirKwUvFpDXrlVXValpD7IlN-CR8JSwjB1w9vdqn9LMZsYFsYlisQEl1qlSNtMnsmAcECUKAgDmAyNUroobk17rpJm89BYSf5LFZRogXh1uiDTKYJBIdN13ssEpC1ilNkdiiV2LgWFB9rkeSd2FjatdGndQC0vIFJgzejobMYnGCQZSECypk4Qn1zPr+k4rBCoVziNxeAgAGZgNjCAAWAqFEDUYCIAuoaAA1h7zRtLTw+HaHc7BQgvWhhJxpdUJfIcdLmogfEMOsYJKqLOZjD5zFquqYiCFjOYnD5iToy3rTGbOYGiFa+LsGIjcs2EMIhNwE3Uk7cUwgQnYSzZTD59NWfC9TGqteY051id0rGYJMTzPXko3O63hRxOwIhKI+1LB-iELZJk4nI4BvqGWZjFqQZMzHpnEtTOOQk5t9Cmx7lk7aHIUvLlJUYBngOeKyro5hEM4Hz9CYsw2JWehau8i6dPmLw6IuTgvJWAEWk2wbwm2ORgccpQCOcMENBe8HDnOnTRF0fjDMSL6-Ag7yqoYM7vHe7QWCqZG7pR+6gciqLopilySrBMpaN4AxEAMNiPHoNjlr0a6vkERAfjhlYfP4UmpHInAwAg6CcBA9BMbiaktG+SGMiqxi-p+M5akMiqDDoLwmnpd7mHW7IBjZdlgA5aBOS5Pg1ImzFwepAmfh0+ZvNWYIoWEWqEQY6rtNEt52L5cQxQ2cX2WKKiCgeCC2Y1pTisp6VuUO8qhVpWa2HOKp9FmWpVoYfT6uqUR6mCbLsiwaAQHAGixYQ2IZe53ghD4kxRPp44gr0+o2FqXjEhmQRqs4LL+C81mbLCGStltvWXiOUx7R8ERRfYf4jPx+06KZd5mKqeZtCO0WrDuqSip1zVQO9yaXvKpaGIEURZu0Qy5iEWo-qDGELKWRgYTMbJw4BQbWqGTouqjLFZWmTyGnOtb4+0WH8S8xhEO0wRXSEov2LVNPkcBm0qdtQ6blM+aToRAyBNEfFjCCEh4f4I5oWqNg6E9xDtQljkQMzmVyvSkwquWJj6KYot3iVURIYuej6rYpbGsbRCm7y-KCpbO3jC82uhRzc5zjOpbYfqRCzA4o1fvYXTxPEQA */
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
            actions: [{
              type: "action:parseUrl",
              params: ({ event }) => ({
                pathname: event.pathname,
              }),
            }, "action:parseAreaSection"],
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
      "action:parseAreaSection": assign(({ event }) => {
        assertEvent(event, "event:url:enter");
        switch (window.location.hash) {
          case "#food-transportation":
            console.log("#food-transportation")
            // show ports
            // show area outline
            // show target area outlines
            // show routes
            break;
          case "#impact":
            console.log("#impact")
            // show area outline
            // show target area with impact colours
            break;
          default:
            console.log("#food-produced")
            // show dotmap
            // show area mask
            // hide ports
            break;
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
