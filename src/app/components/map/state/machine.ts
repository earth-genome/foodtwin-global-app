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
import { Legend } from "../legend";
import { AREA_SOURCE_ID, AREA_SOURCE_LAYER_ID } from "../constants";

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
  legend: Legend | null;
  highlightedArea: GeoJSONFeature | null;
  currentAreaId: string | null;
  currentArea: FetchAreaResponse | null;
  currentAreaFeature: GeoJSONFeature | null;
  currentAreaViewType: EAreaViewType | null;
  destinationPortsIds: number[];
  destinationAreasFeatureIds: number[];
  mapPopup: IMapPopup | null;
  mapBounds: BBox | null;
  eventHandlers: {
    mousemove: boolean;
  };
}

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggLYCGADl2gCusMJzTMA2gAYAuolC80sXG1xoW8kAA9EARgAcAZiIB2AGz7dUswE4ArHbOGATDYA0IAJ6I7zoobNfQwAWYJCnKRtnAF9oj1RMHDoSckoaOkZmdi4+AWEwITZpOSQQRWVVdU0dBEM7KSIbfTMTZ10bFydg-Q9vBAMG3RcpXWdXYOsnG1j49Cw8QhSKKlpCTNYOQQoEDbAyYs1ylTUNUpqAWkNDfSJ9ZzMpMYfnQyl9dy9Ec9siA11dEx2GxNe4GYIzEAJebJHj8MSCdi4FhQdbZWF5dgHUpHSqnUAXMy6OxEZzmO5SOqjRwfPrfaxEUI2N5Ah6AuwmCFQpKLbhkMDcBAAMzAbAAxgALJEoiDqMBEJHUNAAazlXIWxF5-KFIolUoQCrQou4uOKWIUSmOVTOehGfnq13ewTM3QBhl6iGcUhMDJMXoCvuBhiJnLm3OIvG4MAQ6G4EHoZrKFtx1S+HVMDl8vl0wXqQLs7oQ52cdl0DMcJmCYxMNhMrSGIcS6qIEajMbjEl0JXNFROKYQrUGLOLNlGjzuBfOBm9w0rL3+vruDehixbYGjaFj8ecXcTPat+JthhsRBaR5c12zBh6n0LLSI5bCXv+umdBiXYebkbX8MRyNRHFXDEilkQ4k17a1bwBRoHWzOp9AcIwJ2aYkbBaatuidd4onfJtNQFVYCB2dg9ileMQOxMD920RAjAaEwAQMAIATMQIzALWwGgmCx7FtEcbHBOJIVDXC+XwugiLYEi-w7HccXAg8EH0elujsINnDuQlRhMAsrEcfxzGCCsiSPbocOSPD0kICSpJRCRt1Avc8Wo-t7H8EdHBzbN6MrHSLD8WxrkMQEvJcGJBLVczRMswjdjIUiJEMWTKKcmp9EBW4nCBJl7maIYCzGR5TAveilMeLozJ5KKCIQXgyDQCBBFFXF-wQLYUGs-ZyO7S0Uq+OpjE9VwgVCdkRn4nTHm9JoWlCIYgSGQwKo1KrxNq+rGuapgNhyOEhBEMRJC63cer7J1gmgnM7CMEIOnCHSrj8V5XmLFxgiJHMlqICzqrWhqmpOFr0XhERCgTOSqJqIMbikdk-gpBxs0CHT2mPbMmRrZwnWuMLZkbSKtWqtgyG4FhYEUMg2GNAGtuyNqOrB5K+0uVSSUeex+JzX12mCXyc3TMZLCG0lHk+77xKJkmyfISnNqyDggb20RxDABnHL7F5jweSaTGeytglQnTq0195IngqQpCdOxRZWqyJdJ8mZepuWdryEHBGApK1Ygh1flQhj3nuCx8xvdpiyISJ9f0JTLH+D7wuE-GxKs3BOAjJqWrp2LVZOiDmYGtnhs5saeZvArOPg30wjsEb+OtgnxJTtO2EB3JgaVw7PZzhTQm9BamiJdSgX9fLZtuEcWOr8YRjrpPCMb7h05p+XW8V0GjvB3qEHUm4rBaDTqRacbS5cUtnoti3gUJIKZ+ihAWDQAAxdACFgDPtiz9fGdz-rWfGK5WhMDHdiUdfjV1eFhI8pIwqCXvhAOAmgIqEAcl3Zy3wlLpkuo8J6-cJxWEsPeIM-Ecp3A6AJXGy5iCkGWNFZByZc6jGPE8TCUcmGAInFEUwzR4K5QrJpfQn0FYIlUMiWh8lUHPFZqEV4-F-bOAnPRVGI51LOj9ldHGQk8aVS1MKMUkoREUS9gpKwFtbjVyGEpEIoRSQFjeieQBV09b8QCDmMhGiKGflbBuCAoiIZfCcH4QEmCXgUhwTec4YRvRAjGuPKsThPqAR-MIqAPjN50nOg8NC3MpHXlpMCc6noIGGQ6JMG+1VYpShSX2WspYJjcyMFYTCNJEBBXOhbV4MMo7PEeK4xBy165WV+htMRG8mbVhPI6f4ZgxhozeBNExF4Lb6FCKVUIpTxbE3ttLKmVERn0PuAyYs1hXhOBYsFXmxhbCBCJPYHWR4OTx00X02e+pU4LzYJU+hhUsy2nqdWB4TSt5EjopWCwzxAjmytg89xYsrL3yfmgF+HyFLnDGdxCY1xzaekiACli50JiAmQoCQI1ZYixCAA */
    id: "globeView",

    types: {
      context: {} as StateContext,
      events: {} as StateEvents,
      actions: {} as StateActions,
    },

    context: {
      viewType: EViewType.world,
      mapRef: null,
      legend: { type: "category" },
      highlightedArea: null,
      currentAreaId: null,
      currentArea: null,
      currentAreaFeature: null,
      currentAreaViewType: null,
      destinationAreasFeatureIds: [],
      destinationPortsIds: [],
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
            actions: ["action:resetAreaViewMap", "action:setCurrentArea"],
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
            guard: "guard:areaHasNoFlows",
            reenter: true,
          },
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

        entry: "action:enterAreaView",
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

        entry: [
          "action:fitMapToCurrentAreaBounds",
          "action:enterProductionAreaView",
        ],

        exit: "action:exitProductionAreaView",
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

        entry: "action:enterTransportationAreaView",
        exit: "action:exitTransportationAreaView",
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

        entry: [
          "action:fitMapToCurrentAreaBounds",
          "action:enterImpactAreaView",
        ],

        exit: "action:exitImpactAreaView",
      },

      "area:view:noFlows": {
        on: {
          "event:url:enter": {
            target: "page:load",
            reenter: true,
          },
        },

        entry: ["action:fitMapToCurrentAreaBounds"],
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
          layers: ["top-ports", "area-clickable-polygon"],
        });

        const feature = features && features[0];

        let highlightArea = null;
        if (feature && feature.layer?.id === "area-clickable-polygon") {
          mapRef.setFeatureState(feature, { hover: true });
          highlightArea = feature;
        }

        const layerToIconTypeMap: Record<string, EItemType> = {
          "top-ports": EItemType.node,
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
      "action:resetAreaViewMap": assign(({ context }) => {
        const { mapRef, currentAreaFeature, destinationAreasFeatureIds } =
          context;

        if (!mapRef) return {};

        if (currentAreaFeature?.id) {
          mapRef.setFeatureState(
            {
              source: AREA_SOURCE_ID,
              sourceLayer: AREA_SOURCE_LAYER_ID,
              id: currentAreaFeature.id,
            },
            { selected: false }
          );
        }

        const m = mapRef.getMap();
        for (const destinationAreaFeatureId of destinationAreasFeatureIds) {
          m.setFeatureState(
            {
              source: AREA_SOURCE_ID,
              sourceLayer: AREA_SOURCE_LAYER_ID,
              id: destinationAreaFeatureId,
            },
            { destination: false }
          );
        }

        return { destinationAreasFeatureIds };
      }),
      "action:setCurrentArea": assign(({ event, context }) => {
        assertEvent(event, "xstate.done.actor.0.globeView.area:fetching");
        const { mapRef } = context;

        if (!mapRef) return {};

        const features = mapRef?.querySourceFeatures(AREA_SOURCE_ID, {
          filter: ["==", "id", event.output.id],
          sourceLayer: AREA_SOURCE_LAYER_ID,
        });
        const feature = features && features[0];
        if (feature && feature.id) {
          mapRef?.setFeatureState(
            {
              source: AREA_SOURCE_ID,
              sourceLayer: AREA_SOURCE_LAYER_ID,
              id: feature.id,
            },
            { selected: true }
          );
        }

        const destinationAreaIds = event.output.destinationAreas.features.map(
          ({ properties }) => properties.id
        );

        const destinationAreasFeatureIds = mapRef
          .querySourceFeatures(AREA_SOURCE_ID, {
            filter: ["in", "id", ...destinationAreaIds],
            sourceLayer: AREA_SOURCE_LAYER_ID,
          })
          .map((feature) => feature.id as number); // we are sure that the id is a number, because we are not using promoteId from MapboxGL

        for (const destinationAreaFeatureId of destinationAreasFeatureIds) {
          mapRef.setFeatureState(
            {
              source: AREA_SOURCE_ID,
              sourceLayer: AREA_SOURCE_LAYER_ID,
              id: destinationAreaFeatureId ?? "",
            },
            { destination: true }
          );
        }

        return {
          currentArea: event.output,
          currentAreaFeature: feature,
          destinationAreasFeatureIds,
        };
      }),
      "action:enterProductionAreaView": assign(({ context }) => {
        const { mapRef } = context;

        if (mapRef) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "visible");
          m.setLayoutProperty("selected-area-overlay", "visibility", "visible");
        }

        return {
          legend: { type: "category" } as Legend,
        };
      }),
      "action:exitProductionAreaView": assign(({ context }) => {
        const { mapRef } = context;

        if (mapRef) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "visible");
          m.setLayoutProperty("selected-area-overlay", "visibility", "none");
        }

        return {};
      }),

      "action:enterTransportationAreaView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        if (!mapRef || !currentArea) return {};

        const m = mapRef.getMap();

        // Disable unwanted layers
        m.setLayoutProperty("foodgroups-layer", "visibility", "none");
        m.setLayoutProperty("area-population-fill", "visibility", "none");

        const destinationAreaBbox = bbox(currentArea.destinationAreas);
        const destinationPortsBbox = bbox(currentArea.destinationPorts);
        const combinedBboxes = combineBboxes([
          destinationAreaBbox,
          destinationPortsBbox,
          bbox(currentArea.boundingBox),
        ]);

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

        const destinationPortsIds = currentArea.destinationPorts.features.map(
          ({ properties }) => parseInt(properties.id_int)
        );

        // Enable desired layers
        m.setLayoutProperty(
          "destination-areas-outline",
          "visibility",
          "visible"
        );

        return { destinationPortsIds, legend: null };
      }),
      "action:exitTransportationAreaView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        if (mapRef && currentArea) {
          const m = mapRef.getMap();

          // Disable desired layers
          m.setLayoutProperty(
            "destination-areas-outline",
            "visibility",
            "none"
          );
        }

        return {
          destinationPortsIds: [],
        };
      }),
      "action:enterImpactAreaView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        if (mapRef && currentArea) {
          const m = mapRef.getMap();
          m.setLayoutProperty("foodgroups-layer", "visibility", "none");

          const destinationAreaBbox = bbox(currentArea.destinationAreas);
          const combinedBboxes = combineBboxes([
            destinationAreaBbox,
            bbox(currentArea.boundingBox),
          ]);

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

          // Build population scale
          const maxPopulation = Math.max(
            currentArea.totalpop,
            ...currentArea.destinationAreas.features.map(
              ({ properties }) => properties.totalpop
            )
          );

          const minPopulation = Math.min(
            currentArea.totalpop,
            ...currentArea.destinationAreas.features.map(
              ({ properties }) => properties.totalpop
            )
          );
          m.setPaintProperty("area-population-fill", "fill-opacity", [
            "interpolate",
            ["linear"],
            ["get", "totalpop"],
            minPopulation,
            0.3,
            maxPopulation,
            0.9,
          ]);
          m.setLayoutProperty("area-population-fill", "visibility", "visible");

          const legend: Legend = {
            type: "population",
            range: [minPopulation, maxPopulation],
          };

          return {
            legend,
          };
        }

        return {};
      }),
      "action:exitImpactAreaView": assign(({ context }) => {
        const { mapRef, currentArea } = context;

        if (mapRef && currentArea) {
          const m = mapRef.getMap();
          m.setLayoutProperty("area-population-fill", "visibility", "none");
        }

        const legend: Legend = {
          type: "category",
        };

        return {
          legend,
        };
      }),
      "action:fitMapToCurrentAreaBounds": assign(({ context }) => {
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
          const m = mapRef.getMap();
          m.setLayoutProperty("top-ports", "visibility", "visible");
          m.setLayoutProperty("foodgroups-layer", "visibility", "visible");

          if (currentAreaFeature?.id) {
            mapRef.setFeatureState(
              {
                source: AREA_SOURCE_ID,
                sourceLayer: AREA_SOURCE_LAYER_ID,
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
          legend: { type: "category" } as Legend,
        };
      }),
      "action:enterAreaView": ({ context }) => {
        const { mapRef } = context;

        if (!mapRef) return;

        const m = mapRef.getMap();
        m.setLayoutProperty("top-ports", "visibility", "none");
      },
    },
    guards: {
      "guard:isWorldView": ({ context }) => {
        return context.viewType === EViewType.world;
      },
      "guard:areaHasNoFlows": ({ context }) => {
        return context.currentArea?.destinationAreas.features.length === 0;
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
