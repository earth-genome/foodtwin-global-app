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
import { combineBboxes } from "@/utils/geometries";

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
  eventHandlers: {
    mousemove: boolean;
  };
}

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggLYCGADl2gCusMJzTMA2gAYAuolC80sXG1xoW8kAA9EAWgBMAdgDMRACwAOfVLMBWfRdvH9ATlu2ANCACeiMwDYif2MpAEYpEKczY399AF84r1RMHDoSckoaOkZmdi4+AWEwITZpOSQQRWVVdU0dBDMpfSJbE1DjGKMXCykLMy9fBH1QlxbbEb6m7uNQ-X8EpPQsPEJ0iipaQhzWDkEKBB2wMjLNKpU1DQr63Q6LIit-JrmmkIsXAb1-UdCLUNDDWwubpzH5mBYgZLLNI8fhiQTsXAsKDbPIwwrsE4VM41S6ga7+UK2IhGfxWCLjfS2L4fBC6R6BMxmFy9QGPAGtcGQ1KrbhkMDcBAAMzAbAAxgALRHIiDqMBERHUNAAazlXJWxF5-KFIolUoQCrQou4OLKmIUSnOtSuiHCsxaER6PX0HRplMCtj6Fis3X8hkeMU5S25xF43BgCHQ3Ag9DNlQtOLqehcpnZ9nsoTsUkBnh8ekpoXMVMMZn0XUMhmGxkDKXVRFD4cj0YkoXK5uqF0TCGCRN6bwrLjMIykfppBnGhd9JbLFfa1ahq3rYAjaCjMf0rbj7ateJtEVGvuMyedv0HXtHvpak5Chj+oX8p7nwbrYaXcIRSJRHEX6NKslO8Y7a1aQJQwiGTL0M2MD13AsYxRwsfwiRcX1DAHPpSSBeJEghINa01AVNgIA52COKUYz-LEAO3bREGcUxWmCKDJxcBw5hpexAi9VobygwERjBbC1TSfCskIYi2FIj9mw3bFAJ3IZkPMCJMxcfj7BpSciB+RDB1JSkjEfPC+QIuhxMk5EJHXf8t1xGiEGMP17h6GIzB4uZkJpHopHMe8CQcYJ9BLWxDOE4zRKI3gyDQCBBFFHFPwQPYUDM44KLbS1bOudygmQ1CqTvewK3Y6wgmMN4MwBDogVCEKeTCwiEEi6LYvipgdgQETRRQflUpkqjMsQKQaSkWqNXq0ympiuKLgStE4REMRJDSzcMs7IbcwQEbBNw0KtQayaWpmtrUQKebikEX8+pstbhtGogRIatgyG4FhYEUMg2GNI7cl2fZDl66zVqAgwvhy303AJRCjH0DSL2TFxi16ZCEPGO6HtMp6Xre8hPtan6OrCrqetjWTqPqdbBi2xYa12kyxMx173tx772rmoQFvEMASf6m6NqpnCabqvaMeexmca+9RZtO9nzsuwGEyAinBrR8axNwThQzihKkpS7nruB7KvnB-KoaKjbULMYl-i+VSAVcN4VeFtWNe4LXjo4Trut5PWgfkqlAkJWIviLKR71CGk-lGAILABQcHG6RwXEdumiPVzW2Cl2EZcWrnltJgau3sIIJgzUtrFBGlMKIYtLEpBGbwJATqfnMandTl23fxtmihKH2Ffk6GwJLG9y38RCK2LGljEHIgsxMZTbEaV4q3BFhorgTQhMIeW5Lsukemrxf3BePdflHcJfmrpHF8JaJDAiO7SHWcKd7JvRZlGUtfK9Kw5lcixRwsWrghRwCF-gBD+BYO63d3xQFfgXOkTRiQ2GiFIAc-wfgww2roG83xVL+SZASD0WFm5PhEsKMUkokTwM7OEGw9wb5lWUoyIwNIZ6+lASWJk0R7yLzut+RsNDgYBUPnYWwJ9Dxn2wXfFozIRiqViCSFepDazfjfKoahlF9byUQZbek5Z+KMjKoAgcyC3jJlcsmUO8xtqC1binFKUohHyVJIEDo7R8yuEBEyYqlsHIX3COWaepJk7hUalFKa-cVpRPxESGYgVizlhju4BG7EfgtFgnMZ0-xizdFCY9UW2MPoS1svnTsODQLVQCF8e+5YpARFhkSL0h5UxvGnjVWxLd7qq3bunZxe8mRgTLoeD0d8-RQRpKhUw-FSxQTCGEf4CQEhAA */
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
            actions: ["action:setCurrentArea"],
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
        const { mapRef, currentArea } = context;

        if (mapRef && currentArea) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "visible");

          const targetAreaIds = currentArea.flowDestinations.features.map(({ properties }) => properties.id);
          const features = mapRef.querySourceFeatures("area-tiles", {
            filter: ["in", "id", ...targetAreaIds],
            sourceLayer: "default",
          });
          for (let i = 0,  len = features.length; i < len; i ++) {
            mapRef.setFeatureState(
              {
                source: "area-tiles",
                sourceLayer: "default",
                id: features[i].id!,
              },
              { target: false }
            );
          }

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
        }

        return {};
      }),
      "action:setTransportationAreaView": assign(({ context }) => {
        console.log("action:setTransportationAreaView");

        const { mapRef, currentArea } = context;

        if (mapRef && currentArea) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "none");

          const targetAreaIds = currentArea.flowDestinations.features.map(({ properties }) => properties.id);
          const targetAreaBbox = bbox(currentArea.flowDestinations);
          const combinedBboxes = combineBboxes([targetAreaBbox, bbox(currentArea.boundingBox)]);
          mapRef.fitBounds(
            [
              [combinedBboxes[0], combinedBboxes[1]],
              [combinedBboxes[2], combinedBboxes[3]],
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

          const features = mapRef.querySourceFeatures("area-tiles", {
            filter: ["in", "id", ...targetAreaIds],
            sourceLayer: "default",
          });
          for (let i = 0,  len = features.length; i < len; i ++) {
            mapRef.setFeatureState(
              {
                source: "area-tiles",
                sourceLayer: "default",
                id: features[i].id!,
              },
              { target: true }
            );
          }
        }

        return {};
      }),
      "action:setImpactAreaView": assign(({ context }) => {
        console.log("action:setImpactAreaView");

        const { mapRef } = context;

        if (mapRef) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "none");
        }

        return {};
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
