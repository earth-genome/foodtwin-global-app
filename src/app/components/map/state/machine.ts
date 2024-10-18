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
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggLYCGADl2gCusMJzTMA2gAYAuolC80sXG1xoW8kAA9EAFgDsAJiIBOXVICM+gMwAOKSf1nd1gDQgAnogC0h3UVsAVl0TKSlAizMANkMLKKiAXwT3VEwcOhJySho6RmZ2Lj4BYTAhNmk5JBBFZVV1TR0EKN0LIil9dqj2m0NmwPcvBG8LSyJAsJs7QMMnYJMklPQsPEJMiipaQjzWDkEKBB2wMgrNGpU1DSrGqNbLQ2sbG2n9F8MBxGtAkzGpWyjraxhKLjEa6BYgVLLDI8fhiQTsXAsKDbAow4rsE5VM51S6gRreaw3IiA0JRExBWyUqLvBAgojA8wGRn6QJGcGQ9KrbhkMDcBAAMzAbAAxgALRHIiDqMBERHUNAAaxlHJWxG5vIFQrFEoQcrQwu4OIqmIUSnO9SuiAsujJAQctge+lsVhpJkC1iIulsLIs9yi3uC1nZS05ap5fM2DCYOwQ6r5wpQvOOslOZpxDUQNw9XRG7pe+kiFn6nkQ+i6RBm1gshIBRgLFmDaVVRDjOS20dRRThIjEkhTWLTFwzCFznrsvQsFkpRcCQRpoP0xNZ8VnhhMhnCYOSEJDzdbkZRHDR3dKgnK-dNtSHloQLKkASzJnXcUnJmpJZHUgMS7LwNsa43YJGyhLlwzbKN8l2fZDmTSpL3NXFtB8MsiDLMxDDXFlQiMWwaT+VoHVidpfXaaZgNDIheG4GAEHQbgIHoE1qkHC08UQfC2iBckTGsXQN2rGkbVaQkbU+Vk10CKIbHI5sqJouiGIkCw4OYq9WKQkcN2+KxLH9Sl2l0FwaSk4xZy+X5Ai+QxbHXGSMjksB0VUJFDwQBynKY7FrzYoYa1QhwnDsMkvwcGk-QrL9zFnDpgkpLdtxYNAIDgTQVToVM1MQ-EWlaDpHB4v5QnMEwaWGGzOPaAEghmN1Ajs1ZSHWcCMoQ4cQnpFpKsrXpdAiec4gCSSHXJZ1DDmINtzS1ZjyEBEkRa9MbwJL0K0JDoHC+G0nV0GlrDfUwXz8f8119a16rDDVBRFcV5oHTLh2tXpUJcIIXC2qzdtnMYTCne5nD4mJzpbMDIwW7yNPuRcbgLeIXn+LpKTw8sfumEJrKnL5Ekm3d7OoxyFLB9T8QBVoyRZayYl43r30GKT72Ivx2jMWwDDq7Gm1xmi4TmqBCaynxPnvf59BcOw7GrL153MIhIniYLwn-Mk2aSIA */
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
            actions: [
              {
                type: "action:resetAreaHighlight",
              },
              {
                type: "action:parseUrl",
                params: ({ event }) => ({
                  pathname: event.pathname,
                }),
              },
            ],
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
