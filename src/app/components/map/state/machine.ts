import { bbox } from "@turf/bbox";
import { assign, createMachine, assertEvent } from "xstate";
import { StateEvents } from "./types/events";
import { StateActions } from "./types/actions";
import { BBox } from "geojson";

interface StateContext {
  areaId: string | null;
  mapBounds: BBox | null;
}

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHS4B2uALrgIYoDEYAbmKRQtQE5jUKxgpgAxhQDaABgC6iUAAc0sSrjSlpIAB6IArAE4A7EQDMBgCwAmYwYAclg7u0BGYwBoQAT0SX7Re5d3ndYtqaAGyWYpoAvhEuqJg4+MSc3Lz8QhSQDMys7Fw8ggKc4lJIIHIKVMqqGgg6moYW9poBwYE+li7uCPa6wUSapi1GA76aBqaWUTHoWHiEREk8fALCGUwsbAspy6KSqmWKlSXVxvamRMZiBsHGOmPBpprGuh2IDkRi45f23WH2HxPRECxGYJIgyagwBAAWzQAFdWGQoJl1ghwZCYfCdsVZPIDiojohTOE+r5TOYxI0xnoXghTLovJZrp5tMYTpYBpMgdN4nModQZNC4QjSEi1tk+QKMawintcRV8aBqrV6gZGs1WtYaXSGUz7Cy2RzOaQ0BA4KpgTyCLLykoFepEABaYI0p2ci2zYhkRS0a14qqIOx1OlXSyaD7aMTBXQGLWh7zXTT9HxmTw2N3cj3zXJbNKQX3y-0IMz6EJEoI9MxR51uRB6rxXUL9EwPBzBdNxTNosCCzGI-O2wtmLUsoi6Xxjkw9VPGdsg3n8nvCqD9w6KxBmYznMKaP6mAws0zabTDzdj3Q9XQWCMWNtRCJAA */
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
