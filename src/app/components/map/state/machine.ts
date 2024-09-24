import { bbox } from "@turf/bbox";
import { assign, createMachine, assertEvent, fromPromise } from "xstate";
import { StateEvents } from "./types/events";
import { StateActions } from "./types/actions";
import { BBox } from "geojson";
import { MapGeoJSONFeature, MapRef } from "react-map-gl/maplibre";
import { IMapPopup } from "../../map-popup";
import { EItemType } from "@/types/components";
import { FetchAreaResponse } from "@/app/api/areas/[id]/route";

interface StateContext {
  mapRef: MapRef | null;
  areaId: string | null;
  highlightedArea: MapGeoJSONFeature | null;
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
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQFoBOKECAbvgQMRjVgB2ALggIZlicKxgUYAMZsA2gAYAuolAAHNLFxtcaFrJAAPRAHYdEogGZDADh0mAbBYCcAJluGArIYA0IAJ6IAjBYNeJJhIALCbWOo62JoYWjgC+sW6omDh0JOSUNHSMzOwIALaccvloAK4CeWjMkjJIIApKKmoa2giWQUSWNj6RttZ9tm6eCIbWFkQSjkFBjqGjOjGG8YnoWHiERHKcMMUl7LgsUNmsHJvbFbvi0hr1yqrqtS22E0QzOvZBEl7OvTqDiLY6LwdCwhLzWKZeEy2CxLEBJVapApFc57A5HXJInbsarXRS3JoPRCOayOIxBQxffS+ayQkx-BAAoFtExgiFQmEJOErFLrbi8BAAMzAbGEAAt9ocIGowER9tQ0ABrGXwnnEPl8IUi8UHBBytDCTiNFjVHG1G5G5q6Cy2IheQwSBxvCZ6AL0gC0bxeEjsEzskR0H0WnJVazVPD4tEI6I46oQwiE3FN8jxFsJCC8XgDRGsnwpZhGEQD9J8fgCwVC4Ui0Tiwe5oaIscjDCYxy44f4ghElxqyYad0tCD6BkcEhs1mMkX84XpESIejeTwk5kM0yCMVhIdSjayLYxhR25UqYCTdRT-bTGdMc8zIWi82soTpHkQbqe1jnjinlkCYI5nJYaAQHAGiboQuJ9gSoAtG6Fjur0YzjlEMTmJYMzRBudapKQFBUE24H4vcUG6CSRAAtEJgjr0o46K4z4MhRtogo4ESQkEk5RBhyT1qcYBYioBz4amREIGx9K9O05h6FEQTzCyJhBJxCLrJiKL8VAgnnsJbHtCEEz+A44K9NYYngnOZjzAGIzBOhtZcVu7aamKEoaZBWi6CEZIPo4NjmDES4mbagKTME1JBOCZiKaqDbtnhZpnq5LT+J+c4WIYvSZg6EJBO6WYAp+zE+OOK6AvE8RAA */
    id: "globeView",

    types: {
      context: {} as StateContext,
      events: {} as StateEvents,
      actions: {} as StateActions,
    },

    context: {
      mapRef: null,
      areaId: null,
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
        },
      },

      "page:mounting": {
        on: {
          "event:page:mount": {
            target: "map:mounting",
            reenter: true,
            actions: "action:initializeContext",
          },
        },
      },

      "map:mounting": {
        on: {
          "event:map:mount": {
            target: "world:view",
            reenter: true,
            actions: "action:setMapRef",
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
        },

        entry: "action:setAreaMapView",
      },
    },

    initial: "page:mounting",
  },
  {
    actions: {
      "action:initializeContext": assign(({ event }) => {
        assertEvent(event, "event:page:mount");
        return {
          ...event.context,
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
          mapPopup: feature
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
            padding: 400,
          }
        );

        return {
          mapBounds: bounds,
        };
      }),
      "action:setCurrentAreaId": assign(({ event }) => {
        assertEvent(event, "event:area:select");
        return {
          currentAreaId: event.areaId,
        };
      }),
      "action:area:clear": assign({
        areaId: undefined,
      }),
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
