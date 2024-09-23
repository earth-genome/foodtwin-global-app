import { bbox } from "@turf/bbox";
import { assign, createMachine, assertEvent } from "xstate";
import { StateEvents } from "./types/events";
import { StateActions } from "./types/actions";
import { BBox } from "geojson";
import { MapGeoJSONFeature, MapRef } from "react-map-gl/maplibre";
import { IMapPopup } from "../../map-popup";
import { EItemType } from "@/types/components";

interface StateContext {
  mapRef: MapRef | null;
  areaId: string | null;
  highlightedArea: MapGeoJSONFeature | null;
  mapPopup: IMapPopup | null;
  mapBounds: BBox | null;
  eventHandlers: {
    mousemove: boolean;
  };
}

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHS4B2uALrgIYoDEYAbmKRQtQE5jUKxgpgAxhQDaABgC6iUAAc0sSrjSlpIAB6IArAE4A7EQDMBgCwAmYwYAclg7u0BGYwBoQAT0SX7Re5d3ndYtqaAGyWYpoAvhEuqJg4+MSc3Lz8QhSQDMys7Fw8ggKc4lJIIHIKVMqqGgg6moYW9poBwYE+li7uCPa6wUSapi1GA76aBqaWUTHoWHiEREk8fALCGUwsbAspy6KSqmWKlSXVxvamRMZiBsHGOmPBpprGuh2IDkRi45f23WH2HxPRECxGYJIgyagwBAAWzQAFdWGQoJl1ghwZCYfCdsVZPIDiojohTOE+r5TOYxI0xnoXghTLovJZrp5tMYTpYBpMgdN4nModQZNC4QjSEi1tk+QKMawintcRV8aBqrV6gZGs1WtYaXSGUz7Cy2RzAcCecQyIpaMjxfzBbC+DDmDKSvt5VUPNciIzgg57uztH7TDSDNpeuFWZpLH7gj1RlFAaQ0BA4KpjbMCLLykoFepEABaYI0vPvMTFgxiUJR0v-Tkp0Fmqi0dN410IOx1OlXSyaD7aMu6Axazvea6afo+MyeGzV7mp+a5LZpSCNl0EhBmfQhIlBHpmKP5tyIPVeK6hfomB7eqdxGdosA24VQJeZ5tmLUsoi6Xwfkw9CfGS8g3lrSlKgRUfQ5FUQMxjHOMJND+UwgzMP1X2gj9dB6XQLB7CxgljCIgA */
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
      mapPopup: null,
      mapBounds: null,
      eventHandlers: {
        mousemove: true,
      },
    },

    states: {
      initial: {
        on: {
          "event:area:select": {
            target: "area:selected",
            actions: "action:area:select",
          },

          "event:map:mousemove": {
            target: "initial",
            actions: "action:setHighlightedArea",
          },
        },
      },

      "area:selected": {
        on: {
          "event:area:clear": {
            target: "initial",
            actions: "action:area:clear",
          },

          "event:area:select": {
            target: "area:selected",
            actions: "action:area:select",
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
            target: "initial",
            reenter: true,
            actions: "action:setMapRef",
          },
        },
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
      "action:area:select": assign(({ event }) => {
        assertEvent(event, "event:area:select");
        return {
          areaId: event.area.properties.id,
          mapBounds: bbox(event.area),
        };
      }),
      "action:area:clear": assign({
        areaId: undefined,
      }),
    },
  }
);
