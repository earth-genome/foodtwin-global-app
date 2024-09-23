import { bbox } from "@turf/bbox";
import { assign, createMachine, assertEvent } from "xstate";
import { StateContext, StateActions, StateEvents } from "./types";

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQCyAhgA4AEusV6ZEuAdlAMQRrNhEsBuaANY8AZmAAuAYwAW5CgBEy4sgG0ADAF1EoCmli5xuLtpAAPRAEYALAFYiAThsB2J-YAc9gGxqATF4DMTgA0IACeiAC0bhZE-jZuTv7+9u5uVm7+VgC+WSGomDj4xHI0dAxMrGxgAE7VaNVEFChKIvUAtkRiUrKUisrqWkgguvqGxkPmCMluRBY2VmrWFvZWPpkWIeEIERZunkRONn7RLnE+Pp6eOXnoWHiERACSzAa4ZChU+VhUfEVsAMpgFBgSTiKhkapgVSaEwjV7jUCTNSbRBqa4gL6FB4AYTQAFdmOJqqFSlRYECQeJIGxscCIeDIWQyRTQUZmANYXp4cwTEiUQg0bkMbcscRcQSiSTaMzgaDqYDZWCIVCOUM4WMeRNIv41ERPPZrGorPYfK5PLZTfyrBYnEQrFYktavJ4-D5skLMfdiAAFMgwUltfGEljsX3+6RkOiBiWQVU6Lka3mWWx2zwWQILNxpE2+fkRHUzfwZOIm2zufwWHJC5hoCBwEyeoqc0ZspPbJwzfWG42mry2fx59IzNbWLNqOL2xLoxsPErS8oh5vcttOKx6qwu+xnCxqRIrPM+CwxNzxFw2LwWQ+Vj0ir1PF6Gd6fEU-JtqhOtrUIOb+IjRfz6moQEdm6-KOH+q6eB2HhFrs0TTreRREOKhLEqS5KKpAS6Jl+FjeAc45xJcZ5dvySQxFu5xOD4ajeOOThXDeBR3gAqtwpgUJSkBUDUdTVNhn6IogdGzCsiw2EciwrAOYSRHBRA2LslHxMaUE2IxNzMUhYZgAGQaGKwAkImYlhHEQtELDqW7uE44mDos5n2jRajOPMyzujkQA */
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

      "Unexpected error": {},

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
