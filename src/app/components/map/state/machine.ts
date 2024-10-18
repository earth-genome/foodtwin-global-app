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
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggLYCGADl2gCusMJzTMA2gAYAuolC80sXG1xoW8kAA9EAdgCMAViIBOABxmAbGYAsAJhP6p+s-oA0IAJ6IAtPssmRJb6LrqGunaGdgEAzCYAvvEeqJg4dCTklDR0jMzsXHwCwmBCbNJySCCKyqrqmjoIJpY2RHZmJjHWllLhuk0e3gg+Di1SMWZ2NlGWMX2ulonJ6Fh4hBkUVLSEuawcghQIu2Bk5ZrVKmoalQ0+No5Ehu2WfTa6E1KuA74jRGMTU9FZuZ-IsQCkVukePwxIJ2LgWFAdvkoUV2KdKudaldQDcrGZTLpdDEnFJJmE3l8EDM7EFbPpdDYphFDJZDKDwWk1twyGBuAgAGZgNgAYwAFvDERB1GAiPDqGgANYyjmrYjc3kCoViiUIOVoYXcLHldEKJQXOrXRD6GwBIhmKTmWZvemUkyGGJEGxmML6Oydb2GGwxdnLTlqnl8rYMJi7BDqvnClC8k6yM5mrH1RAxOKemJjSwOJwhOyU-QmQJuuL6cYzEwM6Ih1Kqojx7LbGPIwowkRiSSpjHpy6ZobNB52Ax-WZmOIxEteRDPFrlmbNaIRDoJJJg0PN1tRpEcFHdkqCMr9001IeWob+0zuhzj4mOFyUgL6T2M6w1guvTdLJvpHuOQdnsBxHCmFQXua2LaL4i6-LOQZ2PShiktWpbOIE9qMt6UiMgywSNhCXIRm24YalGApoGgEAAApkDRgjCpAB5xqRIhJsKbAAGLURAAAqZDcCwsCKGQbCGpcJpVIOFo4r4fS-MhTLRF0kwxK+WFRLYhI9P6wZbiqgGkVGLYmXQVE0YJwmieQElYqxrYcWAXG8TR9GMcxEDSZiV7yTebpEPWeb+P4MReuh84IGEQUWA6Ewsr6Bi6ERYZmRRxkZYQlkCUJIlifZlyOexYCcWwACSnC8NwXE+bJME3LOvxujMhhuoY7qWCulKzh6Bbjq8qGdX0qW7uZJFZQQupVTVbDFRqzmuXx1n5XZknqHVl5ybBQz2FIRDhdOMSof4zzTD1fpBHYA1hHpzxmKN6TVTACDoNwED0Jt0HDiE9J2rOFhJQRFJRfYgR3N6wSMm15Z4Y9azPWAr1oO9n36JBMlbQ1Vp2A6RD0s41hxQyQavhEDxmG1HwdSYbS0-DxCI6iqgIqxTMwmi56Y9914+N676zOEzx4UYDruFF2aBNp44TOpsMLKCLA0XAmhGYQaZY8OPiOIEgu6MLNii44lK3N6B3BP4HThSyPQM+sWRRhrPP+c0+0dBE1jVpTViGCb2bvqys6+u69hxAydtHkIcIIk7Ga85TxjNF7nSTF1xug1YB14W8rI+jYzh262goiuKMcDpr17WtEQVBpTQY2mEtM9Y8DyOBMcSMvYBaF+NBCx35O23NYB1etmJ1dWE0Qm-4+3Tob-jetEy4pYZO6ZZG69kTlHkQExkD99tNwuIEafVo84xBsSlgm9X2aG3hVhtPPjI95N6Ub9l-LLXltnietMG+UPt8D4QRDb61xu0DoeFSy01MFIBkzgbT2h6NWV+H9yLoOmtVLiB9sZDDCkpKYPsDDlj6NfUGdxWjBGiFIRcyFZx2yZm9CAuCtYFnBuMBkThaYzBtH7csdoLYBDXI4a6Ct-zEUZtwF6HMWZQFYfHFueFZip0fBYEwlJkLvjaLoeBbodaOGeIkRIQA */
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
          input: ({ context: { currentAreaId, currentArea } }) => ({
            areaId: currentAreaId,
            currentArea
          }),
          onDone: {
            target: "area:view",
            actions: "action:setCurrentArea",
          },
        },
      },

      "area:view": {
        initial: "area:view:foodProduced",
        states: {
          "area:view:foodProduced": {
            on: {
              "event:area:selectFoodTransportation": {
                target: "area:view:foodTransportation",
                reenter: true
              }
            }
          },
          "area:view:foodTransportation": {
            on: {
              "event:area:selectFoodProduced": {
                target: "area:view:foodProduced"
              },
              "event:area:selectImpact": {
                target: "area:view:impact"
              }
            }
          },
          "area:view:impact": {
            on: {
              "event:area:selectFoodTransportation": {
                target: "area:view:foodTransportation"
              }
            }
          },
        },
        on: {
          "event:area:clear": {
            target: "world:view",
            actions: "action:area:clear",
            reenter: true,
          },

          "event:map:mousemove": {
            target: "area:view",
            actions: "action:setHighlightedArea",
            reenter: true
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

        entry: [
          "action:parseAreaSection",
          "action:setAreaMapView",
        ],
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
      "actor:fetchArea": fromPromise<FetchAreaResponse, { areaId: string, currentArea: FetchAreaResponse }>(
        async ({ input }) => {
          const { areaId, currentArea } = input;
          if (areaId === currentArea?.id) {
            return currentArea;
          }
          const response = await fetch(`/api/areas/${input.areaId}`);
          return await response.json();
        }
      ),
    },
  }
);
