import { bbox } from "@turf/bbox";
import { assign, createMachine, assertEvent } from "xstate";
import { StateContext, StateActions, StateEvents } from "./types";

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHS4B2uALrgIYoDEYAbmKRQtQE5jUKxgpgAxhQDaABgC6iUAAc0sSrjSlpIAB6IAjAE4AbETFiALACYjADnOmA7GO2aAzABoQAT0QBaTZv1jzusU0AVmCHTXMg62sAX2iXVEwcfGJObl5+IQpIBmZWdi4eQQFOcSkkEDkFKmVVDQQPByJrcOswyN0TB21m7Rd3eu9ff0CQoLCI611Y+PQsPEIiVJ4+AWFsphY2JfTV0UlVSsUa8rrNE2siHyNNMSCg3V0HMWbrPq0HIKJza3NHbzHzH5NNMQAk5skiDJqDAEABbNAAV1YZCgOU2CChMPhSKyEFKB3kRxUJ08JjERAczXMlPuZiCt10QTe9QcHQMH10Okeula1jMsTiIFIaAgcFUYKShAJVSUxNAdQ8unMFKpNI6RnpkWZHjGRiIRl02j813M2iCgIcIIl82IZEUtGlRNqiEpBnMJiC3Q9ZgclO1Jk0ep+Su8H2e1w+VtmkpSBR2mUgjuqcvUiAuYUpmkmRlMfjJrzcWnJrW09kCWZzjMcUcSNsh0LAcMRyNIUCTsudCE0XzC10DhuMXSMem1OYuJl+gPp4TD5wF0SAA */
    id: "globeView",

    types: {
      context: {} as StateContext,
      events: {} as StateEvents,
      actions: {} as StateActions,
    },

    context: {
      areaId: null,
      mapBounds: null,
    },

    states: {
      initial: {
        on: {
          "event:area:select": {
            target: "area:selected",
            actions: "action:area:select",
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
          "event:page:mounted": {
            target: "initial",
            reenter: true,
            actions: "action:initializeContext",
          },
        },
      },
    },

    initial: "page:mounting",
  },
  {
    actions: {
      "action:initializeContext": assign(({ event }) => {
        assertEvent(event, "event:page:mounted");
        return {
          ...event.context,
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
